import { Router } from "express";
import multer from "multer";
import { uploadBufferToCloudinary } from "../../lib/cloudinary";
import { getSocketServer } from "../../lib/socket-server";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import { createFileMessage } from "../chat/chat.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

export const uploadRouter = Router();

uploadRouter.use(authenticate);

uploadRouter.post(
  "/:documentId",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    const documentId = req.params.documentId as string;

    if (!req.file) {
      throw new ApiError(400, "A file is required.");
    }

    const uploadedFile = await uploadBufferToCloudinary(
      req.file.buffer,
      `syncdoc/${documentId}`,
      req.file.mimetype
    );

    const message = await createFileMessage({
      documentId,
      senderId: req.user!.userId,
      file: {
        url: uploadedFile.secure_url,
        publicId: uploadedFile.public_id,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size
      }
    });

    getSocketServer()?.to(documentId).emit("chat-message", message);

    res.status(201).json({
      message
    });
  })
);
