import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AdminStats, AdminUpdateUserInput, AdminUserRow, AdminUsersQuery } from "@presskit/shared";

export class UserNotFoundError extends Error {
  constructor() {
    super("Usuário não encontrado");
    this.name = "UserNotFoundError";
  }
}

export class CannotChangeOwnRoleError extends Error {
  constructor() {
    super("Você não pode alterar o seu próprio papel");
    this.name = "CannotChangeOwnRoleError";
  }
}

export class LastSuperadminError extends Error {
  constructor() {
    super("Não é possível rebaixar o último superadmin");
    this.name = "LastSuperadminError";
  }
}

const userRowSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  planKey: true,
  createdAt: true,
  presskit: {
    select: { slug: true, published: true, _count: { select: { pageViews: true } } },
  },
} satisfies Prisma.UserSelect;

type UserRowRecord = Prisma.UserGetPayload<{ select: typeof userRowSelect }>;

function toRow(user: UserRowRecord): AdminUserRow {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    planKey: user.planKey,
    createdAt: user.createdAt.toISOString(),
    presskit: user.presskit
      ? { slug: user.presskit.slug, published: user.presskit.published, pageViews: user.presskit._count.pageViews }
      : null,
  };
}

export async function listUsers(query: AdminUsersQuery) {
  const where: Prisma.UserWhereInput | undefined = query.q
    ? {
        OR: [
          { email: { contains: query.q, mode: "insensitive" } },
          { name: { contains: query.q, mode: "insensitive" } },
          { presskit: { slug: { contains: query.q, mode: "insensitive" } } },
        ],
      }
    : undefined;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userRowSelect,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { total, page: query.page, pageSize: query.pageSize, users: users.map(toRow) };
}

export async function getStats(): Promise<AdminStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [users, superadmins, presskits, publishedPresskits, pageViewsLast7Days] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SUPERADMIN" } }),
    prisma.presskit.count(),
    prisma.presskit.count({ where: { published: true } }),
    prisma.pageView.count({ where: { createdAt: { gte: since } } }),
  ]);
  return { users, superadmins, presskits, publishedPresskits, pageViewsLast7Days };
}

/** `actorId` is who is making the change — an admin can never change their
 * own role (so a slip can't lock them out), and the platform always keeps
 * at least one SUPERADMIN. */
export async function updateUser(actorId: string, userId: string, input: AdminUpdateUserInput) {
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (!target) throw new UserNotFoundError();

  if (input.role !== undefined && input.role !== target.role) {
    if (target.id === actorId) throw new CannotChangeOwnRoleError();
    if (target.role === "SUPERADMIN" && input.role !== "SUPERADMIN") {
      const remaining = await prisma.user.count({ where: { role: "SUPERADMIN", id: { not: target.id } } });
      if (remaining === 0) throw new LastSuperadminError();
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.planKey !== undefined ? { planKey: input.planKey } : {}),
    },
    select: userRowSelect,
  });
  return toRow(updated);
}
