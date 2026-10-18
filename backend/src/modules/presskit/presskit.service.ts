import { Prisma, type User } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import {
  AGENCY_TRIAL_SEATS,
  DEFAULT_SECTIONS_BY_CATEGORY,
  type ArtistCategory,
  type PresskitOnboardingInput,
  type RosterArtistCreateInput,
  type CustomDomainInfo,
  type CustomDomainStatus,
  type ImageSlot,
  type PresskitUpdateInput,
} from "@presskit/shared";
import { deleteImageObject, type ImageFolder } from "../../shared/storage.service";

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

export class NotAnAgencyError extends Error {
  constructor() {
    super("Só contas de produtora podem criar páginas de artistas");
    this.name = "NotAnAgencyError";
  }
}

export class RosterLimitError extends Error {
  constructor(seats: number) {
    super(
      seats === 0
        ? "Seu plano não inclui páginas de artistas. Assine um plano de produtora para criar."
        : `Seu plano inclui ${seats} ${seats === 1 ? "artista" : "artistas"}. Aumente o plano para adicionar mais.`,
    );
    this.name = "RosterLimitError";
  }
}

export class RosterPageNotFoundError extends Error {
  constructor() {
    super("Página de artista não encontrada");
    this.name = "RosterPageNotFoundError";
  }
}

/** Which presskit an authenticated request is about: the one named by the
 * X-Presskit-Id header (if the user owns it) or the account's primary page.
 * Every route hands its `request` here, so ownership is one check in one
 * place even now that an agency owns several pages. */
export type PresskitScope = { currentUser: { id: string }; presskitId?: string | null };

/** The account's own page: an artist's only presskit, or the agency's
 * page (roster pages hang off it through agencyId). */
export async function findPrimaryPresskit(userId: string) {
  return prisma.presskit.findFirst({ where: { userId, agencyId: null }, orderBy: { createdAt: "asc" } });
}

export async function findActivePresskit(scope: PresskitScope) {
  if (scope.presskitId) {
    return prisma.presskit.findFirst({ where: { id: scope.presskitId, userId: scope.currentUser.id } });
  }
  return findPrimaryPresskit(scope.currentUser.id);
}

export async function getOwnedPresskitOrThrow(scope: PresskitScope) {
  const presskit = await findActivePresskit(scope);
  if (!presskit) throw new PresskitNotFoundError();
  return presskit;
}

/** Everything the account can edit, primary page first. */
export async function listMyPresskits(userId: string) {
  const all = await prisma.presskit.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
  return [...all.filter((p) => !p.agencyId), ...all.filter((p) => p.agencyId)];
}

/** How many roster pages an AGENCY may have right now: what the
 * subscription grants (artistSeats, kept by syncEntitlement) or, while the
 * free trial runs, at least AGENCY_TRIAL_SEATS. */
export function effectiveArtistSeats(user: Pick<User, "accountType" | "artistSeats" | "trialEndsAt">): number {
  if (user.accountType !== "AGENCY") return 0;
  const inTrial = !!user.trialEndsAt && user.trialEndsAt > new Date();
  return Math.max(user.artistSeats, inTrial ? AGENCY_TRIAL_SEATS : 0);
}

export async function countRosterPages(userId: string) {
  return prisma.presskit.count({ where: { userId, agencyId: { not: null } } });
}

async function createDefaultSections(tx: Prisma.TransactionClient, presskitId: string, category: ArtistCategory) {
  await tx.section.createMany({
    data: DEFAULT_SECTIONS_BY_CATEGORY[category].map((type, order) => ({ presskitId, type, order, visible: true })),
  });
}

/** An agency adds an artist page to its roster. The page belongs to the
 * agency's user (one login edits everything) and links back through
 * agencyId, which is what the public agency page lists. */
export async function createRosterArtist(user: Pick<User, "id" | "accountType" | "artistSeats" | "trialEndsAt">, input: RosterArtistCreateInput) {
  if (user.accountType !== "AGENCY") throw new NotAnAgencyError();
  const agency = await findPrimaryPresskit(user.id);
  if (!agency) throw new PresskitNotFoundError();

  const seats = effectiveArtistSeats(user);
  const used = await countRosterPages(user.id);
  if (used >= seats) throw new RosterLimitError(seats);

  try {
    return await prisma.$transaction(async (tx) => {
      const presskit = await tx.presskit.create({
        data: {
          userId: user.id,
          kind: "ARTIST",
          agencyId: agency.id,
          displayName: input.name,
          category: input.category,
          slug: input.slug,
          // Roster pages start with the agency's look so the roster feels
          // like one family; each one can be restyled afterwards.
          templateKey: agency.templateKey,
          themeBackgroundColor: agency.themeBackgroundColor,
          themeTextColor: agency.themeTextColor,
          themeAccentColor: agency.themeAccentColor,
          themeFontKey: agency.themeFontKey,
          themeHeadingFontKey: agency.themeHeadingFontKey,
          themeButtonStyle: agency.themeButtonStyle,
        },
      });
      await createDefaultSections(tx, presskit.id, input.category);
      return presskit;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SlugAlreadyInUseError();
    }
    throw error;
  }
}

/** Removes a roster page and its uploads. Only pages with an agencyId can
 * be deleted this way — an account's primary page is never deleted here. */
export async function deleteRosterArtist(userId: string, presskitId: string) {
  const page = await prisma.presskit.findFirst({
    where: { id: presskitId, userId, agencyId: { not: null } },
    include: { galleryPhotos: { select: { storageKey: true } }, sections: { select: { style: true } } },
  });
  if (!page) throw new RosterPageNotFoundError();

  const keys = [
    page.themeBackgroundImageKey,
    page.coverImageKey,
    page.avatarImageKey,
    page.logoImageKey,
    ...page.galleryPhotos.map((photo) => photo.storageKey),
    ...page.sections.map((section) => (section.style as { backgroundImageKey?: string } | null)?.backgroundImageKey),
  ].filter((key): key is string => typeof key === "string" && key.length > 0);

  await prisma.presskit.delete({ where: { id: page.id } });
  await Promise.all(keys.map((key) => deleteImageObject(key)));
}

/** Onboarding: the account's primary page. An AGENCY gets a PRODUTORA page
 * (its roster lives in the ROSTER section); the choice also fixes the
 * account type, which drives plans and the dashboard. */
export async function createPresskitForUser(userId: string, input: PresskitOnboardingInput) {
  const existing = await findPrimaryPresskit(userId);
  if (existing) throw new PresskitAlreadyExistsError();

  const isAgency = input.accountType === "AGENCY";
  const category: ArtistCategory = isAgency ? "PRODUTORA" : input.category;

  try {
    return await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { accountType: input.accountType } });
      const presskit = await tx.presskit.create({
        data: { userId, category, slug: input.slug, kind: isAgency ? "AGENCY" : "ARTIST" },
      });
      await createDefaultSections(tx, presskit.id, category);
      return presskit;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new SlugAlreadyInUseError();
    }
    throw error;
  }
}

export async function updatePresskit(scope: PresskitScope, input: PresskitUpdateInput) {
  const current = await getOwnedPresskitOrThrow(scope);
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
export async function setThemeBackgroundImage(scope: PresskitScope, image: { url: string; key: string } | null) {
  return setPresskitImage(scope, "background", image);
}

/** Same contract as setThemeBackgroundImage for every image slot. */
export async function setPresskitImage(scope: PresskitScope, slot: ImageSlot, image: { url: string; key: string } | null) {
  const current = await getOwnedPresskitOrThrow(scope);
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

export async function getCustomDomain(scope: PresskitScope): Promise<CustomDomainInfo> {
  const presskit = await getOwnedPresskitOrThrow(scope);
  return domainInfo(presskit.customDomain, presskit.customDomainStatus);
}

/** Setting a domain parks it as PENDING; a superadmin flips it to ACTIVE
 * once the CNAME resolves and the domain is registered on the host.
 * Changing the domain resets the status — the old one stops routing. */
export async function setCustomDomain(scope: PresskitScope, domain: string | null): Promise<CustomDomainInfo> {
  const presskit = await getOwnedPresskitOrThrow(scope);
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

export async function publishPresskit(scope: PresskitScope) {
  const presskit = await getOwnedPresskitOrThrow(scope);
  return prisma.presskit.update({ where: { id: presskit.id }, data: { published: true } });
}

export async function unpublishPresskit(scope: PresskitScope) {
  const presskit = await getOwnedPresskitOrThrow(scope);
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
      agency: { select: { slug: true, displayName: true, published: true, user: { select: { name: true } } } },
      roster: {
        where: { published: true },
        orderBy: { createdAt: "asc" },
        select: {
          slug: true,
          displayName: true,
          category: true,
          tagline: true,
          city: true,
          state: true,
          avatarImageUrl: true,
          coverImageUrl: true,
          user: { select: { name: true } },
        },
      },
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
    agencyId: _agencyId,
    agency,
    roster,
    sections,
    ...rest
  } = presskit;
  return {
    ...rest,
    artistName: presskit.displayName ?? user.name,
    agency: agency && agency.published ? { slug: agency.slug, name: agency.displayName ?? agency.user.name } : null,
    roster: roster.map(({ user: rosterUser, displayName, ...artist }) => ({ ...artist, name: displayName ?? rosterUser.name })),
    sections: sections.map((section) => {
      const { backgroundImageKey: _sectionKey, ...style } = (section.style ?? {}) as Record<string, unknown>;
      return { ...section, style };
    }),
  };
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
