import { Role } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router } from "express";
import { env } from "../../config/env";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import { getDocumentForUser } from "../documents/documents.service";
import { requireDocumentRole } from "../permissions/permissions.service";
import { aiStreamSchema } from "./ai.schemas";

const genAI = env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(env.GEMINI_API_KEY)
  : null;

const buildPrompt = (action: "summarize" | "fix-grammar-tone", content: string) => {
  if (action === "summarize") {
    return `You are assisting inside a collaborative document workspace. Summarize the following document into concise bullet points, then add a short section called "Key Decisions".\n\n${content}`;
  }

  return `You are assisting inside a collaborative document workspace. Rewrite the following content with clearer grammar, more polished tone, and better readability while preserving meaning. Return only the improved document text.\n\n${content}`;
};

export const aiRouter = Router();

aiRouter.use(authenticate);

aiRouter.post(
  "/stream",
  asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    if (!genAI) {
      throw new ApiError(500, "Gemini is not configured on the server.");
    }

    const payload = aiStreamSchema.parse(req.body);
    await requireDocumentRole(payload.documentId, userId, Role.VIEWER);

    const content =
      payload.content?.trim() ||
      (await getDocumentForUser(payload.documentId, userId)).contentText;

    if (!content.trim()) {
      throw new ApiError(400, "Document content is empty.");
    }

    const prompt = buildPrompt(payload.action, content);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL
    });

    const result = await model.generateContentStream(prompt);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of result.stream) {
      const text = chunk.text();

      if (text) {
        res.write(text);
      }
    }

    res.end();
  })
);
