import { z } from "zod";
import type { PlanKey } from "../constants/category";

/** Period options on the "Quem abriu" screen. The API clamps whatever is
 * asked to the plan's PLAN_LIMITS[plan].analyticsHistoryDays. */
export const ANALYTICS_PERIODS = [7, 30, 365] as const;
export type AnalyticsPeriod = (typeof ANALYTICS_PERIODS)[number];

export const analyticsSummaryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(30),
});
export type AnalyticsSummaryQuery = z.infer<typeof analyticsSummaryQuerySchema>;

export type AnalyticsDailyPoint = { date: string; views: number };

export type AnalyticsLinkStats = {
  id: string;
  label: string;
  code: string;
  active: boolean;
  createdAt: string;
  /** All-time views through this link (not limited to the window). */
  totalViews: number;
  /** Views through this link inside the requested window. */
  windowViews: number;
  firstViewAt: string | null;
  lastViewAt: string | null;
};

export type AnalyticsSummary = {
  /** Effective plan (an active PRO trial counts as PRO). */
  plan: PlanKey;
  /** Days actually applied after clamping to the plan. */
  days: number;
  requestedDays: number;
  maxDays: number;
  maxTrackableLinks: number;
  since: string;
  published: boolean;
  slug: string;
  totalViews: number;
  uniqueSessions: number;
  daily: AnalyticsDailyPoint[];
  devices: { deviceType: string; views: number }[];
  /** `host: null` means no referrer (direct access, apps that strip it). */
  referrers: { host: string | null; views: number }[];
  links: AnalyticsLinkStats[];
  /** Clicks on conversion elements inside the window, e.g. "whatsapp" or "quicklink:spotify". */
  clicks: { target: string; count: number }[];
};
