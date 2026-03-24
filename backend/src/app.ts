import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { allowedOrigins } from "./config/env";
import { errorHandler } from "./middleware/error-handler";
import { aiRouter } from "./modules/ai/ai.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { chatRouter } from "./modules/chat/chat.routes";
import { documentsRouter } from "./modules/documents/documents.routes";
import { permissionsRouter } from "./modules/permissions/permissions.routes";
import { uploadRouter } from "./modules/upload/upload.routes";

export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );
  app.use(helmet());
  app.use(morgan("dev"));
  app.use(cookieParser());
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok"
    });
  });

  app.use("/auth", authRouter);
  app.use("/documents", documentsRouter);
  app.use("/permissions", permissionsRouter);
  app.use("/chat", chatRouter);
  app.use("/upload", uploadRouter);
  app.use("/ai", aiRouter);

  app.use(errorHandler);

  return app;
};
