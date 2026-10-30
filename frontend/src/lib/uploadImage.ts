import axios from "axios";
import type { ImageUploadTicket } from "../api/presskit";

export class ImageTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Imagem muito grande — o limite é ${Math.round(maxBytes / 1024 / 1024)} MB`);
    this.name = "ImageTooLargeError";
  }
}

/** Shared by the gallery and the theme background: the PUT to R2 has to
 * match the presigned signature exactly (same Content-Type the API signed),
 * and checking the size up front avoids waiting on a doomed upload. */
export async function uploadImageToStorage(ticket: ImageUploadTicket, file: File) {
  if (file.size > ticket.maxBytes) throw new ImageTooLargeError(ticket.maxBytes);
  await axios.put(ticket.uploadUrl, file, { headers: { "Content-Type": ticket.contentType } });
}

/** Same presigned PUT, for video files: they are big, so progress (0–1) is
 * reported back for the editor to show. */
export async function uploadVideoToStorage(
  ticket: ImageUploadTicket,
  file: File,
  onProgress: (fraction: number) => void,
) {
  if (file.size > ticket.maxBytes) {
    throw new Error(`Vídeo muito grande — o limite é ${Math.round(ticket.maxBytes / 1024 / 1024)} MB`);
  }
  await axios.put(ticket.uploadUrl, file, {
    headers: { "Content-Type": ticket.contentType },
    onUploadProgress: (event) => {
      if (event.total) onProgress(event.loaded / event.total);
    },
  });
}

export function fileExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() ?? "jpg";
}
