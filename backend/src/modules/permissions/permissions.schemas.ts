import { Role } from "@prisma/client";
import { z } from "zod";

const nonOwnerRoles = [Role.EDITOR, Role.VIEWER] as const;

export const collaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(nonOwnerRoles)
});

export const collaboratorRoleUpdateSchema = z.object({
  role: z.enum(nonOwnerRoles)
});

