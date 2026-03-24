import crypto from "crypto";
import { env, isSmtpConfigured } from "../../config/env";
import { sendPasswordResetEmail } from "../../lib/mail";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { signToken } from "../../utils/jwt";
import { comparePassword, hashPassword } from "../../utils/password";

export const serializeUser = (user: {
  id: string;
  email: string;
  name: string | null;
  createdAt?: Date;
}) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt
});

export const registerUser = async (input: {
  email: string;
  password: string;
  name?: string;
}) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (existingUser) {
    throw new ApiError(409, "An account already exists for this email.");
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: await hashPassword(input.password),
      name: input.name?.trim() || null
    }
  });

  return {
    token: signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion
    }),
    user: serializeUser(user)
  };
};

export const loginUser = async (input: {
  email: string;
  password: string;
}) => {
  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const isPasswordValid = await comparePassword(input.password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password.");
  }

  return {
    token: signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion
    }),
    user: serializeUser(user)
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  return serializeUser(user);
};

const hashResetToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const buildResetUrl = (token: string) =>
  `${env.CLIENT_URL.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

const passwordResetSuccessMessage =
  "If an account exists for this email, a password reset link has been created.";

export const requestPasswordReset = async (input: { email: string }) => {
  if (env.NODE_ENV === "production" && !isSmtpConfigured) {
    throw new ApiError(
      503,
      "Password reset email delivery is not configured on this server."
    );
  }

  const normalizedEmail = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: {
      email: normalizedEmail
    }
  });

  if (!user) {
    return {
      message: passwordResetSuccessMessage
    };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000
  );
  const resetUrl = buildResetUrl(token);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id
      }
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt
      }
    })
  ]);

  const result: {
    message: string;
    resetUrl?: string;
    expiresAt?: Date;
  } = {
    message: passwordResetSuccessMessage
  };

  if (isSmtpConfigured) {
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetUrl,
        expiresInMinutes: env.PASSWORD_RESET_TOKEN_TTL_MINUTES
      });
    } catch (_error) {
      await prisma.passwordResetToken.deleteMany({
        where: {
          userId: user.id
        }
      });

      throw new ApiError(502, "Unable to deliver the password reset email.");
    }
  }

  if (env.NODE_ENV !== "production") {
    result.resetUrl = resetUrl;
    result.expiresAt = expiresAt;
  }

  return result;
};

export const resetPassword = async (input: {
  token: string;
  password: string;
}) => {
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash: hashResetToken(input.token),
      expiresAt: {
        gt: new Date()
      }
    }
  });

  if (!resetToken) {
    throw new ApiError(400, "This password reset link is invalid or expired.");
  }

  const nextPasswordHash = await hashPassword(input.password);

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: resetToken.userId
      },
      data: {
        password: nextPasswordHash,
        tokenVersion: {
          increment: 1
        }
      }
    }),
    prisma.passwordResetToken.deleteMany({
      where: {
        userId: resetToken.userId
      }
    })
  ]);

  return {
    message: "Password reset successful. You can now sign in with your new password."
  };
};

export const validateUserSession = async (input: {
  userId: string;
  tokenVersion: number;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      id: input.userId
    }
  });

  if (!user || user.tokenVersion !== input.tokenVersion) {
    throw new ApiError(401, "Invalid or expired authentication token.");
  }

  return serializeUser(user);
};
