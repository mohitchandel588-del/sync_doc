import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional().default(""),
  JWT_SECRET: z.string().min(12),
  JWT_EXPIRES_IN: z.string().default("7d"),
  CLIENT_URL: z.string().optional().default("http://localhost:3000"),
  CORS_ORIGINS: z.string().optional().default(""),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(""),
  CLOUDINARY_API_KEY: z.string().optional().default(""),
  CLOUDINARY_API_SECRET: z.string().optional().default(""),
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  PASSWORD_RESET_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  SMTP_HOST: z.string().optional().default(""),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  MAIL_FROM: z.string().optional().default("")
});

export const env = envSchema.parse(process.env);

export const allowedOrigins = Array.from(
  new Set(
    (env.CORS_ORIGINS
      ? env.CORS_ORIGINS.split(",")
      : [env.CLIENT_URL]
    )
      .map((origin) => origin.trim())
      .filter(Boolean)
  )
);

export const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

export const isSmtpConfigured =
  Boolean(env.SMTP_HOST) &&
  Boolean(env.SMTP_USER) &&
  Boolean(env.SMTP_PASS) &&
  Boolean(env.MAIL_FROM);
