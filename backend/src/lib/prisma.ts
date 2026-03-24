import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

declare global {
  var __syncdocPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__syncdocPrisma ??
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (env.NODE_ENV !== "production") {
  global.__syncdocPrisma = prisma;
}

