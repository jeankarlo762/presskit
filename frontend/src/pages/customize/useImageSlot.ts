import { useRef, useState } from "react";
import type { ImageSlot } from "@presskit/shared";
import { confirmImage, removeImage, requestImageUploadUrl, type Presskit } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { fileExtension, uploadImageToStorage } from "../../lib/uploadImage";

/**
 * Upload/removal for one image slot of the presskit (background, cover,
 * avatar, logo): presigned URL → PUT straight to storage → server confirms
 * the key it signed and returns the updated presskit.
 */
export function useImageSlot(slot: ImageSlot, onChange: (presskit: Presskit) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ticket = await requestImageUploadUrl(slot, fileExtension(file));
      await uploadImageToStorage(ticket, file);
      onChange(await confirmImage(slot, { storageKey: ticket.storageKey }));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar a imagem"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    try {
      onChange(await removeImage(slot));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover a imagem"));
    }
  }

  return { uploading, error, inputRef, upload, remove };
}
