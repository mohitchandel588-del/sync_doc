import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import {
  collaboratorRoleUpdateSchema,
  collaboratorSchema
} from "./permissions.schemas";
import {
  listCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  upsertCollaborator
} from "./permissions.service";

export const permissionsRouter = Router();

permissionsRouter.use(authenticate);

permissionsRouter.get(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const collaborators = await listCollaborators(
      documentId,
      req.user!.userId
    );

    res.json({
      collaborators
    });
  })
);

permissionsRouter.post(
  "/:documentId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const payload = collaboratorSchema.parse(req.body);
    const collaborator = await upsertCollaborator({
      documentId,
      ownerId: req.user!.userId,
      ...(payload as { email: string; role: "EDITOR" | "VIEWER" })
    });

    res.status(201).json({
      collaborator
    });
  })
);

permissionsRouter.patch(
  "/:documentId/:userId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const targetUserId = req.params.userId as string;
    const payload = collaboratorRoleUpdateSchema.parse(req.body);
    const collaborator = await updateCollaboratorRole({
      documentId,
      ownerId: req.user!.userId,
      targetUserId,
      role: payload.role
    });

    res.json({
      collaborator
    });
  })
);

permissionsRouter.delete(
  "/:documentId/:userId",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const targetUserId = req.params.userId as string;
    await removeCollaborator({
      documentId,
      ownerId: req.user!.userId,
      targetUserId
    });

    res.status(204).send();
  })
);
