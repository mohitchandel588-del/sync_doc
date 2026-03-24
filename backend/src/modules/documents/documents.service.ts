import { Prisma, Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { emptyDocumentContent, normalizeContent } from "../../utils/document";
import { requireDocumentRole, requireOwner } from "../permissions/permissions.service";

const documentInclude = {
  owner: {
    select: {
      id: true,
      email: true,
      name: true
    }
  },
  collaborators: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    },
    orderBy: {
      addedAt: "asc"
    }
  }
} satisfies Prisma.DocumentInclude;

const serializeDocumentBase = (
  document: Prisma.DocumentGetPayload<{
    include: typeof documentInclude;
  }>,
  currentUserId: string
) => {
  const membership = document.collaborators.find(
    (collaborator) => collaborator.userId === currentUserId
  );

  return {
    id: document.id,
    title: document.title,
    content: document.content ?? emptyDocumentContent,
    contentText: document.contentText,
    ownerId: document.ownerId,
    version: document.version,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    role: membership?.role ?? Role.VIEWER,
    owner: document.owner,
    collaborators: document.collaborators.map((collaborator) => ({
      id: collaborator.user.id,
      email: collaborator.user.email,
      name: collaborator.user.name,
      role: collaborator.role
    }))
  };
};

export const listDocumentsForUser = async (userId: string) => {
  const memberships = await prisma.documentUser.findMany({
    where: {
      userId
    },
    include: {
      document: {
        include: documentInclude
      }
    }
  });

  return memberships
    .map((membership) => serializeDocumentBase(membership.document, userId))
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
};

export const getDocumentForUser = async (documentId: string, userId: string) => {
  await requireDocumentRole(documentId, userId, Role.VIEWER);

  const document = await prisma.document.findUnique({
    where: {
      id: documentId
    },
    include: documentInclude
  });

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  return serializeDocumentBase(document, userId);
};

export const createDocumentForUser = async (userId: string, title?: string) => {
  const document = await prisma.document.create({
    data: {
      title: title?.trim() || "Untitled Document",
      ownerId: userId,
      content: emptyDocumentContent,
      contentText: "",
      collaborators: {
        create: {
          userId,
          role: Role.OWNER
        }
      }
    },
    include: documentInclude
  });

  return serializeDocumentBase(document, userId);
};

export const renameDocumentForUser = async (
  documentId: string,
  userId: string,
  title: string
) => {
  await requireOwner(documentId, userId);

  const document = await prisma.document.update({
    where: {
      id: documentId
    },
    data: {
      title: title.trim()
    },
    include: documentInclude
  });

  return serializeDocumentBase(document, userId);
};

export const deleteDocumentForUser = async (documentId: string, userId: string) => {
  await requireOwner(documentId, userId);

  await prisma.document.delete({
    where: {
      id: documentId
    }
  });
};

export const updateDocumentContent = async (input: {
  documentId: string;
  userId: string;
  content: unknown;
  contentText: string;
  baseVersion: number;
}) => {
  await requireDocumentRole(input.documentId, input.userId, Role.EDITOR);

  const existingDocument = await prisma.document.findUnique({
    where: {
      id: input.documentId
    },
    include: documentInclude
  });

  if (!existingDocument) {
    throw new ApiError(404, "Document not found.");
  }

  if (existingDocument.version !== input.baseVersion) {
    return {
      ok: false as const,
      reason: "conflict",
      document: serializeDocumentBase(existingDocument, input.userId)
    };
  }

  const updatedDocument = await prisma.document.update({
    where: {
      id: input.documentId
    },
    data: {
      content: normalizeContent(input.content),
      contentText: input.contentText,
      version: {
        increment: 1
      }
    },
    include: documentInclude
  });

  return {
    ok: true as const,
    document: serializeDocumentBase(updatedDocument, input.userId)
  };
};
