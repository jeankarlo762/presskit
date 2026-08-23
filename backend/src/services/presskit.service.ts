import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { DEFAULT_SECTIONS_BY_CATEGORY, type ArtistCategory, type PresskitUpdateInput } from "@presskit/shared";

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

export async function updatePresskit(userId: string, input: PresskitUpdateInput) {
  const current = await getOwnedPresskitOrThrow(userId);
  const { slug: newSlug, ...rest } = input;

  try {
    return await prisma.$transaction(async (tx) => {
      if (newSlug && newSlug !== current.slug) {
        await tx.slugHistory.create({ data: { presskitId: current.id, oldSlug: current.slug } });
      }

      return tx.presskit.update({
        where: { id: current.id },
        data: { ...rest, ...(newSlug ? { slug: newSlug } : {}) },
      });
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SlugAlreadyInUseError();
    }
    throw error;
  }
}

export async function publishPresskit(userId: string) {
  const presskit = await getOwnedPresskitOrThrow(userId);
  return prisma.presskit.update({ where: { id: presskit.id }, data: { published: true } });
}

export async function unpublishPresskit(userId: string) {
  const presskit = await getOwnedPresskitOrThrow(userId);
  return prisma.presskit.update({ where: { id: presskit.id }, data: { published: false } });
}

type PublicPresskitLookup =
  | { status: "found"; presskit: NonNullable<Awaited<ReturnType<typeof loadFullPublicPresskit>>> }
  | { status: "moved"; slug: string }
  | { status: "not_found" };

async function loadFullPublicPresskit(where: Prisma.PresskitWhereInput) {
  const presskit = await prisma.presskit.findFirst({
    where: { ...where, published: true },
    include: {
      user: { select: { name: true } },
      sections: { orderBy: { order: "asc" } },
      mediaEmbeds: { orderBy: { order: "asc" } },
      galleryPhotos: { orderBy: { order: "asc" } },
      tourDates: { orderBy: { date: "asc" } },
      pressMentions: { orderBy: { publishedAt: "desc" } },
    },
  });
  if (!presskit) return null;

  const { user, ...rest } = presskit;
  return { ...rest, artistName: user.name };
}

export async function findPublicPresskitBySlug(slug: string): Promise<PublicPresskitLookup> {
  const presskit = await loadFullPublicPresskit({ slug });
  if (presskit) return { status: "found", presskit };

  const moved = await prisma.slugHistory.findUnique({ where: { oldSlug: slug } });
  if (moved) {
    const target = await prisma.presskit.findUnique({ where: { id: moved.presskitId } });
    if (target?.published) return { status: "moved", slug: target.slug };
  }

  return { status: "not_found" };
}

export async function isSlugAvailable(slug: string) {
  const [presskit, history] = await Promise.all([
    prisma.presskit.findUnique({ where: { slug } }),
    prisma.slugHistory.findUnique({ where: { oldSlug: slug } }),
  ]);
  return !presskit && !history;
}
