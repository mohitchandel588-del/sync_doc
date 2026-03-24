import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "./auth.schemas";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPassword
} from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const payload: z.infer<typeof registerSchema> =
  registerSchema.parse(req.body);
    const result = await registerUser(payload as {
  email: string;
  password: string;
  name?: string;
});
    res.status(201).json(result);
  })
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
   const payload: z.infer<typeof loginSchema> =
  loginSchema.parse(req.body);
    const result = await loginUser(payload as {
  email: string;
  password: string;
});

    res.json(result);
  })
);

authRouter.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
   const payload: z.infer<typeof forgotPasswordSchema> =
  forgotPasswordSchema.parse(req.body);
    const result = await requestPasswordReset(payload as {
  email: string;
});
    res.json(result);
  })
);

authRouter.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
   const payload: z.infer<typeof resetPasswordSchema> =
  resetPasswordSchema.parse(req.body);
    const result = await resetPassword(payload as {
  token: string;
  password: string;
});
    res.json(result);
  })
);

authRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await getCurrentUser(req.user!.userId);
    res.json({
      user
    });
  })
);
