import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../config/env";
import { generateOpaqueToken } from "../utils/crypto";

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

const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);

function getClient() {
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET) {
    throw new StorageNotConfiguredError();
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY },
  });
}

/** `folder` separates the different kinds of images a presskit can have
 * (gallery photos vs. the theme background) into distinct R2 prefixes —
 * same presign/confirm/delete mechanics either way. */
export async function createImageUploadUrl(presskitId: string, extension: string, folder: "gallery" | "theme-bg") {
  const normalizedExtension = extension.toLowerCase().replace(/^\./, "");
  if (!ALLOWED_EXTENSIONS.has(normalizedExtension)) {
    throw new Error(`Extensão não suportada: ${extension}`);
  }

  const client = getClient();
  const storageKey = `presskits/${presskitId}/${folder}/${generateOpaqueToken()}.${normalizedExtension}`;

  const uploadUrl = await getSignedUrl(
    client,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey }),
    { expiresIn: 300 },
  );

  return { uploadUrl, storageKey, publicUrl: `${env.R2_PUBLIC_BASE_URL}/${storageKey}` };
}

/** Confirms the object actually landed in R2 before the metadata row is
 * persisted — a client that calls "confirm" without ever uploading (or after
 * a failed upload) must not be able to plant a broken gallery/background entry. */
export async function assertImageObjectExists(storageKey: string) {
  const client = getClient();
  try {
    await client.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey }));
  } catch {
    throw new UploadNotFoundError();
  }
}

export async function deleteImageObject(storageKey: string) {
  if (!env.R2_ACCOUNT_ID) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: storageKey })).catch(() => undefined);
}
