import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, Send } from "lucide-react";
import { ANALYTICS_PERIODS, type AnalyticsDailyPoint, type AnalyticsSummary } from "@presskit/shared";
import { getAnalyticsSummary, timeAgo } from "../../api/analytics";
import { apiErrorMessage } from "../../api/axios";
import { Card } from "../../components/ui";

const PERIOD_LABELS: Record<number, string> = { 7: "7 dias", 30: "30 dias", 365: "1 ano" };

const DEVICE_LABELS: Record<string, string> = {
  MOBILE: "Celular",
  DESKTOP: "Computador",
  TABLET: "Tablet",
  UNKNOWN: "Outros",
};

/** Folds the many hosts a network uses (l.instagram.com, lm.facebook.com…)
 * into one name the artist recognizes. */
function referrerLabel(host: string | null): string {
  if (!host) return "Acesso direto";
  const h = host.toLowerCase();
  if (h.includes("whatsapp")) return "WhatsApp";
  if (h.includes("instagram")) return "Instagram";
  if (h.includes("facebook") || h === "fb.me") return "Facebook";
  if (h.includes("google")) return "Google";
  if (h === "t.co" || h.includes("twitter") || h === "x.com") return "X";
  if (h.includes("linkedin")) return "LinkedIn";
  if (h.includes("tiktok")) return "TikTok";
  if (h.includes("youtube")) return "YouTube";
  return h.replace(/^www\./, "");
}

function percent(part: number, total: number) {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

function shortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${day}/${month}`;
}

/** A year of daily bars is unreadable — group into weeks past ~2 months. */
function toBars(daily: AnalyticsDailyPoint[]) {
  if (daily.length <= 60) return daily.map((point) => ({ label: shortDate(point.date), views: point.views }));
  const bars: { label: string; views: number }[] = [];
  // Walk back from today so the last bar is always the current week.
  for (let end = daily.length; end > 0; end -= 7) {
    const slice = daily.slice(Math.max(0, end - 7), end);
    bars.unshift({
      label: `${shortDate(slice[0].date)}–${shortDate(slice[slice.length - 1].date)}`,
      views: slice.reduce((sum, point) => sum + point.views, 0),
    });
  }
  return bars;
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-2xl border border-border bg-bg-elevated p-[18px]">
      <span className="text-[13px] font-semibold text-fg-muted">{label}</span>
      <span className="font-display text-[40px] leading-none text-fg">{value}</span>
      {hint && <span className="text-[13px] font-bold text-[#6EE7B7]">{hint}</span>}
    </div>
  );
}

function ViewsChart({ daily, weekly }: { daily: AnalyticsDailyPoint[]; weekly: boolean }) {
  const bars = toBars(daily);
  const max = Math.max(1, ...bars.map((bar) => bar.views));
  const total = bars.reduce((sum, bar) => sum + bar.views, 0);
  return (
    <div className="flex flex-col gap-2">
      <div
        role="img"
        aria-label={`${total} visitas no período, no máximo ${max} por ${weekly ? "semana" : "dia"}`}
        className="relative flex h-[200px] items-end gap-[3px] border-b border-white/12 sm:gap-1.5"
      >
        <span className="absolute top-0 left-0 text-[11px] text-fg-muted">{max}</span>
        {bars.map((bar, index) => (
          <div
            key={bar.label}
            title={`${bar.label}: ${bar.views} visita${bar.views === 1 ? "" : "s"}`}
            className={
              "min-w-0 flex-1 rounded-t " + (index === bars.length - 1 ? "bg-primary" : "bg-violet")
            }
            style={{ height: bar.views > 0 ? `${Math.max(3, (bar.views / max) * 100)}%` : "2px", opacity: bar.views > 0 ? 1 : 0.35 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-fg-muted">
        <span>{bars[0]?.label}</span>
        <span>{weekly ? "esta semana" : "hoje"}</span>
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <Card className="flex flex-col items-start gap-3">
      <BarChart3 className="text-primary-text" size={28} />
      <h2 className="text-lg font-extrabold text-fg">{title}</h2>
      <p className="max-w-prose text-sm leading-relaxed text-fg-muted">{text}</p>
      <Link
        to="/compartilhar"
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[15px] font-bold text-white hover:bg-primary-hover"
      >
        <Send size={16} /> Ir para Compartilhar
      </Link>
    </Card>
  );
}

export function AnalyticsPage() {
  // What was asked; the API clamps it to the plan window and the toggle
  // shows what was actually applied (summary.days).
  const [requested, setRequested] = useState<number>(30);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsSummary(requested)
      .then((result) => {
        if (cancelled) return;
        setSummary(result);
        setFetchedAt(Date.now());
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, "Não foi possível carregar as visitas."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [requested]);

  function selectPeriod(period: number) {
    if (period === requested) return;
    setLoading(true);
    setError(null);
    setRequested(period);
  }

  const days = summary?.days ?? requested;
  const maxDays = summary?.maxDays ?? 7;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-extrabold text-fg">Quem abriu</h1>
        <p className="text-[13px] text-fg-muted">
          {summary ? (summary.days >= 365 ? "Último ano" : `Últimos ${summary.days} dias`) : " "}
        </p>
      </div>
      <div role="group" aria-label="Período" className="flex gap-1.5 rounded-xl bg-bg-elevated p-1">
        {ANALYTICS_PERIODS.map((period) => {
          const locked = summary !== null && period > maxDays;
          const active = days === period;
          return (
            <button
              key={period}
              type="button"
              disabled={locked || loading}
              aria-pressed={active}
              title={locked ? "Disponível no plano PRO" : undefined}
              onClick={() => selectPeriod(period)}
              className={
                "flex min-h-11 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold transition disabled:cursor-not-allowed " +
                (active ? "bg-bg-elevated-2 text-white" : "text-fg-muted hover:text-fg") +
                (locked ? " opacity-60" : "")
              }
            >
              {PERIOD_LABELS[period]}
              {locked && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-extrabold text-primary-text">
                  PRO
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );

  if (!summary) {
    return (
      <div className="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-7">
        {header}
        {error ? <p className="text-sm text-red-400">{error}</p> : <p className="text-sm text-fg-muted">Carregando...</p>}
      </div>
    );
  }

  const openedLinks = summary.links.filter((link) => link.totalViews > 0).length;
  const viewsFromLinks = summary.links.reduce((sum, link) => sum + link.windowViews, 0);

  const deviceTotal = summary.devices.reduce((sum, row) => sum + row.views, 0);
  const referrerTotals = new Map<string, number>();
  for (const row of summary.referrers) {
    const label = referrerLabel(row.host);
    referrerTotals.set(label, (referrerTotals.get(label) ?? 0) + row.views);
  }
  const referrers = [...referrerTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  const activity = [...summary.links].sort((a, b) => {
    if (a.lastViewAt && b.lastViewAt) return b.lastViewAt.localeCompare(a.lastViewAt);
    if (a.lastViewAt) return -1;
    if (b.lastViewAt) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  const nothingYet = summary.totalViews === 0 && openedLinks === 0;

  return (
    <div className="flex flex-col gap-6 px-4 py-6 md:px-8 md:py-7">
      {header}
      {error && <p className="text-sm text-red-400">{error}</p>}

      {summary.maxDays < 365 && (
        <p className="text-[13px] text-fg-muted">
          No plano {summary.plan} você vê os últimos {summary.maxDays} dias.{" "}
          <Link to="/assinatura" className="font-bold text-primary-text hover:underline">
            Assine o PRO
          </Link>{" "}
          para ver até 1 ano.
        </p>
      )}

      {!summary.published && nothingYet ? (
        <EmptyState
          title="Seu presskit ainda não está no ar"
          text="Publique e envie o link para contratantes. Aqui você vai ver quantas pessoas abriram, de onde vieram e quem já viu o seu material."
        />
      ) : nothingYet ? (
        <EmptyState
          title="Ninguém abriu ainda neste período"
          text="Envie seu presskit para contratantes com um link só de cada um — assim você sabe exatamente quem abriu."
        />
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
            <Kpi label="Visitas" value={summary.totalViews} />
            <Kpi label="Visitantes únicos" value={summary.uniqueSessions} />
            <Kpi
              label="Contratantes que abriram"
              value={openedLinks}
              hint={`de ${summary.links.length} link${summary.links.length === 1 ? "" : "s"} enviado${summary.links.length === 1 ? "" : "s"}`}
            />
            <Kpi
              label="Vieram de links enviados"
              value={viewsFromLinks}
              hint={`${percent(viewsFromLinks, summary.totalViews)}% das visitas`}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <Card className="flex min-w-0 flex-col gap-4 p-[22px]">
              <h2 className="text-[17px] font-extrabold text-fg">
                Visitas por {summary.daily.length > 60 ? "semana" : "dia"}
              </h2>
              <ViewsChart daily={summary.daily} weekly={summary.daily.length > 60} />
              {deviceTotal > 0 && (
                <div className="flex flex-col gap-2 text-[13px] text-[#C9C4D1]">
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {summary.devices.map((row) => (
                      <span key={row.deviceType}>
                        {DEVICE_LABELS[row.deviceType] ?? row.deviceType} {percent(row.views, deviceTotal)}%
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    {referrers.map(([label, views]) => (
                      <span key={label}>
                        {label === "Acesso direto" ? label : `Vieram do ${label}`} {percent(views, summary.totalViews)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="flex min-w-0 flex-col gap-1 p-[22px]">
              <h2 className="mb-2 text-[17px] font-extrabold text-fg">Atividade dos contratantes</h2>
              {activity.length === 0 ? (
                <p className="border-t border-border pt-3 text-sm leading-relaxed text-fg-muted">
                  Nenhum link enviado ainda.{" "}
                  <Link to="/compartilhar" className="font-bold text-primary-text hover:underline">
                    Envie para um contratante
                  </Link>{" "}
                  e acompanhe aqui quem abriu.
                </p>
              ) : (
                <ul className="flex flex-col">
                  {activity.map((link) => {
                    const recent =
                      link.lastViewAt !== null && fetchedAt - new Date(link.lastViewAt).getTime() < 86_400_000;
                    return (
                      <li key={link.id} className="flex gap-3 border-t border-border py-2.5">
                        <span
                          aria-hidden
                          className={
                            "mt-1.5 size-2.5 shrink-0 rounded-full " +
                            (recent ? "bg-primary" : link.lastViewAt ? "bg-[#34D399]" : "bg-[#6B6475]")
                          }
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate text-sm font-bold text-fg">{link.label}</span>
                          <span className="text-[13px] text-fg-muted">
                            {link.lastViewAt
                              ? `Abriu ${link.totalViews}x · última vez ${timeAgo(link.lastViewAt)}`
                              : `Ainda não abriu · enviado ${timeAgo(link.createdAt)}`}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
