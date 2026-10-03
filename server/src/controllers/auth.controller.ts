import { CookieOptions, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { config } from '../utils/config';
import { ok } from '../utils/response';
import { currentUserId } from '../middleware/auth';
import { usersService } from '../services/users.service';
import { loginSchema, registerSchema } from '../validators/auth.validators';

const REFRESH_COOKIE = 'tf_refresh';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: config.isProduction ? 'none' : 'lax',
  path: '/api/auth',
  maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
};

function sendSession(res: Response, session: { user: unknown; accessToken: string; refreshToken: string }, status = 200) {
  res.cookie(REFRESH_COOKIE, session.refreshToken, cookieOptions);
  return ok(res, { user: session.user, accessToken: session.accessToken }, status);
}

export const authController = {
  async register(req: Request, res: Response) {
    const input = registerSchema.parse(req.body);
    sendSession(res, await authService.register(input), 201);
  },

  async login(req: Request, res: Response) {
    const { email, password } = loginSchema.parse(req.body);
    sendSession(res, await authService.login(email, password));
  },

  async refresh(req: Request, res: Response) {
    try {
      sendSession(res, await authService.refresh(req.cookies?.[REFRESH_COOKIE]));
    } catch (error) {
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
      throw error;
    }
  },

  async logout(req: Request, res: Response) {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions, maxAge: undefined });
    ok(res, { loggedOut: true });
  },

  async me(req: Request, res: Response) {
    ok(res, await usersService.getMe(currentUserId(req)));
  },
};
