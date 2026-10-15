import type { CSSProperties } from "react";
import { FONT_FAMILY_CSS, TEMPLATE_OPTIONS, type FontKey, type TemplateKey } from "@presskit/shared";

type Colors = { bg: string; fg: string; accent: string };

/** A tiny, static sketch of each template in the artist's current colors —
 * enough to tell the layouts apart without rendering the real page 4x. */
function TemplateThumb({ templateKey, colors, bodyFont }: { templateKey: TemplateKey; colors: Colors; bodyFont: FontKey }) {
  const option = TEMPLATE_OPTIONS.find((t) => t.key === templateKey);
  const font = FONT_FAMILY_CSS[option?.suggestedHeadingFontKey ?? bodyFont];
  const base: CSSProperties = { backgroundColor: colors.bg, color: colors.fg };

  switch (templateKey) {
    case "palco":
      return (
        <div
          style={{ ...base, backgroundColor: `color-mix(in srgb, ${colors.accent} 28%, ${colors.bg})` }}
          className="flex h-[72px] items-end rounded-lg p-2"
        >
          <span style={{ fontFamily: font }} className="text-[22px] leading-none font-bold uppercase">
            Nome
          </span>
        </div>
      );
    case "minimal":
      return (
        <div style={base} className="flex h-[72px] flex-col justify-center gap-1.5 rounded-lg px-3">
          <span style={{ fontFamily: font }} className="text-[13px] leading-none font-medium">
            Nome
          </span>
          <span className="h-px w-full opacity-25" style={{ backgroundColor: colors.fg }} />
          <span className="h-1 w-2/3 rounded-full opacity-25" style={{ backgroundColor: colors.fg }} />
        </div>
      );
    case "editorial":
      return (
        <div style={base} className="flex h-[72px] flex-col items-center justify-center gap-1 rounded-lg">
          <span className="h-px w-5" style={{ backgroundColor: colors.accent }} />
          <span style={{ fontFamily: font }} className="text-[18px] leading-none italic">
            Nome
          </span>
          <span className="h-px w-5" style={{ backgroundColor: colors.accent }} />
        </div>
      );
    default:
      return (
        <div style={base} className="flex h-[72px] flex-col justify-end gap-1 rounded-lg p-2">
          <span
            className="w-fit rounded-full border px-1.5 text-[8px] font-bold uppercase"
            style={{ color: colors.accent, borderColor: `color-mix(in srgb, ${colors.fg} 20%, transparent)` }}
          >
            DJ
          </span>
          <span style={{ fontFamily: font }} className="text-[15px] leading-none font-semibold">
            Nome
          </span>
        </div>
      );
  }
}

export function TemplatePicker({
  value,
  colors,
  bodyFont,
  onSelect,
}: {
  value: TemplateKey;
  colors: Colors;
  bodyFont: FontKey;
  onSelect: (key: TemplateKey) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Modelo" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
      {TEMPLATE_OPTIONS.map((option) => {
        const selected = option.key === value;
        return (
          <button
            key={option.key}
            type="button"
            role="radio"
            aria-checked={selected}
            title={option.description}
            onClick={() => onSelect(option.key)}
            className={
              "flex flex-col gap-1.5 rounded-xl p-1.5 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text " +
              (selected ? "border-2 border-primary" : "border border-white/12 hover:border-white/30")
            }
          >
            <TemplateThumb templateKey={option.key} colors={colors} bodyFont={bodyFont} />
            <span className="px-1 pb-1 text-[13px] font-bold text-fg">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
