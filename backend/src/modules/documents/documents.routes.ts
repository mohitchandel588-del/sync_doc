import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import {
  createDocumentSchema,
  documentContentSchema,
  renameDocumentSchema
} from "./documents.schemas";
import {
  createDocumentForUser,
  deleteDocumentForUser,
  getDocumentForUser,
  listDocumentsForUser,
  renameDocumentForUser,
  updateDocumentContent
} from "./documents.service";

export const documentsRouter = Router();

documentsRouter.use(authenticate);

documentsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const documents = await listDocumentsForUser(req.user!.userId);
    res.json({
      documents
    });
  })
);

documentsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const payload = createDocumentSchema.parse(req.body);
    const document = await createDocumentForUser(req.user!.userId, payload.title);
    res.status(201).json({
      document
    });
  })
);

documentsRouter.get(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const document = await getDocumentForUser(
      documentId,
      req.user!.userId
    );

    res.json({
      document
    });
  })
);

documentsRouter.patch(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const payload = renameDocumentSchema.parse(req.body);
    const document = await renameDocumentForUser(
      documentId,
      req.user!.userId,
      payload.title
    );

    res.json({
      document
    });
  })
);

documentsRouter.put(
  "/:documentId/content",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const payload = documentContentSchema.parse(req.body);
    const result = await updateDocumentContent({
      documentId,
      userId: req.user!.userId,
      content: payload.content,
      contentText: payload.contentText,
      baseVersion: payload.baseVersion
    });

    if (!result.ok) {
      res.status(409).json(result);
      return;
    }

    res.json(result);
  })
);

documentsRouter.delete(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    await deleteDocumentForUser(documentId, req.user!.userId);
    res.status(204).send();
  })
);
