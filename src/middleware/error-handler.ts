import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      details: err.details ?? null
    });
    return;
  }

  const message = err instanceof Error ? err.message : "Unknown error";
  res.status(500).json({ error: "Internal server error", details: message });
}
