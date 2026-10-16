import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import {
  DEFAULT_SECTIONS_BY_CATEGORY,
  type ArtistCategory,
  type CustomDomainInfo,
  type CustomDomainStatus,
  type ImageSlot,
  type PresskitUpdateInput,
} from "@presskit/shared";
import type { ImageFolder } from "../../shared/storage.service";

export class DomainAlreadyInUseError extends Error {
  constructor() {
    super("Esse domínio já está ligado a outro presskit");
    this.name = "DomainAlreadyInUseError";
  }
}

export class DomainNotAllowedError extends Error {
  constructor() {
    super("Esse domínio não pode ser usado — informe um domínio que seja seu");
    this.name = "DomainNotAllowedError";
  }
}

/** Which storage prefix and which columns each upload slot maps to. */
export const IMAGE_SLOT_CONFIG: Record<ImageSlot, { folder: ImageFolder; urlField: string; keyField: string }> = {
  background: { folder: "theme-bg", urlField: "themeBackgroundImageUrl", keyField: "themeBackgroundImageKey" },
  cover: { folder: "cover", urlField: "coverImageUrl", keyField: "coverImageKey" },
  avatar: { folder: "avatar", urlField: "avatarImageUrl", keyField: "avatarImageKey" },
  logo: { folder: "logo", urlField: "logoImageUrl", keyField: "logoImageKey" },
};

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
 * middleware — a single ownership check per route is simpler to audit at
 * this scale (everything hangs off presskitId, one hop from userId). */
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

/** Only reachable from the upload-confirm / remove routes, after the key
 * has been proven to belong to this presskit — never from the generic
 * PATCH (its schema doesn't carry these fields). */
export async function setThemeBackgroundImage(userId: string, image: { url: string; key: string } | null) {
  return setPresskitImage(userId, "background", image);
}

/** Same contract as setThemeBackgroundImage for every image slot. */
export async function setPresskitImage(userId: string, slot: ImageSlot, image: { url: string; key: string } | null) {
  const current = await getOwnedPresskitOrThrow(userId);
  const { urlField, keyField } = IMAGE_SLOT_CONFIG[slot];
  return prisma.presskit.update({
    where: { id: current.id },
    data: { [urlField]: image?.url ?? null, [keyField]: image?.key ?? null },
  });
}

export function currentImageKey(presskit: Record<string, unknown>, slot: ImageSlot): string | null {
  const value = presskit[IMAGE_SLOT_CONFIG[slot].keyField];
  return typeof value === "string" ? value : null;
}

// ---------------------------------------------------------------------------
// Artist custom domain
// ---------------------------------------------------------------------------

const OUR_DOMAIN_SUFFIXES = ["presskitai.com.br", "railway.app", "railway.internal", "localhost"];

function domainInfo(domain: string | null, status: string): CustomDomainInfo {
  const resolved: CustomDomainStatus = status === "ACTIVE" || status === "PENDING" ? status : "NONE";
  return {
    domain,
    status: domain ? resolved : "NONE",
    dns: domain ? { type: "CNAME", name: domain, value: env.CUSTOM_DOMAIN_CNAME_TARGET } : null,
  };
}

export async function getCustomDomain(userId: string): Promise<CustomDomainInfo> {
  const presskit = await getOwnedPresskitOrThrow(userId);
  return domainInfo(presskit.customDomain, presskit.customDomainStatus);
}

/** Setting a domain parks it as PENDING; a superadmin flips it to ACTIVE
 * once the CNAME resolves and the domain is registered on the host.
 * Changing the domain resets the status — the old one stops routing. */
export async function setCustomDomain(userId: string, domain: string | null): Promise<CustomDomainInfo> {
  const presskit = await getOwnedPresskitOrThrow(userId);
  if (domain && OUR_DOMAIN_SUFFIXES.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`))) {
    throw new DomainNotAllowedError();
  }
  try {
    const updated = await prisma.presskit.update({
      where: { id: presskit.id },
      data: { customDomain: domain, customDomainStatus: domain ? "PENDING" : "NONE" },
    });
    return domainInfo(updated.customDomain, updated.customDomainStatus);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new DomainAlreadyInUseError();
    }
    throw error;
  }
}

/** Used by the landing's proxy: which published presskit answers for a
 * host. Only ACTIVE domains route — a PENDING one would let anyone point
 * a domain here and have it "work" before the operator vetted it. */
export async function findSlugByCustomDomain(host: string): Promise<string | null> {
  const presskit = await prisma.presskit.findFirst({
    where: { customDomain: host.toLowerCase(), customDomainStatus: "ACTIVE", published: true },
    select: { slug: true },
  });
  return presskit?.slug ?? null;
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

  // Internal identifiers stay internal: the owner's user id and the storage
  // keys have no business on a public page.
  const {
    user,
    userId: _userId,
    themeBackgroundImageKey: _bgKey,
    coverImageKey: _coverKey,
    avatarImageKey: _avatarKey,
    logoImageKey: _logoKey,
    customDomainStatus: _domainStatus,
    ...rest
  } = presskit;
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
