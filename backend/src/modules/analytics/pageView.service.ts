import { prisma } from "../../config/prisma";

function detectDeviceType(userAgent: string | undefined): string {
  if (!userAgent) return "UNKNOWN";
  if (/mobile/i.test(userAgent)) return "MOBILE";
  if (/tablet|ipad/i.test(userAgent)) return "TABLET";
  return "DESKTOP";
}

function extractHost(url: string | undefined): string | undefined {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return undefined;
  }
}

type RecordViewInput = {
  presskitId: string;
  trackableCode?: string;
  referrerUrl?: string;
  sessionId: string;
  country?: string;
  userAgent?: string;
};

/** Callers must have already filtered bot user-agents (see isBotUserAgent in
 * @presskit/shared) — this only records what it's given. */
export async function recordPageView(input: RecordViewInput) {
  let trackableLinkId: string | undefined;

  if (input.trackableCode) {
    const link = await prisma.trackableLink.findUnique({
      where: { presskitId_code: { presskitId: input.presskitId, code: input.trackableCode } },
    });
    if (link?.active) trackableLinkId = link.id;
  }

  await prisma.pageView.create({
    data: {
      presskitId: input.presskitId,
      trackableLinkId,
      sessionId: input.sessionId,
      referrerUrl: input.referrerUrl,
      referrerHost: extractHost(input.referrerUrl),
      deviceType: detectDeviceType(input.userAgent),
      country: input.country,
    },
  });
}
