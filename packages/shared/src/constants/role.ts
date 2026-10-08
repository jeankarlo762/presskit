export const USER_ROLES = ["USER", "SUPERADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  USER: "Usuário",
  SUPERADMIN: "Superadmin",
};
