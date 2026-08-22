import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DEFAULT_SECTIONS_BY_CATEGORY, type ArtistCategory } from "@presskit/shared";

export class PresskitNotFoundError extends Error {
  constructor() {
    super("Presskit não encontrado");
    this.name = "PresskitNotFoundError";
  }
}

export class SlugAlreadyInUseError extends Error {
  constructor() {
    super("Esse endereço já está em uso, escolha outro");
    this.name = "SlugAlreadyInUseError";
  }
}

export class PresskitAlreadyExistsError extends Error {
  constructor() {
    super("Esta conta já tem um presskit");
    this.name = "PresskitAlreadyExistsError";
  }
}

export async function findPresskitByUserId(userId: string) {
  return prisma.presskit.findUnique({ where: { userId } });
}

/** Every authenticated presskit route starts here instead of a tenant-wide
 * middleware — the ArenaHub AsyncLocalStorage tenant-context solves a
 * many-tables problem this product doesn't have; a single ownership check
 * per route is simpler to audit at this scale (everything hangs off
 * presskitId, one hop from userId). */
export async function getOwnedPresskitOrThrow(userId: string) {
  const presskit = await prisma.presskit.findUnique({ where: { userId } });
  if (!presskit) throw new PresskitNotFoundError();
  return presskit;
}

export async function createPresskitForUser(userId: string, category: ArtistCategory, slug: string) {
  const existing = await findPresskitByUserId(userId);
  if (existing) throw new PresskitAlreadyExistsError();

  try {
    return await prisma.$transaction(async (tx) => {
      const presskit = await tx.presskit.create({
        data: { userId, category, slug },
      });

      const defaultSections = DEFAULT_SECTIONS_BY_CATEGORY[category];
      await tx.section.createMany({
        data: defaultSections.map((type, order) => ({
          presskitId: presskit.id,
          type,
          order,
          visible: true,
        })),
      });

      return presskit;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SlugAlreadyInUseError();
    }
    throw error;
  }
}
