import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import {
  BACKGROUND_PRESETS,
  SECTION_ALIGNS,
  SECTION_ALIGN_LABELS,
  SECTION_LAYOUTS,
  SECTION_PADDINGS,
  SECTION_PADDING_LABELS,
  SECTION_WIDTHS,
  SECTION_WIDTH_LABELS,
  resolveSectionLayout,
  type SectionStyleInput,
} from "@presskit/shared";
import {
  confirmSectionBackground,
  removeSectionBackground,
  requestSectionBackgroundUploadUrl,
  type Presskit,
  type Section,
} from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { uploadImageToStorage } from "../../lib/uploadImage";
import { prepareImage } from "../../lib/imageResize";
import { FieldError, Select } from "../../components/ui";

/** A color that can be "inherit from the page": swatch + clear button. */
function OptionalColor({
  label,
  value,
  fallback,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  fallback: string;
  onChange: (value: string | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="relative flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-bg px-3 py-2 text-[13px] text-fg">
        <span className="h-6 w-6 shrink-0 rounded-md border border-white/20" style={{ backgroundColor: value ?? fallback }} />
        <span className="min-w-0">
          <span className="block font-bold">{label}</span>
          <span className="block font-mono text-xs uppercase text-fg-muted">{value ?? "da página"}</span>
        </span>
        <input
          type="color"
          value={value ?? fallback}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={label}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label={`Usar ${label.toLowerCase()} da página`}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-elevated-2 text-fg-muted hover:text-fg"
        >
          <Trash2 size={15} />
        </button>
      )}
    </div>
  );
}

export function SectionStylePanel({
  section,
  presskit,
  onStyleChange,
  onSectionChange,
}: {
  section: Section;
  presskit: Presskit;
  /** Debounced autosave + live preview of editable style/layout fields. */
  onStyleChange: (patch: { style?: SectionStyleInput; layout?: string | null }) => void;
  /** Replaces the whole section (after an image upload/removal). */
  onSectionChange: (section: Section) => void;
}) {
  const style = section.style ?? {};
  const layouts = SECTION_LAYOUTS[section.type] ?? [];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadBackground(file: File) {
    setUploading(true);
    setError(null);
    try {
      const prepared = await prepareImage(file, "section-bg");
      const ticket = await requestSectionBackgroundUploadUrl(section.type, prepared.extension);
      await uploadImageToStorage(ticket, prepared.file);
      onSectionChange(await confirmSectionBackground(section.type, ticket.storageKey));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar a imagem"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function removeBackground() {
    setError(null);
    try {
      onSectionChange(await removeSectionBackground(section.type));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover a imagem"));
    }
  }

  const set = (patch: SectionStyleInput) => onStyleChange({ style: patch });

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-bg-elevated-2/40 p-3">
      {layouts.length > 0 && (
        <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
          Layout
          <Select
            value={resolveSectionLayout(section.type, section.layout)}
            onChange={(e) => onStyleChange({ layout: e.target.value })}
          >
            {layouts.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </Select>
        </label>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <OptionalColor label="Fundo" value={style.backgroundColor} fallback={presskit.themeBackgroundColor} onChange={(v) => set({ backgroundColor: v })} />
        <OptionalColor label="Texto" value={style.textColor} fallback={presskit.themeTextColor} onChange={(v) => set({ textColor: v })} />
        <OptionalColor label="Destaque" value={style.accentColor} fallback={presskit.themeAccentColor} onChange={(v) => set({ accentColor: v })} />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-fg-muted">Imagem de fundo da seção</span>
        {style.backgroundImageUrl ? (
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg p-2">
            <img src={style.backgroundImageUrl} alt="" className="h-12 w-20 rounded-lg object-cover" />
            <label className="flex flex-1 flex-col gap-1 text-[12px] font-semibold text-fg-muted">
              <span className="flex justify-between">
                Escurecimento <span className="font-mono">{style.backgroundOverlay ?? 55}%</span>
              </span>
              <input
                type="range"
                min={0}
                max={90}
                value={style.backgroundOverlay ?? 55}
                onChange={(e) => set({ backgroundOverlay: Number(e.target.value) })}
                className="accent-primary"
              />
            </label>
            <button
              type="button"
              onClick={() => void removeBackground()}
              aria-label="Remover imagem de fundo da seção"
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-fg-muted hover:bg-white/5 hover:text-fg"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <label
            className={
              "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-bg px-3 py-2.5 text-sm font-bold text-fg transition hover:border-white/45 " +
              (uploading ? "pointer-events-none opacity-60" : "")
            }
          >
            <ImagePlus size={16} />
            {uploading ? "Enviando..." : "Enviar imagem"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadBackground(file);
              }}
            />
          </label>
        )}
        <FieldError>{error}</FieldError>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-fg-muted">Gradiente ou textura</span>
        <div role="radiogroup" aria-label="Preset de fundo da seção" className="grid grid-cols-5 gap-1.5">
          {BACKGROUND_PRESETS.map((preset) => {
            const selected = (style.backgroundPreset ?? "none") === preset.key;
            return (
              <button
                key={preset.key}
                type="button"
                role="radio"
                aria-checked={selected}
                title={preset.label}
                onClick={() => set({ backgroundPreset: preset.key === "none" ? null : preset.key })}
                className={
                  "relative h-9 overflow-hidden rounded-lg border transition " +
                  (selected ? "border-primary ring-1 ring-primary" : "border-white/10 hover:border-white/30")
                }
                style={
                  {
                    "--presskit-bg": style.backgroundColor ?? presskit.themeBackgroundColor,
                    "--presskit-text": style.textColor ?? presskit.themeTextColor,
                    "--presskit-accent": style.accentColor ?? presskit.themeAccentColor,
                    backgroundColor: style.backgroundColor ?? presskit.themeBackgroundColor,
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
                <span className="sr-only">{preset.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-fg-muted">
          Largura
          <Select value={style.width ?? ""} onChange={(e) => set({ width: (e.target.value || null) as SectionStyleInput["width"] })} className="py-1.5">
            <option value="">Do modelo</option>
            {SECTION_WIDTHS.map((key) => (
              <option key={key} value={key}>
                {SECTION_WIDTH_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-fg-muted">
          Espaçamento
          <Select value={style.padding ?? ""} onChange={(e) => set({ padding: (e.target.value || null) as SectionStyleInput["padding"] })} className="py-1.5">
            <option value="">Do modelo</option>
            {SECTION_PADDINGS.map((key) => (
              <option key={key} value={key}>
                {SECTION_PADDING_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] font-semibold text-fg-muted">
          Alinhamento
          <Select value={style.align ?? ""} onChange={(e) => set({ align: (e.target.value || null) as SectionStyleInput["align"] })} className="py-1.5">
            <option value="">Do modelo</option>
            {SECTION_ALIGNS.map((key) => (
              <option key={key} value={key}>
                {SECTION_ALIGN_LABELS[key]}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <label className="flex min-h-9 items-center gap-2.5 text-[13px] font-semibold text-fg-muted">
        <input
          type="checkbox"
          checked={Boolean(style.divider)}
          onChange={(e) => set({ divider: e.target.checked ? true : null })}
          className="h-4 w-4 accent-primary"
        />
        Linha divisória acima da seção
      </label>
    </div>
  );
}
