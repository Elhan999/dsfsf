import bcrypt from 'bcryptjs';
import { query, queryOne } from '../db/pool';
import { config } from '../utils/config';
import { conflict, isUniqueViolation, unauthorized } from '../utils/errors';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/tokens';
import { usersService } from './users.service';

interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
}

const REUSE_GRACE_MS = 15_000;
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 12);

async function issueTokens(user: { id: number; username: string }) {
  const accessToken = signAccessToken({ sub: user.id, username: user.username });
  const refreshToken = signRefreshToken(user.id);
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, NOW() + ($3 || ' days')::interval)`,
    [user.id, hashToken(refreshToken), String(config.refreshTokenTtlDays)],
  );
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      const user = await queryOne<{ id: number; username: string }>(
        `INSERT INTO users (name, username, email, password_hash)
         VALUES ($1, $2, $3, $4) RETURNING id, username`,
        [input.name, input.username, input.email, passwordHash],
      );
      const tokens = await issueTokens(user!);
      return { user: await usersService.getMe(user!.id), ...tokens };
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw conflict(
          error.constraint?.includes('email') ? 'This email is already registered.' : 'This username is taken.',
        );
      }
      throw error;
    }
  },

  async login(email: string, password: string) {
    const user = await queryOne<{ id: number; username: string; password_hash: string }>(
      'SELECT id, username, password_hash FROM users WHERE email = $1',
      [email],
    );
    // Compare against a dummy hash when the user is missing to keep timing uniform.
    const hash = user?.password_hash ?? DUMMY_HASH;
    const valid = await bcrypt.compare(password, hash);
    if (!user || !valid) throw unauthorized('Invalid email or password.');
    const tokens = await issueTokens(user);
    return { user: await usersService.getMe(user.id), ...tokens };
  },

  /** Rotates the refresh token. Reusing a revoked token revokes every session of that user. */
  async refresh(refreshToken: string | undefined) {
    if (!refreshToken) throw unauthorized('No refresh token.');
    let userId: number;
    try {
      userId = verifyRefreshToken(refreshToken);
    } catch {
      throw unauthorized('Invalid refresh token.');
    }
    const stored = await queryOne<{ id: number; revoked_at: Date | null; expires_at: Date }>(
      'SELECT id, revoked_at, expires_at FROM refresh_tokens WHERE token_hash = $1 AND user_id = $2',
      [hashToken(refreshToken), userId],
    );
    if (!stored) throw unauthorized('Invalid refresh token.');
    // A token rotated moments ago is most likely a concurrent refresh (two tabs, a retried request),
    // not theft — let it through. Older reuse revokes every session of the user.
    const withinGrace = stored.revoked_at && Date.now() - stored.revoked_at.getTime() < REUSE_GRACE_MS;
    if (stored.revoked_at && !withinGrace) {
      await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
      throw unauthorized('Refresh token reuse detected. Please log in again.');
    }
    if (stored.expires_at < new Date()) throw unauthorized('Session expired. Please log in again.');

    if (!stored.revoked_at) await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1', [stored.id]);
    const user = await queryOne<{ id: number; username: string }>('SELECT id, username FROM users WHERE id = $1', [
      userId,
    ]);
    if (!user) throw unauthorized('User no longer exists.');
    const tokens = await issueTokens(user);
    return { user: await usersService.getMe(user.id), ...tokens };
  },

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;
    await query('UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL', [
      hashToken(refreshToken),
    ]);
  },
};
