import { z } from "zod";
import { PLAN_KEYS } from "../constants/category";
import { USER_ROLES } from "../constants/role";

export const adminUsersQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const adminUpdateUserSchema = z
  .object({
    role: z.enum(USER_ROLES).optional(),
    planKey: z.enum(PLAN_KEYS).optional(),
  })
  .refine((value) => value.role !== undefined || value.planKey !== undefined, {
    message: "informe role ou planKey",
  });
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

/** Row shape of GET /admin/users — what the admin table renders. */
export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: (typeof USER_ROLES)[number];
  planKey: (typeof PLAN_KEYS)[number];
  createdAt: string;
  presskit: { slug: string; published: boolean; pageViews: number } | null;
};

export type AdminStats = {
  users: number;
  superadmins: number;
  presskits: number;
  publishedPresskits: number;
  pageViewsLast7Days: number;
};
