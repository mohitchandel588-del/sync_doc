import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(120).optional()
});

export const renameDocumentSchema = z.object({
  title: z.string().min(1).max(120)
});

export const documentContentSchema = z.object({
  content: z.unknown(),
  contentText: z.string().default(""),
  baseVersion: z.number().int().positive()
});

