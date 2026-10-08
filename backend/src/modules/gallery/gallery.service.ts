import { prisma } from "../../config/prisma";
import { maxGalleryPhotosFor, requireWithinGalleryLimit, type ArtistCategory, type PlanKey } from "@presskit/shared";
import {
  assertImageObjectExists,
  assertOwnedStorageKey,
  createImageUploadUrl,
  deleteImageObject,
  publicUrlFor,
} from "../../shared/storage.service";

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
  return createImageUploadUrl(presskitId, extension, "gallery");
}

export async function confirmGalleryPhoto(
  presskitId: string,
  plan: PlanKey,
  category: ArtistCategory,
  input: { storageKey: string; width: number; height: number; caption?: string },
) {
  assertOwnedStorageKey(presskitId, "gallery", input.storageKey);

  // The limit is checked at presign time too, but presigned URLs can be
  // requested in bulk before any of them is confirmed — the row count only
  // moves here, so this is the check that actually holds the line.
  const currentCount = await prisma.galleryPhoto.count({ where: { presskitId } });
  requireWithinGalleryLimit(plan, currentCount, maxGalleryPhotosFor(plan, category));

  await assertImageObjectExists(input.storageKey);

  const lastPhoto = await prisma.galleryPhoto.findFirst({
    where: { presskitId },
    orderBy: { order: "desc" },
  });

  return prisma.galleryPhoto.create({
    data: {
      presskitId,
      order: (lastPhoto?.order ?? -1) + 1,
      storageKey: input.storageKey,
      url: publicUrlFor(input.storageKey),
      width: input.width,
      height: input.height,
      caption: input.caption,
    },
  });
}

export async function deleteGalleryPhoto(presskitId: string, photoId: string) {
  const photo = await prisma.galleryPhoto.findFirst({ where: { id: photoId, presskitId } });
  if (!photo) return;
  await prisma.galleryPhoto.delete({ where: { id: photo.id } });
  await deleteImageObject(photo.storageKey);
}

export async function reorderGalleryPhotos(presskitId: string, order: { id: string; order: number }[]) {
  await prisma.$transaction(
    order.map(({ id, order: newOrder }) =>
      prisma.galleryPhoto.updateMany({ where: { id, presskitId }, data: { order: newOrder } }),
    ),
  );
}
