import { validateUserSession } from "../modules/auth/auth.service";
import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/api-error";
import { verifyToken } from "../utils/jwt";

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const authorization = req.headers.authorization;
  const token =
    authorization?.startsWith("Bearer ")
      ? authorization.replace("Bearer ", "")
      : null;

  if (!token) {
    next(new ApiError(401, "Authentication token is required."));
    return;
  }

  Promise.resolve()
    .then(async () => {
      const payload = verifyToken(token);
      await validateUserSession(payload);
      req.user = payload;
      next();
    })
    .catch((_error) => {
      next(new ApiError(401, "Invalid or expired authentication token."));
    });
};
