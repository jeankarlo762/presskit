import { api } from "./axios";
import type {
  ArtistCategory,
  BioSectionData,
  ContactSectionData,
  MediaEmbedInput,
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
};

export type Section = { id: string; type: SectionType; order: number; visible: boolean; data: unknown };
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

export async function updateSectionData(type: SectionType, sectionData: BioSectionData | ContactSectionData | PressSectionData | Record<string, unknown>) {
  const { data } = await api.patch<{ section: Section }>(`/presskit/sections/${type}`, { data: sectionData });
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
export async function createMedia(input: Omit<MediaEmbedInput, "id" | "order">) {
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
export async function requestGalleryUploadUrl(extension: string) {
  const { data } = await api.post<{ uploadUrl: string; storageKey: string; publicUrl: string }>(
    "/presskit/gallery/upload-url",
    { extension },
  );
  return data;
}
export async function confirmGalleryPhoto(input: {
  storageKey: string;
  url: string;
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
