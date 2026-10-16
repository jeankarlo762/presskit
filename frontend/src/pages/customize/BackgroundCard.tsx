import { useState } from "react";
import { Wand2 } from "lucide-react";
import {
  BACKGROUND_ATTACHMENTS,
  BACKGROUND_ATTACHMENT_LABELS,
  BACKGROUND_BLUR_MAX,
  BACKGROUND_OVERLAY_MAX,
  BACKGROUND_POSITIONS,
  BACKGROUND_POSITION_LABELS,
  BACKGROUND_PRESETS,
  type BackgroundAttachment,
  type BackgroundPosition,
  type PresskitUpdateInput,
} from "@presskit/shared";
import type { Presskit } from "../../api/presskit";
import { suggestPaletteFromImage } from "../../lib/colorFromImage";
import { Button, FieldError, Select } from "../../components/ui";
import { ImageSlotField } from "./ImageSlotField";

function Slider({
  label,
  value,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-[13px] font-semibold text-fg-muted">
      <span className="flex justify-between">
        {label}
        <span className="font-mono text-xs">
          {value}
          {unit}
        </span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-primary"
      />
    </label>
  );
}

export function BackgroundCard({
  presskit,
  onImageChange,
  onChange,
}: {
  presskit: Presskit;
  onImageChange: (presskit: Presskit) => void;
  onChange: (patch: PresskitUpdateInput) => void;
}) {
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const hasImage = Boolean(presskit.themeBackgroundImageUrl);
  const paletteSource = presskit.coverImageUrl ?? presskit.themeBackgroundImageUrl;

  async function suggestColors() {
    if (!paletteSource) return;
    setSuggesting(true);
    setSuggestError(null);
    try {
      const palette = await suggestPaletteFromImage(paletteSource);
      onChange({
        themeBackgroundColor: palette.backgroundColor,
        themeTextColor: palette.textColor,
        themeAccentColor: palette.accentColor,
      });
    } catch {
      setSuggestError("Não foi possível ler as cores dessa imagem");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ImageSlotField
        slot="background"
        label="Imagem de fundo"
        hint="Fica atrás de toda a página. No modelo Palco, sem capa, ela vira a capa do topo."
        url={presskit.themeBackgroundImageUrl}
        onChange={onImageChange}
      />

      {hasImage && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Slider
            label="Escurecimento"
            value={presskit.themeBackgroundOverlay}
            max={BACKGROUND_OVERLAY_MAX}
            unit="%"
            onChange={(v) => onChange({ themeBackgroundOverlay: v })}
          />
          <Slider
            label="Desfoque"
            value={presskit.themeBackgroundBlur}
            max={BACKGROUND_BLUR_MAX}
            unit="px"
            onChange={(v) => onChange({ themeBackgroundBlur: v })}
          />
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
            Foco da imagem
            <Select
              value={presskit.themeBackgroundPosition}
              onChange={(e) => onChange({ themeBackgroundPosition: e.target.value as BackgroundPosition })}
            >
              {BACKGROUND_POSITIONS.map((key) => (
                <option key={key} value={key}>
                  {BACKGROUND_POSITION_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
            Comportamento
            <Select
              value={presskit.themeBackgroundAttachment}
              onChange={(e) => onChange({ themeBackgroundAttachment: e.target.value as BackgroundAttachment })}
            >
              {BACKGROUND_ATTACHMENTS.map((key) => (
                <option key={key} value={key}>
                  {BACKGROUND_ATTACHMENT_LABELS[key]}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex min-h-11 items-center gap-2.5 text-[13px] font-semibold text-fg-muted sm:col-span-2">
            <input
              type="checkbox"
              checked={presskit.themeBackgroundRepeat}
              onChange={(e) => onChange({ themeBackgroundRepeat: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Repetir como padrão (para texturas pequenas)
          </label>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-fg-muted">Gradiente ou textura</span>
        <div role="radiogroup" aria-label="Preset de fundo" className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {BACKGROUND_PRESETS.map((preset) => {
            const selected = presskit.themeBackgroundPreset === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                title={preset.label}
                onClick={() => onChange({ themeBackgroundPreset: preset.key })}
                className={
                  "flex flex-col gap-1 rounded-xl border p-1 text-left transition " +
                  (selected ? "border-primary bg-bg-elevated-2" : "border-white/10 hover:border-white/30")
                }
              >
                <span
                  className="relative block h-11 w-full overflow-hidden rounded-lg"
                  style={
                    {
                      "--presskit-bg": presskit.themeBackgroundColor,
                      "--presskit-text": presskit.themeTextColor,
                      "--presskit-accent": presskit.themeAccentColor,
                      backgroundColor: presskit.themeBackgroundColor,
                    } as React.CSSProperties
                  }
                >
                  {preset.css && (
                    <span
                      className="absolute inset-0"
                      style={{
                        backgroundImage: preset.css,
                        backgroundSize: preset.size ?? "cover",
                        backgroundRepeat: preset.size ? "repeat" : "no-repeat",
                      }}
                    />
                  )}
                </span>
                <span className="px-1 text-[11px] font-bold text-fg">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {paletteSource && (
        <div className="flex flex-col gap-1">
          <Button type="button" variant="secondary" size="sm" className="self-start" disabled={suggesting} onClick={() => void suggestColors()}>
            <Wand2 size={14} />
            {suggesting ? "Lendo as cores..." : `Sugerir cores a partir da ${presskit.coverImageUrl ? "capa" : "imagem de fundo"}`}
          </Button>
          <FieldError>{suggestError}</FieldError>
        </div>
      )}
    </div>
  );
}
