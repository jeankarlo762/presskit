import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, Circle, ExternalLink, Monitor, Palette, Smartphone } from "lucide-react";
import {
  FONT_FAMILY_CSS,
  SECTION_DEFAULT_TITLES,
  type BioSectionData,
  type ContactSectionData,
  type PublicPresskit,
} from "@presskit/shared";
import { AUDIO_PROVIDERS, PresskitRenderer, VIDEO_PROVIDERS } from "@presskit/shared/ui";
import {
  getMyPresskit,
  listGalleryPhotos,
  listMedia,
  listSections,
  listTourDates,
  publishPresskit,
  unpublishPresskit,
  type GalleryPhoto,
  type MediaEmbed,
  type Presskit,
  type Section,
  type TourDate,
} from "../api/presskit";
import { useAuthStore } from "../store/auth.store";
import { publicPresskitUrl, SITE_HOST } from "../config";
import { Button } from "../components/ui";
import { BioForm } from "./editor/BioForm";
import { ContactForm } from "./editor/ContactForm";
import { EmbedManager } from "./editor/EmbedManager";
import { GalleryManager } from "./editor/GalleryManager";
import { TourDatesManager } from "./editor/TourDatesManager";

const EMPTY_BIO: BioSectionData = { shortBio: "", longBio: "" };
const EMPTY_CONTACT: ContactSectionData = { email: "", socialLinks: [] };

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [presskit, setPresskit] = useState<Presskit | null>(null);
  // `sections` is the authoritative (server-confirmed) state — it only
  // changes on load or after a real save, so it's safe to feed into each
  // form's `initial` prop without fighting active typing. `previewSections`
  // is a separate, ephemeral copy that also absorbs live (unsaved)
  // keystrokes, and drives the preview panel only. Resyncing one into the
  // other here — instead of routing live edits through `sections` itself —
  // is what avoids the loop: initial → reset() → cursor jumps while typing.
  const [sections, setSections] = useState<Section[]>([]);
  const [previewSections, setPreviewSections] = useState<Section[]>([]);
  const [media, setMedia] = useState<MediaEmbed[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishBusy, setPublishBusy] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  useEffect(() => {
    let cancelled = false;

    getMyPresskit().then(async (found) => {
      if (cancelled) return;
      if (!found) {
        navigate("/onboarding");
        return;
      }
      setPresskit(found);

      const [sectionsRes, mediaRes, galleryRes, tourDatesRes] = await Promise.all([
        listSections(),
        listMedia(),
        listGalleryPhotos(),
        listTourDates(),
      ]);
      if (cancelled) return;

      setSections(sectionsRes);
      setMedia(mediaRes);
      setGallery(galleryRes);
      setTourDates(tourDatesRes);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => setPreviewSections(sections), [sections]);

  // A freshly created section carries data = {}, not null, so fill in the
  // defaults. Memoized on `sections`: the forms reset() whenever `initial`
  // changes identity, so a new object per render would wipe what's typed.
  const bioData = useMemo<BioSectionData>(
    () => ({ ...EMPTY_BIO, ...(sections.find((s) => s.type === "BIO")?.data as Partial<BioSectionData> | null) }),
    [sections],
  );
  const contactData = useMemo<ContactSectionData>(
    () => ({ ...EMPTY_CONTACT, ...(sections.find((s) => s.type === "CONTACT")?.data as Partial<ContactSectionData> | null) }),
    [sections],
  );

  async function handleTogglePublish() {
    if (!presskit) return;
    setPublishBusy(true);
    try {
      const updated = presskit.published ? await unpublishPresskit() : await publishPresskit();
      setPresskit(updated);
    } finally {
      setPublishBusy(false);
    }
  }

  if (loading || !presskit) return <p className="p-8 text-fg-muted">Carregando...</p>;

  const bioSection = sections.find((s) => s.type === "BIO");
  const contactSection = sections.find((s) => s.type === "CONTACT");
  const musicSection = sections.find((s) => s.type === "MUSIC");
  const videoSection = sections.find((s) => s.type === "VIDEO");
  const tourDatesSection = sections.find((s) => s.type === "TOUR_DATES");


  // Spread the presskit so every theme field it carries (template, heading
  // font, button style…) reaches the preview without listing each one here.
  const previewPresskit: PublicPresskit = {
    ...presskit,
    artistName: user?.name ?? "",
    ogTitleOverride: null,
    ogDescriptionOverride: null,
    sections: previewSections.map((s) => ({ ...s, data: s.data ?? {} })),
    mediaEmbeds: media,
    galleryPhotos: gallery,
    tourDates,
    pressMentions: [],
  };

  // "Ready to send to a booker": the minimum a contractor expects to find.
  const checklist = [
    { label: "Bio curta", done: bioData.shortBio.trim().length > 0 },
    { label: "Música ou set", done: media.some((m) => AUDIO_PROVIDERS.includes(m.provider)) },
    { label: "Contato para shows", done: !!contactData.email?.trim() },
    { label: "3 fotos na galeria", done: gallery.length >= 3 },
    { label: "Próximas datas", done: tourDates.length > 0 },
    { label: "Página publicada", done: presskit.published },
  ];
  const doneCount = checklist.filter((item) => item.done).length;

  return (
    <div className="flex min-h-screen flex-col gap-6 px-5 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-[26px] font-extrabold text-fg">Meu presskit</h1>
          <p className="text-sm text-fg-muted">
            {SITE_HOST}/{presskit.slug} ·{" "}
            <span className={presskit.published ? "font-bold text-emerald-400" : "font-semibold"}>
              {presskit.published ? "Publicado" : "Rascunho"}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={publicPresskitUrl(presskit.slug)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 px-4 text-[15px] font-bold text-fg transition hover:bg-white/5"
          >
            <ExternalLink size={16} /> Ver como contratante
          </a>
          {presskit.published ? (
            <>
              <Button variant="ghost" onClick={handleTogglePublish} disabled={publishBusy}>
                Despublicar
              </Button>
              <Link
                to="/compartilhar"
                className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 text-[15px] font-bold text-white transition hover:bg-primary-hover"
              >
                Compartilhar
              </Link>
            </>
          ) : (
            <Button onClick={handleTogglePublish} disabled={publishBusy}>
              {publishBusy ? "Publicando..." : "Publicar"}
            </Button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-6 xl:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-2xl border border-border bg-bg-elevated p-5" aria-labelledby="checklist-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="checklist-title" className="font-extrabold text-fg">
                Pronto para enviar a contratantes
              </h2>
              <span className="font-extrabold text-primary-text">
                {doneCount} de {checklist.length}
              </span>
            </div>
            <div
              className="h-2 rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={checklist.length}
              aria-valuenow={doneCount}
              aria-label="Progresso do presskit"
            >
              <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${(doneCount / checklist.length) * 100}%` }} />
            </div>
            <ul className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
              {checklist.map((item) => (
                <li key={item.label} className={"flex items-center gap-2.5 " + (item.done ? "text-fg-muted" : "text-fg")}>
                  {item.done ? (
                    <CheckCircle2 size={18} className="shrink-0 text-emerald-400" aria-hidden />
                  ) : (
                    <Circle size={18} className="shrink-0 text-fg-muted/60" aria-hidden />
                  )}
                  <span className={item.done ? "line-through decoration-white/20" : ""}>{item.label}</span>
                  <span className="sr-only">{item.done ? "(feito)" : "(pendente)"}</span>
                </li>
              ))}
            </ul>
          </section>

          <Link
            to="/personalizar"
            className="flex min-h-11 items-center gap-4 rounded-2xl border border-border bg-bg-elevated p-4 transition hover:border-white/25"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-elevated-2 text-primary-text">
              <Palette size={20} />
            </span>
            <span className="flex flex-col">
              <span className="font-bold text-fg">Personalizar visual</span>
              <span className="text-[13px] text-fg-muted">Modelo, cores, fontes e ordem das seções</span>
            </span>
          </Link>

          <BioForm
            initial={bioData}
            initialTitle={bioSection?.title ?? SECTION_DEFAULT_TITLES.BIO}
            onLiveChange={(data, title) => setPreviewSections((prev) => upsertSection(prev, "BIO", data, title))}
            onSaved={(data, title) => setSections((prev) => upsertSection(prev, "BIO", data, title))}
          />
          <EmbedManager
            sectionType="MUSIC"
            providers={AUDIO_PROVIDERS}
            initial={media.filter((m) => AUDIO_PROVIDERS.includes(m.provider))}
            initialTitle={musicSection?.title ?? SECTION_DEFAULT_TITLES.MUSIC}
            defaultTitle={SECTION_DEFAULT_TITLES.MUSIC}
            onChange={(items) =>
              setMedia((prev) => [...prev.filter((m) => !AUDIO_PROVIDERS.includes(m.provider)), ...items])
            }
            onTitleLiveChange={(title) => setPreviewSections((prev) => upsertSection(prev, "MUSIC", {}, title))}
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "MUSIC", {}, title))}
          />
          <EmbedManager
            sectionType="VIDEO"
            providers={VIDEO_PROVIDERS}
            initial={media.filter((m) => VIDEO_PROVIDERS.includes(m.provider))}
            initialTitle={videoSection?.title ?? SECTION_DEFAULT_TITLES.VIDEO}
            defaultTitle={SECTION_DEFAULT_TITLES.VIDEO}
            onChange={(items) =>
              setMedia((prev) => [...prev.filter((m) => !VIDEO_PROVIDERS.includes(m.provider)), ...items])
            }
            onTitleLiveChange={(title) => setPreviewSections((prev) => upsertSection(prev, "VIDEO", {}, title))}
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "VIDEO", {}, title))}
          />
          <GalleryManager initial={gallery} onChange={setGallery} />
          <TourDatesManager
            initial={tourDates}
            initialTitle={tourDatesSection?.title ?? SECTION_DEFAULT_TITLES.TOUR_DATES}
            onChange={setTourDates}
            onTitleLiveChange={(title) => setPreviewSections((prev) => upsertSection(prev, "TOUR_DATES", {}, title))}
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "TOUR_DATES", {}, title))}
          />
          <ContactForm
            initial={contactData}
            initialTitle={contactSection?.title ?? SECTION_DEFAULT_TITLES.CONTACT}
            onLiveChange={(data, title) => setPreviewSections((prev) => upsertSection(prev, "CONTACT", data, title))}
            onSaved={(data, title) => setSections((prev) => upsertSection(prev, "CONTACT", data, title))}
          />
        </div>

        <aside
          className={"flex flex-col items-center gap-3 xl:sticky xl:top-6 xl:self-start " + (device === "mobile" ? "xl:w-[380px]" : "xl:w-[560px]")}
          aria-label="Prévia"
        >
          <div className="flex gap-1 rounded-xl bg-bg-elevated p-1" role="group" aria-label="Tamanho da prévia">
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              aria-pressed={device === "mobile"}
              className={
                "flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold transition " +
                (device === "mobile" ? "bg-bg-elevated-2 text-fg" : "text-fg-muted hover:text-fg")
              }
            >
              <Smartphone size={15} /> Celular
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              aria-pressed={device === "desktop"}
              className={
                "flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold transition " +
                (device === "desktop" ? "bg-bg-elevated-2 text-fg" : "text-fg-muted hover:text-fg")
              }
            >
              <Monitor size={15} /> Computador
            </button>
          </div>
          <div
            className={
              device === "mobile"
                ? "w-full max-w-[340px] rounded-[34px] border border-white/10 bg-bg-elevated p-3"
                : "w-full rounded-2xl border border-white/10 bg-bg-elevated p-2"
            }
          >
            <div
              className={
                "overflow-y-auto " + (device === "mobile" ? "max-h-[70vh] rounded-[24px]" : "max-h-[75vh] rounded-xl")
              }
              style={{ fontFamily: FONT_FAMILY_CSS[presskit.themeFontKey] }}
            >
              <PresskitRenderer presskit={previewPresskit} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function upsertSection(sections: Section[], type: Section["type"], data: unknown, title?: string): Section[] {
  const existing = sections.find((s) => s.type === type);
  if (existing) {
    return sections.map((s) => (s.type === type ? { ...s, data, ...(title !== undefined ? { title } : {}) } : s));
  }
  return [...sections, { id: type, type, title: title ?? null, order: sections.length, visible: true, data }];
}
