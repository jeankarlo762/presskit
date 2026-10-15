import type { AnalyticsSummary } from "@presskit/shared";
import { api } from "./axios";

export async function getAnalyticsSummary(days: number) {
  const { data } = await api.get<{ summary: AnalyticsSummary }>("/analytics/summary", { params: { days } });
  return data.summary;
}

/** "agora", "há 20 min", "há 3 h", "ontem", "há 5 dias", then the date. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "ontem";
  if (days < 30) return `há ${days} dias`;
  return new Date(iso).toLocaleDateString("pt-BR");
}
