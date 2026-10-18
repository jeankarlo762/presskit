import { api } from "./axios";
import type {
  ArtistCategory,
  BackgroundAttachment,
  BackgroundPosition,
  BioSectionData,
  ButtonStyle,
  CustomDomainInfo,
  CustomDomainStatus,
  ImageSlot,
  NavMode,
  PresskitLanguage,
  SectionStyle,
  SectionStyleInput,
  QuickLink,
  ContactSectionData,
  FontKey,
  MediaEmbedCreateInput,
  PresskitUpdateInput,
  PressMentionInput,
  PressSectionData,
  PublicGalleryPhoto,
  PublicMediaEmbed,
  PublicPressMention,
  PublicTourDate,
  SectionType,
  TourDateInput,
  TrackableLinkInput,
} from "@presskit/shared";

export type Presskit = {
  id: string;
  slug: string;
  category: ArtistCategory;
  templateKey: string;
  published: boolean;
  city: string | null;
  state: string | null;
  themeBackgroundColor: string;
  themeTextColor: string;
  themeAccentColor: string;
  themeFontKey: FontKey;
  /** null = headings use themeFontKey. */
  themeHeadingFontKey: FontKey | null;
  themeButtonStyle: ButtonStyle;
  themeBackgroundImageUrl: string | null;
  themeBackgroundImageKey: string | null;
  themeBackgroundOverlay: number;
  themeBackgroundBlur: number;
  themeBackgroundPosition: BackgroundPosition;
  themeBackgroundAttachment: BackgroundAttachment;
  themeBackgroundRepeat: boolean;
  themeBackgroundPreset: string;
  coverImageUrl: string | null;
  avatarImageUrl: string | null;
  logoImageUrl: string | null;
  heroVideoUrl: string | null;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  quickLinks: QuickLink[];
  languages: PresskitLanguage[];
  customDomain: string | null;
  customDomainStatus: CustomDomainStatus;
  navMode: NavMode;
  showNav: boolean;
  tagline: string | null;
};

export type Section = {
  id: string;
  type: SectionType;
  title: string | null;
  order: number;
  visible: boolean;
  data: unknown;
  titleEn: string | null;
  dataEn: unknown;
  style: SectionStyle;
  layout: string | null;
};
// These reuse the *Public types (what the API actually returns — nullable
// fields serialize as null, not undefined) rather than the write-input
// schemas, which use `.optional()` (undefined) for the same fields.
export type MediaEmbed = PublicMediaEmbed;
export type GalleryPhoto = PublicGalleryPhoto;
export type TourDate = PublicTourDate;
export type PressMention = PublicPressMention;
export type TrackableLink = { id: string } & Omit<TrackableLinkInput, "id"> & { createdAt: string };

export async function getMyPresskit() {
  const { data } = await api.get<{ presskit: Presskit | null }>("/presskit");
  return data.presskit;
}

export async function updatePresskit(input: PresskitUpdateInput) {
  const { data } = await api.patch<{ presskit: Presskit }>("/presskit", input);
  return data.presskit;
}

export async function publishPresskit() {
  const { data } = await api.post<{ presskit: Presskit }>("/presskit/publish");
  return data.presskit;
}

export async function unpublishPresskit() {
  const { data } = await api.post<{ presskit: Presskit }>("/presskit/unpublish");
  return data.presskit;
}

export async function listSections() {
  const { data } = await api.get<{ sections: Section[] }>("/presskit/sections");
  return data.sections;
}

export async function updateSectionData(
  type: SectionType,
  sectionData: BioSectionData | ContactSectionData | PressSectionData | Record<string, unknown>,
  title?: string,
) {
  const { data } = await api.patch<{ section: Section }>(`/presskit/sections/${type}`, {
    data: sectionData,
    ...(title !== undefined ? { title } : {}),
  });
  return data.section;
}

/** Renames a section without touching its content (works on empty ones). */
export async function renameSection(section: Pick<Section, "type">, title: string) {
  const { data } = await api.patch<{ section: Section }>(`/presskit/sections/${section.type}/title`, { title });
  return data.section;
}

export async function setSectionVisibility(type: SectionType, visible: boolean) {
  await api.patch(`/presskit/sections/${type}/visibility`, { visible });
}

export async function reorderSections(order: SectionType[]) {
  await api.post("/presskit/sections/reorder", { order });
}

export async function listMedia() {
  const { data } = await api.get<{ media: MediaEmbed[] }>("/presskit/media");
  return data.media;
}
export async function createMedia(input: MediaEmbedCreateInput) {
  const { data } = await api.post<{ media: MediaEmbed }>("/presskit/media", input);
  return data.media;
}
export async function deleteMedia(id: string) {
  await api.delete(`/presskit/media/${id}`);
}

export async function listGalleryPhotos() {
  const { data } = await api.get<{ photos: GalleryPhoto[] }>("/presskit/gallery");
  return data.photos;
}
/** What the API hands back for a presigned image upload. `contentType` is
 * baked into the signature, so the PUT must send exactly that header. */
export type ImageUploadTicket = {
  uploadUrl: string;
  storageKey: string;
  contentType: string;
  maxBytes: number;
  publicUrl: string;
};

export async function requestGalleryUploadUrl(extension: string) {
  const { data } = await api.post<ImageUploadTicket>("/presskit/gallery/upload-url", { extension });
  return data;
}
export async function confirmGalleryPhoto(input: {
  storageKey: string;
  width: number;
  height: number;
  caption?: string;
}) {
  const { data } = await api.post<{ photo: GalleryPhoto }>("/presskit/gallery/confirm", input);
  return data.photo;
}
export async function deleteGalleryPhoto(id: string) {
  await api.delete(`/presskit/gallery/${id}`);
}

export async function listTourDates() {
  const { data } = await api.get<{ tourDates: TourDate[] }>("/presskit/tour-dates");
  return data.tourDates;
}
export async function createTourDate(input: Omit<TourDateInput, "id">) {
  const { data } = await api.post<{ tourDate: TourDate }>("/presskit/tour-dates", input);
  return data.tourDate;
}
export async function deleteTourDate(id: string) {
  await api.delete(`/presskit/tour-dates/${id}`);
}

export async function listPress() {
  const { data } = await api.get<{ press: PressMention[] }>("/presskit/press");
  return data.press;
}
export async function createPressMention(input: Omit<PressMentionInput, "id">) {
  const { data } = await api.post<{ mention: PressMention }>("/presskit/press", input);
  return data.mention;
}
export async function deletePressMention(id: string) {
  await api.delete(`/presskit/press/${id}`);
}

export async function requestThemeBackgroundUploadUrl(extension: string) {
  const { data } = await api.post<ImageUploadTicket>("/presskit/theme/background-upload-url", { extension });
  return data;
}
export async function confirmThemeBackground(input: { storageKey: string }) {
  const { data } = await api.post<{ presskit: Presskit }>("/presskit/theme/background-confirm", input);
  return data.presskit;
}
export async function removeThemeBackground() {
  const { data } = await api.delete<{ presskit: Presskit }>("/presskit/theme/background");
  return data.presskit;
}

export async function listLinks() {
  const { data } = await api.get<{ links: TrackableLink[] }>("/presskit/links");
  return data.links;
}
export async function createLink(input: Omit<TrackableLinkInput, "id">) {
  const { data } = await api.post<{ link: TrackableLink }>("/presskit/links", input);
  return data.link;
}
export async function deleteLink(id: string) {
  await api.delete(`/presskit/links/${id}`);
}

/** True when the API refused because the plan's link quota is used up
 * (PlanLimitError → 402). */
export function isPlanLimitError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as { response?: { status?: number } }).response?.status === 402
  );
}

// Image slots (background, cover, avatar, logo) share one presign/confirm/
// remove trio; the older theme/background-* functions above stay for the
// hook that still calls them.
export async function requestImageUploadUrl(slot: ImageSlot, extension: string) {
  const { data } = await api.post<ImageUploadTicket>(`/presskit/images/${slot}/upload-url`, { extension });
  return data;
}
export async function confirmImage(slot: ImageSlot, input: { storageKey: string }) {
  const { data } = await api.post<{ presskit: Presskit }>(`/presskit/images/${slot}/confirm`, input);
  return data.presskit;
}
export async function removeImage(slot: ImageSlot) {
  const { data } = await api.delete<{ presskit: Presskit }>(`/presskit/images/${slot}`);
  return data.presskit;
}

export async function updateSectionTranslation(
  type: SectionType,
  input: { dataEn?: Record<string, unknown>; titleEn?: string | null },
) {
  const { data } = await api.patch<{ section: Section }>(`/presskit/sections/${type}/translation`, input);
  return data.section;
}

export async function getCustomDomain() {
  const { data } = await api.get<CustomDomainInfo>("/presskit/domain");
  return data;
}
export async function setCustomDomain(domain: string | null) {
  const { data } = await api.put<CustomDomainInfo>("/presskit/domain", { domain });
  return data;
}

// Site structure -----------------------------------------------------------
export async function addSection(type: SectionType) {
  const { data } = await api.post<{ section: Section }>(`/presskit/sections/${type}`);
  return data.section;
}
export async function removeSection(type: SectionType) {
  await api.delete(`/presskit/sections/${type}`);
}
export async function updateSectionStyle(type: SectionType, input: { style?: SectionStyleInput; layout?: string | null }) {
  const { data } = await api.patch<{ section: Section }>(`/presskit/sections/${type}/style`, input);
  return data.section;
}
export async function requestSectionBackgroundUploadUrl(type: SectionType, extension: string) {
  const { data } = await api.post<ImageUploadTicket>(`/presskit/sections/${type}/background/upload-url`, { extension });
  return data;
}
export async function confirmSectionBackground(type: SectionType, storageKey: string) {
  const { data } = await api.post<{ section: Section }>(`/presskit/sections/${type}/background/confirm`, { storageKey });
  return data.section;
}
export async function removeSectionBackground(type: SectionType) {
  const { data } = await api.delete<{ section: Section }>(`/presskit/sections/${type}/background`);
  return data.section;
}

// Downloadable files (DOWNLOADS section, rider PDF) ------------------------
export async function requestFileUploadUrl(extension: string) {
  const { data } = await api.post<ImageUploadTicket>("/presskit/files/upload-url", { extension });
  return data;
}
export async function confirmFile(storageKey: string) {
  const { data } = await api.post<{ url: string; storageKey: string; sizeBytes: number; contentType: string }>(
    "/presskit/files/confirm",
    { storageKey },
  );
  return data;
}
