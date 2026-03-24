import { z } from "zod";

export const aiStreamSchema = z.object({
  documentId: z.string().min(1),
  action: z.enum(["summarize", "fix-grammar-tone"]),
  content: z.string().optional()
});

