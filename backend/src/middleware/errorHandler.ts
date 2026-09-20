import type { NextFunction, Request, Response } from 'express';

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const e = err as { status?: number; message?: string; code?: string };
  if (e?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'A record with these details already exists.' });
  }
  if (e?.code === 'ER_NO_REFERENCED_ROW_2' || e?.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ error: 'Operation conflicts with existing records (foreign key).', details: e.message });
  }
  if (e?.code === 'ECONNREFUSED' || e?.code === 'ER_ACCESS_DENIED_ERROR') {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }
  const status = e?.status || 500;
  if (status >= 500) console.error(`✗ ${req.method} ${req.path}:`, err);
  res.status(status).json({ error: e?.message || 'Internal server error' });
}
