import type { DownloadsSectionData } from "../schemas/section";
import { SectionHeading } from "./SectionHeading";
import { presskitButtonClass } from "./templates";

function formatSize(bytes: number | undefined): string | null {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(bytes > 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function extensionOf(url: string): string {
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(url);
  return match?.[1]?.toUpperCase() ?? "LINK";
}

/** Files hosted on our /media route get a readable filename on download;
 * external links are used as they are. */
function downloadHref(url: string, label: string): string {
  if (!/\/media\/presskits\//.test(url)) return url;
  const extension = extensionOf(url).toLowerCase();
  const name = `${label.replace(/[^\w.\- ]/g, "").trim() || "arquivo"}.${extension}`;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}name=${encodeURIComponent(name)}`;
}

export function DownloadsBlock({
  title,
  data,
  layout,
  downloadLabel,
}: {
  title: string;
  data: DownloadsSectionData;
  layout: string;
  downloadLabel: string;
}) {
  const items = data.items ?? [];
  if (items.length === 0) return null;
  const cards = layout === "cards";

  return (
    <section className="flex flex-col gap-4">
      <SectionHeading>{title}</SectionHeading>
      <ul className={cards ? "grid grid-cols-1 gap-3 @3xl:grid-cols-2" : "flex flex-col divide-y divide-[var(--presskit-border)]"}>
        {items.map((item, index) => {
          const size = formatSize(item.sizeBytes);
          const extension = extensionOf(item.url);
          return (
            <li
              key={index}
              className={
                cards
                  ? "flex items-center justify-between gap-4 rounded-[var(--pk-card-radius)] border border-[var(--presskit-border)] bg-[var(--presskit-hover)] p-4"
                  : "flex items-center justify-between gap-4 py-3"
              }
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--pk-btn-radius)] bg-[var(--presskit-accent)] text-[10px] font-bold text-[var(--presskit-on-accent)]">
                  {extension}
                </span>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[15px] font-semibold">{item.label}</span>
                  {size && <span className="text-xs text-[var(--presskit-muted)]">{size}</span>}
                </div>
              </div>
              <a
                href={downloadHref(item.url, item.label)}
                target="_blank"
                rel="noopener noreferrer"
                data-track={`download:${index}`}
                className={presskitButtonClass("outline", "sm")}
              >
                {downloadLabel}
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
