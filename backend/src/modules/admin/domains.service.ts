import { prisma } from "../../config/prisma";
import { env } from "../../config/env";

export type AdminDomainRow = {
  presskitId: string;
  slug: string;
  published: boolean;
  domain: string;
  status: string;
  user: { id: string; name: string; email: string };
  updatedAt: string;
  cnameTarget: string;
};

export class DomainRegistrationError extends Error {
  constructor(message: string) {
    super(`Não foi possível registrar o domínio no Railway: ${message}`);
    this.name = "DomainRegistrationError";
  }
}

export async function listCustomDomains(): Promise<AdminDomainRow[]> {
  const rows = await prisma.presskit.findMany({
    where: { customDomain: { not: null } },
    orderBy: [{ customDomainStatus: "desc" }, { updatedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      published: true,
      customDomain: true,
      customDomainStatus: true,
      updatedAt: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return rows.map((row) => ({
    presskitId: row.id,
    slug: row.slug,
    published: row.published,
    domain: row.customDomain!,
    status: row.customDomainStatus,
    user: row.user,
    updatedAt: row.updatedAt.toISOString(),
    cnameTarget: env.CUSTOM_DOMAIN_CNAME_TARGET,
  }));
}

export function isRailwayAutomationConfigured(): boolean {
  return Boolean(env.RAILWAY_API_TOKEN && env.RAILWAY_LANDING_SERVICE_ID && env.RAILWAY_ENVIRONMENT_ID);
}

/** Registers the hostname on the landing service through Railway's public
 * GraphQL API. "Already exists" is treated as success so re-activating an
 * old domain is idempotent. */
async function registerDomainOnRailway(domain: string) {
  const response = await fetch("https://backboard.railway.com/graphql/v2", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RAILWAY_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation ($input: CustomDomainCreateInput!) { customDomainCreate(input: $input) { id domain } }`,
      variables: {
        input: { domain, environmentId: env.RAILWAY_ENVIRONMENT_ID, serviceId: env.RAILWAY_LANDING_SERVICE_ID },
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => ({}))) as { errors?: { message: string }[] };
  if (!response.ok || body.errors?.length) {
    const message = body.errors?.map((e) => e.message).join("; ") || `HTTP ${response.status}`;
    if (!/already|exists|in use/i.test(message)) throw new DomainRegistrationError(message);
  }
}

/** Marks a domain ACTIVE (and, when the Railway token is configured, also
 * registers it on the landing service). Returns whether Railway was called
 * so the UI can tell the operator what still needs doing by hand. */
export async function activateCustomDomain(presskitId: string) {
  const presskit = await prisma.presskit.findUnique({ where: { id: presskitId }, select: { customDomain: true } });
  if (!presskit?.customDomain) return null;

  let registeredOnRailway = false;
  if (isRailwayAutomationConfigured()) {
    await registerDomainOnRailway(presskit.customDomain);
    registeredOnRailway = true;
  }

  await prisma.presskit.update({ where: { id: presskitId }, data: { customDomainStatus: "ACTIVE" } });
  return { domain: presskit.customDomain, registeredOnRailway };
}

export async function deactivateCustomDomain(presskitId: string) {
  await prisma.presskit.updateMany({
    where: { id: presskitId, customDomain: { not: null } },
    data: { customDomainStatus: "PENDING" },
  });
}

export async function removeCustomDomain(presskitId: string) {
  await prisma.presskit.updateMany({
    where: { id: presskitId },
    data: { customDomain: null, customDomainStatus: "NONE" },
  });
}
