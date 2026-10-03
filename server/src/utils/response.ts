import { Response } from 'express';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
}

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

export function list<T>(res: Response, data: T[], pagination: Pagination, extra: Record<string, unknown> = {}) {
  return res.json({ success: true, data, pagination, ...extra });
}
