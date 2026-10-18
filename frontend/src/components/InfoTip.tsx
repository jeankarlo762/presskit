import { useEffect, useId, useRef, useState } from "react";
import { Info } from "lucide-react";

export type InfoTipContent = string | { title?: string; lines: string[] };

/**
 * The little "i" next to a field: hover/focus shows the spec, click/tap
 * pins it open (phones have no hover). Content is plain text — a title and
 * short lines, e.g. the pixel size an upload needs.
 */
export function InfoTip({ content, label = "Mais informações", className }: { content: InfoTipContent; label?: string; className?: string }) {
  const id = useId();
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const open = pinned || hover;

  useEffect(() => {
    if (!pinned) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setPinned(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setPinned(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned]);

  const body = typeof content === "string" ? { title: undefined, lines: [content] } : content;

  return (
    <span ref={rootRef} className={"relative inline-flex align-middle " + (className ?? "")}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => setPinned((v) => !v)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        className={
          "inline-flex h-6 w-6 items-center justify-center rounded-full text-fg-muted transition hover:bg-white/10 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary-text " +
          (pinned ? "bg-white/10 text-fg" : "")
        }
      >
        <Info size={15} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute left-0 top-full z-30 mt-1.5 w-max max-w-[min(20rem,80vw)] rounded-xl border border-white/10 bg-bg-elevated-2 px-3 py-2.5 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-fg shadow-xl"
        >
          {body.title && <span className="mb-1 block font-bold">{body.title}</span>}
          {body.lines.map((line, index) => (
            <span key={index} className="block text-fg-muted">
              {line}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}
