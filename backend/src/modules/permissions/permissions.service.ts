import { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { hasRequiredRole } from "../../utils/rbac";

export const serializeCollaborator = (membership: {
  userId: string;
  role: Role;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}) => ({
  id: membership.user.id,
  email: membership.user.email,
  name: membership.user.name,
  role: membership.role
});

export const getDocumentMembership = async (
  documentId: string,
  userId: string
) => {
  const membership = await prisma.documentUser.findUnique({
    where: {
      documentId_userId: {
        documentId,
        userId
      }
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  if (!membership) {
    throw new ApiError(404, "Document not found or access denied.");
  }

  return membership;
};

export const requireDocumentRole = async (
  documentId: string,
  userId: string,
  minimumRole: Role
) => {
  const membership = await getDocumentMembership(documentId, userId);

  if (!hasRequiredRole(membership.role, minimumRole)) {
    throw new ApiError(403, "You do not have permission to perform this action.");
  }

  return membership;
};

export const requireOwner = async (documentId: string, userId: string) => {
  const membership = await requireDocumentRole(documentId, userId, Role.OWNER);

  if (membership.role !== Role.OWNER) {
    throw new ApiError(403, "Only the document owner can manage permissions.");
  }

  return membership;
};

export const listCollaborators = async (
  documentId: string,
  requesterId: string
) => {
  await requireDocumentRole(documentId, requesterId, Role.VIEWER);

  const collaborators = await prisma.documentUser.findMany({
    where: {
      documentId
    },
    orderBy: {
      addedAt: "asc"
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  return collaborators.map(serializeCollaborator);
};

export const upsertCollaborator = async (input: {
  documentId: string;
  ownerId: string;
  email: string;
  role: Exclude<Role, "OWNER">;
}) => {
  await requireOwner(input.documentId, input.ownerId);

  const targetUser = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase()
    }
  });

  if (!targetUser) {
    throw new ApiError(404, "No user found with that email address.");
  }

  const document = await prisma.document.findUnique({
    where: {
      id: input.documentId
    },
    select: {
      ownerId: true
    }
  });

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  if (document.ownerId === targetUser.id) {
    throw new ApiError(400, "The owner already has full access to this document.");
  }

  const membership = await prisma.documentUser.upsert({
    where: {
      documentId_userId: {
        documentId: input.documentId,
        userId: targetUser.id
      }
    },
    create: {
      documentId: input.documentId,
      userId: targetUser.id,
      role: input.role
    },
    update: {
      role: input.role
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  return serializeCollaborator(membership);
};

export const updateCollaboratorRole = async (input: {
  documentId: string;
  ownerId: string;
  targetUserId: string;
  role: Exclude<Role, "OWNER">;
}) => {
  await requireOwner(input.documentId, input.ownerId);

  const document = await prisma.document.findUnique({
    where: {
      id: input.documentId
    },
    select: {
      ownerId: true
    }
  });

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  if (document.ownerId === input.targetUserId) {
    throw new ApiError(400, "The document owner role cannot be changed here.");
  }

  const membership = await prisma.documentUser.update({
    where: {
      documentId_userId: {
        documentId: input.documentId,
        userId: input.targetUserId
      }
    },
    data: {
      role: input.role
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  return serializeCollaborator(membership);
};

export const removeCollaborator = async (input: {
  documentId: string;
  ownerId: string;
  targetUserId: string;
}) => {
  await requireOwner(input.documentId, input.ownerId);

  const document = await prisma.document.findUnique({
    where: {
      id: input.documentId
    },
    select: {
      ownerId: true
    }
  });

  if (!document) {
    throw new ApiError(404, "Document not found.");
  }

  if (document.ownerId === input.targetUserId) {
    throw new ApiError(400, "The owner cannot be removed from the document.");
  }

  await prisma.documentUser.delete({
    where: {
      documentId_userId: {
        documentId: input.documentId,
        userId: input.targetUserId
      }
    }
  });
};

