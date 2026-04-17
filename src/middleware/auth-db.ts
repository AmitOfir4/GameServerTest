import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/errors";
import { DbStore } from "../db/db-store";

export function authDbMiddleware(store: DbStore) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.header("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new ApiError(401, "Missing or invalid authorization header"));
      }

      const token = authHeader.replace("Bearer ", "").trim();
      const session = await store.getSessionByToken(token);
      req.playerId = session.playerId;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
