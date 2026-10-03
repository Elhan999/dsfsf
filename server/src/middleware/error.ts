import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found.' });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  if (error instanceof ZodError) {
    const issue = error.issues[0];
    const field = issue?.path.join('.');
    return res.status(400).json({
      success: false,
      message: field ? `${field}: ${issue.message}` : (issue?.message ?? 'Invalid request.'),
      errors: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({ success: false, message: 'Malformed JSON body.' });
  }
  console.error(error);
  res.status(500).json({ success: false, message: 'Internal server error.' });
}
