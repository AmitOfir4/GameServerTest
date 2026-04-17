import { NextFunction, Request, Response } from "express";
import { ApiError } from "../core/errors";
import { DataStore } from "../data/store";

export function authMiddleware(store: DataStore) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Missing or invalid authorization header"));
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const session = store.getSessionByToken(token);
    req.playerId = session.playerId;
    return next();
  };
}
