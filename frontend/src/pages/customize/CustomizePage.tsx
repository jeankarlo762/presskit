import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  BUTTON_STYLE_LABELS,
  BUTTON_STYLE_RADIUS,
  BUTTON_STYLES,
  COLOR_PALETTES,
  FONT_FAMILY_CSS,
  FONT_OPTIONS,
  TEMPLATE_OPTIONS,
  resolveTemplateKey,
  type ColorPalette,
  type FontKey,
  type PresskitUpdateInput,
  type PublicPresskit,
  type SectionStyleInput,
  type SectionType,
  type TemplateKey,
} from "@presskit/shared";
import {
  addSection,
  getMyPresskit,
  listGalleryPhotos,
  listMedia,
  listPress,
  listSections,
  listTourDates,
  removeSection,
  renameSection,
  reorderSections,
  setSectionVisibility,
  updatePresskit,
  updateSectionStyle,
  type GalleryPhoto,
  type MediaEmbed,
  type PressMention,
  type Presskit,
  type Section,
  type TourDate,
} from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { publicPresskitUrl } from "../../config";
import { Card, FieldError, Select } from "../../components/ui";
import { TemplatePicker } from "./TemplatePicker";
import { SectionsOrderCard } from "./SectionsOrderCard";
import { PreviewPane } from "./PreviewPane";
import { BackgroundCard } from "./BackgroundCard";
import { IdentityCard } from "./IdentityCard";
import { ConversionCard } from "./ConversionCard";
import { LanguagesCard } from "./LanguagesCard";
import { DomainCard } from "./DomainCard";
import { SiteCard } from "./SiteCard";

const SECTION_STYLE_DELAY_MS = 600;

const AUTOSAVE_DELAY_MS = 700;

type SaveStatus = "idle" | "pending" | "saving" | "saved" | "error";

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "Salvo automaticamente",
  pending: "Alterações não salvas…",
  saving: "Salvando…",
  saved: "Salvo",
  error: "Erro ao salvar",
};

/**
 * Autosave: every change applies to the local state (so the preview reacts
 * immediately) and is merged into one pending PATCH, sent after a short
 * pause. Section changes (order/visibility/name) go out right away through
 * the sections API. One status label covers both.
 */
function useAutosave() {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const pending = useRef<PresskitUpdateInput>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(0);

  const track = useCallback(async <T,>(work: Promise<T>): Promise<T> => {
    inFlight.current += 1;
    setStatus("saving");
    try {
      const result = await work;
      inFlight.current -= 1;
      if (inFlight.current === 0 && Object.keys(pending.current).length === 0) {
        setStatus("saved");
        setError(null);
      }
      return result;
    } catch (err) {
      inFlight.current -= 1;
      setStatus("error");
      setError(apiErrorMessage(err, "Não foi possível salvar. Tente de novo."));
      throw err;
    }
  }, []);

  const flush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const patch = pending.current;
    pending.current = {};
    if (Object.keys(patch).length === 0) return;
    track(updatePresskit(patch)).catch(() => undefined);
  }, [track]);

  const queue = useCallback(
    (patch: PresskitUpdateInput) => {
      pending.current = { ...pending.current, ...patch };
      setStatus("pending");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, AUTOSAVE_DELAY_MS);
    },
    [flush],
  );

  // Leaving the page mid-debounce still saves.
  useEffect(() => flush, [flush]);

  return { status, error, queue, track };
}

function samePalette(presskit: Presskit, palette: ColorPalette) {
  return (
    presskit.themeBackgroundColor.toLowerCase() === palette.backgroundColor.toLowerCase() &&
    presskit.themeTextColor.toLowerCase() === palette.textColor.toLowerCase() &&
    presskit.themeAccentColor.toLowerCase() === palette.accentColor.toLowerCase()
  );
}

/** Drops cleared (null) keys so the preview matches what the server keeps. */
function pruneStyle<T extends Record<string, unknown>>(style: T): T {
  return Object.fromEntries(Object.entries(style).filter(([, v]) => v !== null && v !== undefined)) as T;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="relative flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-bg px-3 py-2 text-[13px] text-fg focus-within:border-primary-text">
      <span className="h-6 w-6 shrink-0 rounded-md border border-white/20" style={{ backgroundColor: value }} />
      <span className="min-w-0">
        <span className="block font-bold">{label}</span>
        <span className="block font-mono text-xs uppercase text-fg-muted">{value}</span>
      </span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        aria-label={label}
      />
    </label>
  );
}

function SectionCard({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={"flex flex-col gap-3 p-5 " + (className ?? "")}>
      <h2 className="text-[15px] font-extrabold text-fg">{title}</h2>
      {children}
    </Card>
  );
}

export function CustomizePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, error: saveError, queue, track } = useAutosave();

  const [presskit, setPresskit] = useState<Presskit | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [media, setMedia] = useState<MediaEmbed[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [press, setPress] = useState<PressMention[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const stylePending = useRef(new Map<SectionType, { style?: SectionStyleInput; layout?: string | null }>());
  const styleTimers = useRef(new Map<SectionType, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const found = await getMyPresskit();
        if (cancelled) return;
        if (!found) {
          navigate("/onboarding");
          return;
        }
        const [sectionsRes, mediaRes, galleryRes, tourDatesRes, pressRes] = await Promise.all([
          listSections(),
          listMedia(),
          listGalleryPhotos(),
          listTourDates(),
          listPress(),
        ]);
        if (cancelled) return;
        setSections([...sectionsRes].sort((a, b) => a.order - b.order));
        setMedia(mediaRes);
        setGallery(galleryRes);
        setTourDates(tourDatesRes);
        setPress(pressRes);
        setPresskit(found);
      } catch (err) {
        if (!cancelled) setLoadError(apiErrorMessage(err, "Não foi possível carregar seu presskit."));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  if (loadError) return <p className="p-8 text-red-400">{loadError}</p>;
  if (!presskit) return <p className="p-8 text-fg-muted">Carregando...</p>;

  function change(patch: PresskitUpdateInput & Partial<Presskit>) {
    setPresskit((prev) => (prev ? { ...prev, ...patch } : prev));
    queue(patch);
  }

  // Image uploads come back with the whole presskit from the server; only
  // the image fields are taken so an in-flight autosave isn't overwritten.
  function applyImages(updated: Presskit) {
    setPresskit((prev) =>
      prev
        ? {
            ...prev,
            themeBackgroundImageUrl: updated.themeBackgroundImageUrl,
            coverImageUrl: updated.coverImageUrl,
            avatarImageUrl: updated.avatarImageUrl,
            logoImageUrl: updated.logoImageUrl,
          }
        : prev,
    );
  }

  function selectTemplate(key: TemplateKey) {
    const option = TEMPLATE_OPTIONS.find((t) => t.key === key);
    change({ templateKey: key, themeHeadingFontKey: option?.suggestedHeadingFontKey ?? null });
  }

  function moveSection(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    if (!moved) return;
    next.splice(target, 0, moved);
    const reordered = next.map((s, order) => ({ ...s, order }));
    setSections(reordered);
    track(reorderSections(reordered.map((s) => s.type))).catch(() => undefined);
  }

  function toggleSection(section: Section, visible: boolean) {
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, visible } : s)));
    track(setSectionVisibility(section.type, visible)).catch(() => {
      setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, visible: !visible } : s)));
    });
  }

  async function handleRename(section: Section, title: string) {
    const saved = await track(renameSection(section, title));
    setSections((prev) => prev.map((s) => (s.id === section.id ? { ...s, title: saved.title } : s)));
  }

  async function handleAddSection(type: SectionType) {
    const created = await track(addSection(type));
    setSections((prev) => [...prev.filter((s) => s.type !== created.type), created].sort((a, b) => a.order - b.order));
  }

  async function handleRemoveSection(section: Section) {
    await track(removeSection(section.type));
    setSections((prev) => prev.filter((s) => s.id !== section.id));
  }

  // Style edits apply to the preview at once and are merged per section
  // into one PATCH after a short pause (same idea as the presskit autosave).
  function handleStyleChange(section: Section, patch: { style?: SectionStyleInput; layout?: string | null }) {
    setSections((prev) =>
      prev.map((s) =>
        s.id === section.id
          ? {
              ...s,
              layout: patch.layout !== undefined ? patch.layout : s.layout,
              style: patch.style ? pruneStyle({ ...(s.style ?? {}), ...patch.style }) : s.style,
            }
          : s,
      ),
    );
    const key = section.type;
    const merged = stylePending.current.get(key) ?? {};
    stylePending.current.set(key, {
      style: patch.style ? { ...(merged.style ?? {}), ...patch.style } : merged.style,
      layout: patch.layout !== undefined ? patch.layout : merged.layout,
    });
    const existing = styleTimers.current.get(key);
    if (existing) clearTimeout(existing);
    styleTimers.current.set(
      key,
      setTimeout(() => {
        const body = stylePending.current.get(key);
        stylePending.current.delete(key);
        styleTimers.current.delete(key);
        if (!body) return;
        track(updateSectionStyle(key, body))
          .then((saved) =>
            setSections((prev) => prev.map((s) => (s.type === key ? { ...s, style: saved.style, layout: saved.layout } : s))),
          )
          .catch(() => undefined);
      }, SECTION_STYLE_DELAY_MS),
    );
  }

  function replaceSection(saved: Section) {
    setSections((prev) => prev.map((s) => (s.id === saved.id ? { ...s, style: saved.style, layout: saved.layout } : s)));
  }

  const templateKey = resolveTemplateKey(presskit.templateKey);
  const colors = { bg: presskit.themeBackgroundColor, fg: presskit.themeTextColor, accent: presskit.themeAccentColor };

  // Spread the presskit so every theme/identity field reaches the preview
  // without listing each one (same approach as the editor page).
  const previewPresskit: PublicPresskit = {
    ...presskit,
    artistName: presskit.displayName ?? user?.name ?? "Seu nome",
    ogTitleOverride: null,
    ogDescriptionOverride: null,
    sections: sections.map((s) => ({ ...s, data: s.data ?? {} })),
    mediaEmbeds: media,
    galleryPhotos: gallery,
    tourDates,
    pressMentions: press,
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:flex-row lg:items-start">
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <h1 className="text-[26px] font-extrabold text-fg">Personalizar</h1>
          <span
            role="status"
            className={"text-[13px] " + (status === "error" ? "text-red-400" : "text-fg-muted")}
          >
            {STATUS_LABEL[status]}
          </span>
        </div>
        {saveError && status === "error" && <FieldError>{saveError}</FieldError>}

        <SectionCard title="Modelo">
          <TemplatePicker value={templateKey} colors={colors} bodyFont={presskit.themeFontKey} onSelect={selectTemplate} />
        </SectionCard>

        <SectionCard title="Cores">
          <div className="flex flex-wrap gap-2">
            {COLOR_PALETTES.map((palette) => {
              const selected = samePalette(presskit, palette);
              return (
                <button
                  key={palette.key}
                  type="button"
                  aria-label={`Paleta ${palette.label}`}
                  aria-pressed={selected}
                  title={palette.label}
                  onClick={() =>
                    change({
                      themeBackgroundColor: palette.backgroundColor,
                      themeTextColor: palette.textColor,
                      themeAccentColor: palette.accentColor,
                    })
                  }
                  className={
                    "flex h-11 w-[76px] overflow-hidden rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text " +
                    (selected ? "ring-2 ring-white ring-offset-2 ring-offset-bg-elevated" : "border border-white/15 hover:border-white/40")
                  }
                >
                  <span className="flex-1" style={{ backgroundColor: palette.backgroundColor }} />
                  <span className="flex-1" style={{ backgroundColor: palette.textColor }} />
                  <span className="flex-1" style={{ backgroundColor: palette.accentColor }} />
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <ColorField
              label="Fundo"
              value={presskit.themeBackgroundColor}
              onChange={(v) => change({ themeBackgroundColor: v })}
            />
            <ColorField label="Texto" value={presskit.themeTextColor} onChange={(v) => change({ themeTextColor: v })} />
            <ColorField
              label="Destaque"
              value={presskit.themeAccentColor}
              onChange={(v) => change({ themeAccentColor: v })}
            />
          </div>
        </SectionCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SectionCard title="Fontes">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
              Títulos
              <Select
                value={presskit.themeHeadingFontKey ?? ""}
                onChange={(e) => change({ themeHeadingFontKey: (e.target.value || null) as FontKey | null })}
                style={{ fontFamily: FONT_FAMILY_CSS[presskit.themeHeadingFontKey ?? presskit.themeFontKey] }}
              >
                <option value="">Igual ao texto</option>
                {FONT_OPTIONS.map((font) => (
                  <option key={font.key} value={font.key} style={{ fontFamily: FONT_FAMILY_CSS[font.key] }}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-fg-muted">
              Texto
              <Select
                value={presskit.themeFontKey}
                onChange={(e) => change({ themeFontKey: e.target.value as FontKey })}
                style={{ fontFamily: FONT_FAMILY_CSS[presskit.themeFontKey] }}
              >
                {FONT_OPTIONS.map((font) => (
                  <option key={font.key} value={font.key} style={{ fontFamily: FONT_FAMILY_CSS[font.key] }}>
                    {font.label}
                  </option>
                ))}
              </Select>
            </label>
          </SectionCard>

          <SectionCard title="Botões">
            <div role="radiogroup" aria-label="Estilo dos botões" className="flex gap-1.5">
              {BUTTON_STYLES.map((style) => {
                const selected = presskit.themeButtonStyle === style;
                return (
                  <button
                    key={style}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => change({ themeButtonStyle: style })}
                    style={{ borderRadius: BUTTON_STYLE_RADIUS[style] }}
                    className={
                      "min-h-11 flex-1 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text " +
                      (selected
                        ? "border-2 border-primary bg-bg-elevated-2 text-fg"
                        : "border border-white/15 bg-bg text-fg-muted hover:text-fg")
                    }
                  >
                    {BUTTON_STYLE_LABELS[style]}
                  </button>
                );
              })}
            </div>
          </SectionCard>
        </div>

        <SectionCard title="Fundo">
          <BackgroundCard presskit={presskit} onImageChange={applyImages} onChange={change} />
        </SectionCard>

        <SectionCard title="Identidade: capa, foto, logo e vídeo">
          <IdentityCard presskit={presskit} onImageChange={applyImages} onChange={change} />
        </SectionCard>

        <SectionCard title="Contato rápido e links">
          <ConversionCard presskit={presskit} onChange={change} />
        </SectionCard>

        <SectionCard title="Site: frase, menu e abas">
          <SiteCard presskit={presskit} onChange={change} />
        </SectionCard>

        <SectionsOrderCard
          sections={sections}
          presskit={presskit}
          onMove={moveSection}
          onToggle={toggleSection}
          onRename={handleRename}
          onAdd={handleAddSection}
          onRemove={handleRemoveSection}
          onStyleChange={handleStyleChange}
          onSectionChange={replaceSection}
        />

        <SectionCard title="Idiomas">
          <LanguagesCard
            presskit={presskit}
            sections={sections}
            onChange={change}
            onSectionSaved={(saved) =>
              setSections((prev) => prev.map((s) => (s.id === saved.id ? { ...s, titleEn: saved.titleEn, dataEn: saved.dataEn } : s)))
            }
          />
        </SectionCard>

        <SectionCard title="Domínio próprio">
          <DomainCard />
        </SectionCard>
      </div>

      <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[360px]" aria-label="Prévia">
        <PreviewPane
          presskit={previewPresskit}
          publicUrl={presskit.published ? publicPresskitUrl(presskit.slug) : null}
        />
      </aside>
    </div>
  );
}
