import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/errors";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: "Not found", path: req.path });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.flatten() });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
