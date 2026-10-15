import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Check, Trash2 } from "lucide-react";
import type { AnalyticsLinkStats, PlanKey } from "@presskit/shared";
import { timeAgo } from "../../api/analytics";
import { publicPresskitUrl } from "../../config";
import { Card } from "../../components/ui";

/** Green when the contractor opened the link at least once, gray otherwise. */
export function OpenStatusPill({ views }: { views: number }) {
  const opened = views > 0;
  return (
    <span
      className={
        "shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold " +
        (opened ? "bg-[#0F2E22] text-[#6EE7B7]" : "bg-[#26232B] text-[#C9C4D1]")
      }
    >
      {opened ? `Abriu ${views}x` : "Não abriu"}
    </span>
  );
}

const iconButton =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-fg-muted transition hover:bg-white/5 hover:text-fg focus-visible:outline-2 focus-visible:outline-primary-text";

/**
 * "Links enviados" on /compartilhar: one row per trackable link (one per
 * contractor) with whether it was opened. Stats come from
 * GET /analytics/summary, so this stays a pure view over that data.
 */
export function LinksManager({
  links,
  slug,
  planKey,
  maxTrackableLinks,
  onDelete,
}: {
  links: AnalyticsLinkStats[];
  slug: string;
  planKey: PlanKey;
  maxTrackableLinks: number;
  onDelete: (id: string) => Promise<void>;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleCopy(item: AnalyticsLinkStats) {
    try {
      await navigator.clipboard.writeText(publicPresskitUrl(slug, item.code));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1500);
    } catch {
      // Clipboard blocked — the contractor message box still shows the URL.
    }
  }

  async function handleDelete(item: AnalyticsLinkStats) {
    if (!window.confirm(`Remover o link de "${item.label}"? As visitas dele deixam de aparecer por contratante.`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      await onDelete(item.id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold text-fg">Links enviados</h2>
        <span className="text-[13px] text-fg-muted">
          {links.length} de {maxTrackableLinks} no {planKey}
        </span>
      </div>

      {links.length === 0 ? (
        <p className="border-t border-border pt-4 text-sm leading-relaxed text-fg-muted">
          Nenhum link enviado ainda. Escreva para quem é ao lado e envie — cada contratante ganha um link só dele.
        </p>
      ) : (
        <ul className="flex flex-col">
          {links.map((item) => (
            <li key={item.id} className="flex items-center gap-2 border-t border-border py-2">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-[15px] font-bold text-fg">{item.label}</span>
                <span className="truncate text-[13px] text-fg-muted">
                  Enviado {timeAgo(item.createdAt)}
                  {item.lastViewAt && ` · aberto ${timeAgo(item.lastViewAt)}`}
                </span>
              </div>
              <OpenStatusPill views={item.totalViews} />
              <button
                type="button"
                onClick={() => void handleCopy(item)}
                className={iconButton}
                aria-label={`Copiar link de ${item.label}`}
                title="Copiar link"
              >
                {copiedId === item.id ? <Check size={18} className="text-[#6EE7B7]" /> : <Copy size={18} />}
              </button>
              <button
                type="button"
                onClick={() => void handleDelete(item)}
                disabled={deletingId === item.id}
                className={iconButton + " hover:text-red-300 disabled:opacity-50"}
                aria-label={`Remover link de ${item.label}`}
                title="Remover"
              >
                <Trash2 size={18} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Link to="/quem-abriu" className="text-sm font-bold text-primary-text hover:underline">
        Ver detalhes de quem abriu
      </Link>
    </Card>
  );
}
