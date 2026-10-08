import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { generateOpaqueToken } from "./crypto";

export class StorageNotConfiguredError extends Error {
  constructor() {
    super("Armazenamento de mídia não configurado (variáveis R2_* ausentes)");
    this.name = "StorageNotConfiguredError";
  }
}

export class UploadNotFoundError extends Error {
  constructor() {
    super("Upload não encontrado — envie o arquivo antes de confirmar");
    this.name = "UploadNotFoundError";
  }
}

export class UnsupportedImageExtensionError extends Error {
  constructor(extension: string) {
    super(`Formato não suportado: .${extension} — use JPG, PNG ou WebP`);
    this.name = "UnsupportedImageExtensionError";
  }
}

export class ForeignStorageKeyError extends Error {
  constructor() {
    super("Esse arquivo não pertence ao seu presskit");
    this.name = "ForeignStorageKeyError";
  }
}

export type ImageFolder = "gallery" | "theme-bg";

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Hard cap on a single image, enforced by the presigned PUT (the signature
 * covers Content-Length, so a bigger body is rejected by R2 itself). */
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function isConfigured() {
  const hasEndpoint = Boolean(env.STORAGE_ENDPOINT) || Boolean(env.R2_ACCOUNT_ID);
  return hasEndpoint && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.R2_PUBLIC_BASE_URL;
}

function getClient() {
  if (!isConfigured()) throw new StorageNotConfiguredError();
  return new S3Client({
    region: "auto",
    endpoint: env.STORAGE_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: env.STORAGE_FORCE_PATH_STYLE,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! },
  });
}

function storageKeyPrefix(presskitId: string, folder: ImageFolder) {
  return `presskits/${presskitId}/${folder}/`;
}

/** The public URL is derived here, never accepted from the client — a
 * client-supplied URL could point the gallery at any host at all. */
export function publicUrlFor(storageKey: string) {
  if (!env.R2_PUBLIC_BASE_URL) throw new StorageNotConfiguredError();
  return `${env.R2_PUBLIC_BASE_URL.replace(/\/+$/, "")}/${storageKey}`;
}

/**
 * Every "confirm" and "delete" path must prove the key sits under the
 * caller's own presskit prefix. Without this, confirming
 * `presskits/<someone-else>/gallery/x.jpg` and then deleting that row would
 * have the API delete another artist's object from R2.
 */
export function assertOwnedStorageKey(presskitId: string, folder: ImageFolder, storageKey: string) {
  const prefix = storageKeyPrefix(presskitId, folder);
  const wellFormed = /^[A-Za-z0-9/_.-]+$/.test(storageKey) && !storageKey.includes("..");
  if (!wellFormed || !storageKey.startsWith(prefix)) throw new ForeignStorageKeyError();
}

/** `folder` separates the different kinds of images a presskit can have
 * (gallery photos vs. the theme background) into distinct R2 prefixes —
 * same presign/confirm/delete mechanics either way. */
export async function createImageUploadUrl(presskitId: string, extension: string, folder: ImageFolder) {
  const normalizedExtension = extension.toLowerCase().replace(/^\./, "");
  const contentType = CONTENT_TYPE_BY_EXTENSION[normalizedExtension];
  if (!contentType) throw new UnsupportedImageExtensionError(normalizedExtension);

  const client = getClient();
  const storageKey = `${storageKeyPrefix(presskitId, folder)}${generateOpaqueToken()}.${normalizedExtension}`;

  // ContentType is part of the signature: the browser must upload with
  // exactly this header, so nothing but an image MIME type can land under
  // a key that will later be served as one.
  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey, ContentType: contentType }),
    { expiresIn: 300 },
  );

  return { uploadUrl, storageKey, contentType, maxBytes: MAX_IMAGE_BYTES, publicUrl: publicUrlFor(storageKey) };
}

/** Confirms the object actually landed in R2 (and isn't oversized) before
 * the metadata row is persisted — a client that calls "confirm" without
 * ever uploading must not be able to plant a broken gallery entry. */
export async function assertImageObjectExists(storageKey: string) {
  const client = getClient();
  let size: number | undefined;
  try {
    const head = await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey }));
    size = head.ContentLength;
  } catch {
    throw new UploadNotFoundError();
  }
  if (size !== undefined && size > MAX_IMAGE_BYTES) {
    await deleteImageObject(storageKey);
    throw new UploadNotFoundError();
  }
}

export async function deleteImageObject(storageKey: string) {
  if (!isConfigured()) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey })).catch(() => undefined);
}
