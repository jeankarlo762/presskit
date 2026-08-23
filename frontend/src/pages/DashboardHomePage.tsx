import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  listLinks,
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
  type TrackableLink,
} from "../api/presskit";
import { logout } from "../api/auth";
import { useAuthStore } from "../store/auth.store";
import { Button } from "../components/ui";
import { BioForm } from "./editor/BioForm";
import { ContactForm } from "./editor/ContactForm";
import { EmbedManager } from "./editor/EmbedManager";
import { GalleryManager } from "./editor/GalleryManager";
import { TourDatesManager } from "./editor/TourDatesManager";
import { LinksManager } from "./editor/LinksManager";
import { ThemeEditor } from "./editor/ThemeEditor";

const EMPTY_BIO: BioSectionData = { shortBio: "", longBio: "" };
const EMPTY_CONTACT: ContactSectionData = { email: "", socialLinks: [] };

export function DashboardHomePage() {
  const navigate = useNavigate();
  const { user, refreshToken, clearSession } = useAuthStore();

  const [presskit, setPresskit] = useState<Presskit | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [media, setMedia] = useState<MediaEmbed[]>([]);
  const [gallery, setGallery] = useState<GalleryPhoto[]>([]);
  const [tourDates, setTourDates] = useState<TourDate[]>([]);
  const [links, setLinks] = useState<TrackableLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishBusy, setPublishBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getMyPresskit().then(async (found) => {
      if (cancelled) return;
      if (!found) {
        navigate("/onboarding");
        return;
      }
      setPresskit(found);

      const [sectionsRes, mediaRes, galleryRes, tourDatesRes, linksRes] = await Promise.all([
        listSections(),
        listMedia(),
        listGalleryPhotos(),
        listTourDates(),
        listLinks(),
      ]);
      if (cancelled) return;

      setSections(sectionsRes);
      setMedia(mediaRes);
      setGallery(galleryRes);
      setTourDates(tourDatesRes);
      setLinks(linksRes);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function handleLogout() {
    if (refreshToken) await logout(refreshToken).catch(() => undefined);
    clearSession();
    navigate("/login");
  }

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

  if (loading || !presskit) return <p className="p-8 text-neutral-500">Carregando...</p>;

  const bioSection = sections.find((s) => s.type === "BIO");
  const contactSection = sections.find((s) => s.type === "CONTACT");
  const musicSection = sections.find((s) => s.type === "MUSIC");
  const videoSection = sections.find((s) => s.type === "VIDEO");
  const tourDatesSection = sections.find((s) => s.type === "TOUR_DATES");

  const bioData = (bioSection?.data as BioSectionData) ?? EMPTY_BIO;
  const contactData = (contactSection?.data as ContactSectionData) ?? EMPTY_CONTACT;

  const previewPresskit: PublicPresskit = {
    id: presskit.id,
    slug: presskit.slug,
    artistName: user?.name ?? "",
    category: presskit.category,
    templateKey: presskit.templateKey,
    city: presskit.city,
    state: presskit.state,
    ogTitleOverride: null,
    ogDescriptionOverride: null,
    themeBackgroundColor: presskit.themeBackgroundColor,
    themeTextColor: presskit.themeTextColor,
    themeAccentColor: presskit.themeAccentColor,
    themeFontKey: presskit.themeFontKey,
    themeBackgroundImageUrl: presskit.themeBackgroundImageUrl,
    sections: sections.map((s) => ({ ...s, data: s.data ?? {} })),
    mediaEmbeds: media,
    galleryPhotos: gallery,
    tourDates,
    pressMentions: [],
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white/80 px-6 py-4 shadow-sm backdrop-blur">
        <div>
          <h1 className="font-semibold text-neutral-900">Olá, {user?.name}</h1>
          <p className="text-sm text-neutral-500">presskit.com.br/{presskit.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={
              "hidden rounded-full px-3 py-1 text-xs font-medium sm:inline-block " +
              (presskit.published ? "bg-emerald-50 text-emerald-600" : "bg-neutral-100 text-neutral-500")
            }
          >
            {presskit.published ? "Publicado" : "Rascunho"}
          </span>
          <Button onClick={handleTogglePublish} disabled={publishBusy} size="sm">
            {presskit.published ? "Despublicar" : "Publicar"}
          </Button>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            Sair
          </Button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ThemeEditor
            initial={{
              themeBackgroundColor: presskit.themeBackgroundColor,
              themeTextColor: presskit.themeTextColor,
              themeAccentColor: presskit.themeAccentColor,
              themeFontKey: presskit.themeFontKey,
              themeBackgroundImageUrl: presskit.themeBackgroundImageUrl,
            }}
            onChange={(theme) => setPresskit((prev) => (prev ? { ...prev, ...theme } : prev))}
          />

          <BioForm
            initial={bioData}
            initialTitle={bioSection?.title ?? SECTION_DEFAULT_TITLES.BIO}
            onSaved={(data, title) => setSections((prev) => upsertSection(prev, "BIO", data, title))}
          />
          <ContactForm
            initial={contactData}
            initialTitle={contactSection?.title ?? SECTION_DEFAULT_TITLES.CONTACT}
            onSaved={(data, title) => setSections((prev) => upsertSection(prev, "CONTACT", data, title))}
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
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "MUSIC", {}, title))}
          />
          <GalleryManager initial={gallery} onChange={setGallery} />
          <TourDatesManager
            initial={tourDates}
            initialTitle={tourDatesSection?.title ?? SECTION_DEFAULT_TITLES.TOUR_DATES}
            onChange={setTourDates}
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "TOUR_DATES", {}, title))}
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
            onTitleSaved={(title) => setSections((prev) => upsertSection(prev, "VIDEO", {}, title))}
          />
          <LinksManager initial={links} slug={presskit.slug} />
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Preview</p>
          <div
            className="max-h-[85vh] overflow-y-auto rounded-3xl border border-neutral-200 shadow-sm"
            style={{ fontFamily: FONT_FAMILY_CSS[presskit.themeFontKey] }}
          >
            <PresskitRenderer presskit={previewPresskit} />
          </div>
        </div>
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
