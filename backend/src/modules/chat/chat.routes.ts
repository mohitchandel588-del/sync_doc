import { Router } from "express";
import { authenticate } from "../../middleware/auth";
import { getSocketServer } from "../../lib/socket-server";
import { asyncHandler } from "../../utils/async-handler";
import { messageSchema } from "./chat.schemas";
import { createTextMessage, listMessages } from "./chat.service";

export const chatRouter = Router();

chatRouter.use(authenticate);

chatRouter.get(
  "/:documentId/messages",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const messages = await listMessages(documentId, req.user!.userId);
    res.json({
      messages
    });
  })
);

chatRouter.post(
  "/:documentId/messages",
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;
    const payload = messageSchema.parse(req.body);
    const message = await createTextMessage({
      documentId,
      senderId: req.user!.userId,
      message: payload.message
    });

    getSocketServer()?.to(documentId).emit("chat-message", message);

    res.status(201).json({
      message
    });
  })
);
