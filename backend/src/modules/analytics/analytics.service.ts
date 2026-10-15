import { PLAN_LIMITS, type AnalyticsSummary, type PlanKey } from "@presskit/shared";
import { prisma } from "../../config/prisma";

// Artists and contractors are in Brazil, so "a day" on the chart is a
// Brasília calendar day, not a UTC one (a 22h visit would otherwise land on
// tomorrow's bar). Brazil has had no DST since 2019, so -03:00 is fixed.
const TIME_ZONE = "America/Sao_Paulo";
const UTC_OFFSET = "-03:00";
const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_REFERRERS = 6;

function localDateString(date: Date): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE }).format(date);
}

/** The `days` calendar days ending today (local), oldest first. */
function windowDates(days: number, now = new Date()): string[] {
  const today = new Date(`${localDateString(now)}T12:00:00${UTC_OFFSET}`);
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(localDateString(new Date(today.getTime() - i * DAY_MS)));
  }
  return dates;
}

export function clampAnalyticsDays(requested: number, plan: PlanKey): number {
  return Math.max(1, Math.min(requested, PLAN_LIMITS[plan].analyticsHistoryDays));
}

type RawDaily = { day: string; views: number };
type RawCount = { count: number };

export async function getAnalyticsSummary(
  presskit: { id: string; slug: string; published: boolean },
  plan: PlanKey,
  requestedDays: number,
): Promise<AnalyticsSummary> {
  const days = clampAnalyticsDays(requestedDays, plan);
  const dates = windowDates(days);
  const since = new Date(`${dates[0]}T00:00:00${UTC_OFFSET}`);
  const presskitId = presskit.id;
  const inWindow = { presskitId, createdAt: { gte: since } };

  const [totalViews, uniqueRows, dailyRows, deviceRows, referrerRows, links, linkAllTime, linkWindow] =
    await Promise.all([
      prisma.pageView.count({ where: inWindow }),
      prisma.$queryRaw<RawCount[]>`
        SELECT COUNT(DISTINCT "sessionId")::int AS count
        FROM "PageView" WHERE "presskitId" = ${presskitId} AND "createdAt" >= ${since}`,
      // createdAt is stored as UTC without zone — tag it UTC, then shift to local.
      prisma.$queryRaw<RawDaily[]>`
        SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TIME_ZONE}, 'YYYY-MM-DD') AS day,
               COUNT(*)::int AS views
        FROM "PageView" WHERE "presskitId" = ${presskitId} AND "createdAt" >= ${since}
        GROUP BY 1`,
      prisma.pageView.groupBy({ by: ["deviceType"], where: inWindow, _count: { _all: true } }),
      prisma.pageView.groupBy({
        by: ["referrerHost"],
        where: inWindow,
        _count: { _all: true },
        orderBy: { _count: { referrerHost: "desc" } },
        take: TOP_REFERRERS + 1,
      }),
      prisma.trackableLink.findMany({ where: { presskitId }, orderBy: { createdAt: "desc" } }),
      prisma.pageView.groupBy({
        by: ["trackableLinkId"],
        where: { presskitId, trackableLinkId: { not: null } },
        _count: { _all: true },
        _min: { createdAt: true },
        _max: { createdAt: true },
      }),
      prisma.pageView.groupBy({
        by: ["trackableLinkId"],
        where: { ...inWindow, trackableLinkId: { not: null } },
        _count: { _all: true },
      }),
    ]);

  const byDay = new Map(dailyRows.map((row) => [row.day, Number(row.views)]));
  const allTime = new Map(linkAllTime.map((row) => [row.trackableLinkId, row]));
  const windowCounts = new Map(linkWindow.map((row) => [row.trackableLinkId, row._count._all]));

  // orderBy _count on referrerHost skips nulls' count (COUNT(col) ignores
  // NULL), so "direct" may be missing from the top N — merge and re-sort.
  const referrers = referrerRows
    .map((row) => ({ host: row.referrerHost, views: row._count._all }))
    .sort((a, b) => b.views - a.views)
    .slice(0, TOP_REFERRERS);
  if (!referrers.some((r) => r.host === null)) {
    const direct = await prisma.pageView.count({ where: { ...inWindow, referrerHost: null } });
    if (direct > 0) {
      referrers.push({ host: null, views: direct });
      referrers.sort((a, b) => b.views - a.views);
    }
  }

  return {
    plan,
    days,
    requestedDays,
    maxDays: PLAN_LIMITS[plan].analyticsHistoryDays,
    maxTrackableLinks: PLAN_LIMITS[plan].maxTrackableLinks,
    since: since.toISOString(),
    published: presskit.published,
    slug: presskit.slug,
    totalViews,
    uniqueSessions: Number(uniqueRows[0]?.count ?? 0),
    daily: dates.map((date) => ({ date, views: byDay.get(date) ?? 0 })),
    devices: deviceRows
      .map((row) => ({ deviceType: row.deviceType ?? "UNKNOWN", views: row._count._all }))
      .sort((a, b) => b.views - a.views),
    referrers,
    links: links.map((link) => {
      const stats = allTime.get(link.id);
      return {
        id: link.id,
        label: link.label,
        code: link.code,
        active: link.active,
        createdAt: link.createdAt.toISOString(),
        totalViews: stats?._count._all ?? 0,
        windowViews: windowCounts.get(link.id) ?? 0,
        firstViewAt: stats?._min.createdAt?.toISOString() ?? null,
        lastViewAt: stats?._max.createdAt?.toISOString() ?? null,
      };
    }),
  };
}
