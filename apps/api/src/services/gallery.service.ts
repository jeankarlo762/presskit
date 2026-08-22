import { prisma } from "../config/prisma";
import { maxGalleryPhotosFor, requireWithinGalleryLimit, type ArtistCategory, type PlanKey } from "@presskit/shared";
import { assertGalleryObjectExists, createGalleryUploadUrl, deleteGalleryObject } from "./storage.service";

export async function listGalleryPhotos(presskitId: string) {
  return prisma.galleryPhoto.findMany({ where: { presskitId }, orderBy: { order: "asc" } });
}

export async function requestGalleryUpload(
  presskitId: string,
  plan: PlanKey,
  category: ArtistCategory,
  extension: string,
) {
  const currentCount = await prisma.galleryPhoto.count({ where: { presskitId } });
  requireWithinGalleryLimit(plan, currentCount, maxGalleryPhotosFor(plan, category));
  return createGalleryUploadUrl(presskitId, extension);
}

export async function confirmGalleryPhoto(
  presskitId: string,
  input: { storageKey: string; url: string; width: number; height: number; caption?: string },
) {
  await assertGalleryObjectExists(input.storageKey);

  const lastPhoto = await prisma.galleryPhoto.findFirst({
    where: { presskitId },
    orderBy: { order: "desc" },
  });

  return prisma.galleryPhoto.create({
    data: { presskitId, order: (lastPhoto?.order ?? -1) + 1, ...input },
  });
}

export async function deleteGalleryPhoto(presskitId: string, photoId: string) {
  const photo = await prisma.galleryPhoto.findFirst({ where: { id: photoId, presskitId } });
  if (!photo) return;
  await prisma.galleryPhoto.delete({ where: { id: photo.id } });
  await deleteGalleryObject(photo.storageKey);
}

export async function reorderGalleryPhotos(presskitId: string, order: { id: string; order: number }[]) {
  await prisma.$transaction(
    order.map(({ id, order: newOrder }) =>
      prisma.galleryPhoto.updateMany({ where: { id, presskitId }, data: { order: newOrder } }),
    ),
  );
}
