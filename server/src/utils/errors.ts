export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export const badRequest = (message = 'Bad request.') => new AppError(400, message);
export const unauthorized = (message = 'Authentication required.') => new AppError(401, message);
export const forbidden = (message = 'You do not have permission to do this.') => new AppError(403, message);
export const notFound = (message = 'Not found.') => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);

/** Postgres unique_violation */
export const isUniqueViolation = (error: unknown): error is { code: string; constraint?: string } =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';
