import { NextFunction, Request, Response } from 'express';
import { unauthorized } from '../utils/errors';
import { verifyAccessToken } from '../utils/tokens';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: number; username: string };
    }
  }
}

function readBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (!token) return next(unauthorized());
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, username: payload.username };
    next();
  } catch {
    next(unauthorized('Invalid or expired access token.'));
  }
}

/** Attaches req.user when a valid token is present, but never rejects. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readBearer(req);
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub, username: payload.username };
    } catch {
      // treat as anonymous
    }
  }
  next();
}

/** For handlers behind requireAuth. */
export function currentUserId(req: Request): number {
  if (!req.user) throw unauthorized();
  return req.user.id;
}
