import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { config } from './config';

export interface AccessPayload {
  sub: number;
  username: string;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign({ username: payload.username }, config.jwtAccessSecret, {
    subject: String(payload.sub),
    expiresIn: config.accessTokenTtl,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.jwtAccessSecret) as jwt.JwtPayload;
  return { sub: Number(decoded.sub), username: String(decoded.username) };
}

export function signRefreshToken(userId: number): string {
  return jwt.sign({ jti: crypto.randomUUID() }, config.jwtRefreshSecret, {
    subject: String(userId),
    expiresIn: `${config.refreshTokenTtlDays}d`,
  });
}

export function verifyRefreshToken(token: string): number {
  const decoded = jwt.verify(token, config.jwtRefreshSecret) as jwt.JwtPayload;
  return Number(decoded.sub);
}

export const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
