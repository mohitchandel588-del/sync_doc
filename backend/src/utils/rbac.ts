import { Role } from "@prisma/client";

const ROLE_WEIGHT: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3
};

export const hasRequiredRole = (currentRole: Role, minimumRole: Role) =>
  ROLE_WEIGHT[currentRole] >= ROLE_WEIGHT[minimumRole];

