import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      message: error.message
    });
    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      message: error.issues[0]?.message || "Invalid request payload."
    });
    return;
  }

  if (error instanceof Error) {
    res.status(500).json({
      message: error.message
    });
    return;
  }

  res.status(500).json({
    message: "Something went wrong."
  });
};
