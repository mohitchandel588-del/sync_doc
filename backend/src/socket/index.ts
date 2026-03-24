import { Role } from "@prisma/client";
import type { Server, Socket } from "socket.io";
import { validateUserSession } from "../modules/auth/auth.service";
import { createTextMessage } from "../modules/chat/chat.service";
import { updateDocumentContent } from "../modules/documents/documents.service";
import { requireDocumentRole } from "../modules/permissions/permissions.service";
import { verifyToken } from "../utils/jwt";

type PresenceUser = {
  id: string;
  email: string;
  name: string | null;
};

const documentPresence = new Map<string, Map<string, PresenceUser>>();

const getRoomUsers = (documentId: string) =>
  Array.from(documentPresence.get(documentId)?.values() ?? []);

const emitPresence = (io: Server, documentId: string) => {
  io.to(documentId).emit("user-presence", {
    documentId,
    users: getRoomUsers(documentId)
  });
};

const removeSocketFromPresence = (io: Server, socket: Socket) => {
  const user = socket.data.user as PresenceUser | undefined;

  if (!user) {
    return;
  }

  for (const [documentId, users] of documentPresence.entries()) {
    if (!users.has(user.id)) {
      continue;
    }

    users.delete(user.id);

    if (users.size === 0) {
      documentPresence.delete(documentId);
    }

    emitPresence(io, documentId);
  }
};

export const setupSocket = (io: Server) => {
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.toString().replace("Bearer ", "");

      if (!token) {
        next(new Error("Authentication is required."));
        return;
      }

      const payload = verifyToken(token);
      const user = await validateUserSession(payload);
      socket.data.user = user;
      next();
    } catch (error) {
      next(error as Error);
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-document", async (documentId: string, callback?: Function) => {
      try {
        const user = socket.data.user as PresenceUser;
        await requireDocumentRole(documentId, user.id, Role.VIEWER);

        socket.join(documentId);

        const users = documentPresence.get(documentId) ?? new Map<string, PresenceUser>();
        users.set(user.id, user);
        documentPresence.set(documentId, users);

        emitPresence(io, documentId);
        callback?.({
          ok: true
        });
      } catch (error) {
        callback?.({
          ok: false,
          message: error instanceof Error ? error.message : "Unable to join document."
        });
      }
    });

    socket.on("leave-document", (documentId: string) => {
      const user = socket.data.user as PresenceUser | undefined;
      socket.leave(documentId);

      if (!user) {
        return;
      }

      const users = documentPresence.get(documentId);
      users?.delete(user.id);

      if (users && users.size === 0) {
        documentPresence.delete(documentId);
      }

      emitPresence(io, documentId);
    });

    socket.on(
      "document-change",
      async (
        payload: {
          documentId: string;
          content: unknown;
          contentText: string;
          baseVersion: number;
        },
        callback?: Function
      ) => {
        try {
          const user = socket.data.user as PresenceUser;
          const result = await updateDocumentContent({
            documentId: payload.documentId,
            userId: user.id,
            content: payload.content,
            contentText: payload.contentText,
            baseVersion: payload.baseVersion
          });

          if (!result.ok) {
            callback?.(result);
            return;
          }

          socket.to(payload.documentId).emit("document-change", {
            documentId: payload.documentId,
            document: result.document,
            editor: user
          });

          callback?.(result);
        } catch (error) {
          callback?.({
            ok: false,
            message: error instanceof Error ? error.message : "Unable to update document."
          });
        }
      }
    );

    socket.on(
      "chat-message",
      async (
        payload: {
          documentId: string;
          message: string;
          clientTempId?: string;
        },
        callback?: Function
      ) => {
        try {
          const user = socket.data.user as PresenceUser;
          const message = await createTextMessage({
            documentId: payload.documentId,
            senderId: user.id,
            message: payload.message
          });

          io.to(payload.documentId).emit("chat-message", {
            ...message,
            clientTempId: payload.clientTempId
          });

          callback?.({
            ok: true,
            message
          });
        } catch (error) {
          callback?.({
            ok: false,
            message: error instanceof Error ? error.message : "Unable to send message."
          });
        }
      }
    );

    socket.on("disconnect", () => {
      removeSocketFromPresence(io, socket);
    });
  });
};
