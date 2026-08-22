import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  BioSectionData,
  ContactSectionData,
  PublicPresskit,
} from "@presskit/shared";
import { PresskitRenderer } from "@presskit/shared/ui";
import {
  getMyPresskit,
  listGalleryPhotos,
  listLinks,
  listMedia,
  listPress,
  listSections,
  listTourDates,
  publishPresskit,
  unpublishPresskit,
  type GalleryPhoto,
  type MediaEmbed,
  type Presskit,
  type PressMention,
  type Section,
  type TourDate,
  type TrackableLink,
} from "../api/presskit";
import { logout } from "../api/auth";
import { useAuthStore } from "../store/auth.store";
import { BioForm } from "./editor/BioForm";
import { ContactForm } from "./editor/ContactForm";
import { MediaManager } from "./editor/MediaManager";
import { GalleryManager } from "./editor/GalleryManager";
import { TourDatesManager } from "./editor/TourDatesManager";
import { PressManager } from "./editor/PressManager";
import { LinksManager } from "./editor/LinksManager";

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
  const [press, setPress] = useState<PressMention[]>([]);
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

      const [sectionsRes, mediaRes, galleryRes, tourDatesRes, pressRes, linksRes] = await Promise.all([
        listSections(),
        listMedia(),
        listGalleryPhotos(),
        listTourDates(),
        listPress(),
        listLinks(),
      ]);
      if (cancelled) return;

      setSections(sectionsRes);
      setMedia(mediaRes);
      setGallery(galleryRes);
      setTourDates(tourDatesRes);
      setPress(pressRes);
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

  if (loading || !presskit) return <p className="p-8">Carregando...</p>;

  const bioSection = sections.find((s) => s.type === "BIO");
  const contactSection = sections.find((s) => s.type === "CONTACT");
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
    sections: sections.map((s) => ({ ...s, data: s.data ?? {} })),
    mediaEmbeds: media,
    galleryPhotos: gallery,
    tourDates,
    pressMentions: press,
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div>
          <h1 className="font-semibold">Olá, {user?.name}</h1>
          <p className="text-sm text-neutral-500">presskit.com.br/{presskit.slug}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePublish}
            disabled={publishBusy}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {presskit.published ? "Despublicar" : "Publicar"}
          </button>
          <button onClick={handleLogout} className="text-sm text-neutral-500 underline">
            Sair
          </button>
        </div>
      </header>

      <div className="grid flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <BioForm initial={bioData} onSaved={(data) => setSections((prev) => upsertSection(prev, "BIO", data))} />
          <ContactForm
            initial={contactData}
            onSaved={(data) => setSections((prev) => upsertSection(prev, "CONTACT", data))}
          />
          <MediaManager initial={media} onChange={setMedia} />
          <GalleryManager initial={gallery} onChange={setGallery} />
          <TourDatesManager initial={tourDates} onChange={setTourDates} />
          <PressManager initial={press} onChange={setPress} />
          <LinksManager initial={links} slug={presskit.slug} />
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Preview</p>
          <div className="max-h-[85vh] overflow-y-auto rounded-lg border">
            <PresskitRenderer presskit={previewPresskit} />
          </div>
        </div>
      </div>
    </div>
  );
}

function upsertSection(sections: Section[], type: Section["type"], data: unknown): Section[] {
  const existing = sections.find((s) => s.type === type);
  if (existing) return sections.map((s) => (s.type === type ? { ...s, data } : s));
  return [...sections, { id: type, type, order: sections.length, visible: true, data }];
}
