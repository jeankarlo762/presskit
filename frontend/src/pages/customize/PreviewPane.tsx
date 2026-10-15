import { useEffect, useRef, useState } from "react";
import { ExternalLink, Monitor, Smartphone } from "lucide-react";
import type { PublicPresskit } from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";

type Device = "mobile" | "desktop";

/** Desktop preview is rendered at a real desktop width and scaled down to
 * fit the column — the renderer's layout uses container queries, so this
 * shows the actual desktop layout instead of a squeezed mobile one. */
const DESKTOP_WIDTH = 1200;
const DESKTOP_VIEWPORT_HEIGHT = 760;

function DesktopFrame({ presskit }: { presskit: PublicPresskit }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(entry.contentRect.width / DESKTOP_WIDTH);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} className="w-full overflow-hidden rounded-2xl border border-white/12 bg-bg-elevated">
      <div className="flex h-7 items-center gap-1.5 border-b border-white/8 px-3" aria-hidden>
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
        <span className="h-2 w-2 rounded-full bg-white/20" />
      </div>
      <div style={{ height: DESKTOP_VIEWPORT_HEIGHT * scale }} className="overflow-hidden">
        <div
          style={{
            width: DESKTOP_WIDTH,
            height: DESKTOP_VIEWPORT_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
          className="overflow-y-auto"
        >
          <PresskitRenderer presskit={presskit} />
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ presskit }: { presskit: PublicPresskit }) {
  return (
    <div className="w-full max-w-[340px] rounded-[34px] border border-white/12 bg-bg-elevated p-3">
      <div className="h-[620px] max-h-[70vh] overflow-y-auto overscroll-contain rounded-3xl">
        <PresskitRenderer presskit={presskit} />
      </div>
    </div>
  );
}

export function PreviewPane({ presskit, publicUrl }: { presskit: PublicPresskit; publicUrl: string | null }) {
  const [device, setDevice] = useState<Device>("mobile");

  const tab = (value: Device, label: string, Icon: typeof Smartphone) => (
    <button
      type="button"
      role="tab"
      aria-selected={device === value}
      onClick={() => setDevice(value)}
      className={
        "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition " +
        (device === value ? "bg-bg-elevated-2 text-fg" : "text-fg-muted hover:text-fg")
      }
    >
      <Icon size={16} />
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <div role="tablist" aria-label="Tamanho da prévia" className="flex w-full max-w-[340px] gap-1 rounded-2xl border border-border bg-bg-elevated p-1">
        {tab("mobile", "Celular", Smartphone)}
        {tab("desktop", "Computador", Monitor)}
      </div>

      {device === "mobile" ? <PhoneFrame presskit={presskit} /> : <DesktopFrame presskit={presskit} />}

      {publicUrl ? (
        <a
          href={publicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-primary-text hover:underline"
        >
          Abrir página
          <ExternalLink size={15} />
        </a>
      ) : (
        <p className="text-center text-[13px] text-fg-muted">Publique o presskit para abrir a página completa.</p>
      )}
    </div>
  );
}
