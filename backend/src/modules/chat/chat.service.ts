import { MessageType, Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { requireDocumentRole } from "../permissions/permissions.service";

const messageInclude = {
  sender: {
    select: {
      id: true,
      email: true,
      name: true
    }
  },
  file: true
} satisfies Prisma.MessageInclude;

export const serializeMessage = (
  message: Prisma.MessageGetPayload<{
    include: typeof messageInclude;
  }>
) => ({
  id: message.id,
  documentId: message.documentId,
  senderId: message.senderId,
  message: message.message,
  type: message.type,
  createdAt: message.createdAt,
  sender: message.sender,
  file: message.file
    ? {
        id: message.file.id,
        url: message.file.url,
        fileName: message.file.fileName,
        mimeType: message.file.mimeType,
        size: message.file.size
      }
    : null
});

export const listMessages = async (documentId: string, userId: string) => {
  await requireDocumentRole(documentId, userId, Role.VIEWER);

  const messages = await prisma.message.findMany({
    where: {
      documentId
    },
    orderBy: {
      createdAt: "desc"
    },
    include: messageInclude,
    take: 200
  });

  return messages.reverse().map(serializeMessage);
};

export const createTextMessage = async (input: {
  documentId: string;
  senderId: string;
  message: string;
}) => {
  await requireDocumentRole(input.documentId, input.senderId, Role.VIEWER);

  const createdMessage = await prisma.message.create({
    data: {
      documentId: input.documentId,
      senderId: input.senderId,
      message: input.message.trim(),
      type: MessageType.TEXT
    },
    include: messageInclude
  });

  return serializeMessage(createdMessage);
};

export const createFileMessage = async (input: {
  documentId: string;
  senderId: string;
  file: {
    url: string;
    publicId: string;
    fileName: string;
    mimeType: string;
    size: number;
  };
}) => {
  await requireDocumentRole(input.documentId, input.senderId, Role.EDITOR);

  const createdMessage = await prisma.$transaction(async (tx) => {
    const file = await tx.file.create({
      data: {
        documentId: input.documentId,
        uploaderId: input.senderId,
        url: input.file.url,
        publicId: input.file.publicId,
        fileName: input.file.fileName,
        mimeType: input.file.mimeType,
        size: input.file.size
      }
    });

    return tx.message.create({
      data: {
        documentId: input.documentId,
        senderId: input.senderId,
        type: MessageType.FILE,
        message: input.file.fileName,
        fileId: file.id
      },
      include: messageInclude
    });
  });

  return serializeMessage(createdMessage);
};
