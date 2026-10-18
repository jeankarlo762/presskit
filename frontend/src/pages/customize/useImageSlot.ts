import { useRef, useState } from "react";
import type { ImageSlot } from "@presskit/shared";
import { confirmImage, removeImage, requestImageUploadUrl, type Presskit } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { uploadImageToStorage } from "../../lib/uploadImage";
import type { PreparedImage } from "../../lib/imageResize";

/**
 * Upload/removal for one image slot of the presskit (background, cover,
 * avatar, logo): presigned URL → PUT straight to storage → server confirms
 * the key it signed and returns the updated presskit.
 */
export function useImageSlot(slot: ImageSlot, onChange: (presskit: Presskit) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** File waiting in the crop editor; the upload starts after confirmation. */
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /** Step 1: the artist picked a file — open the framing editor. */
  function upload(file: File) {
    setError(null);
    setPendingFile(file);
  }

  function cancelCrop() {
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  /** Step 2: the editor handed back the framed, resized image — send it. */
  async function uploadPrepared(prepared: PreparedImage) {
    setPendingFile(null);
    setUploading(true);
    try {
      const ticket = await requestImageUploadUrl(slot, prepared.extension);
      await uploadImageToStorage(ticket, prepared.file);
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

  return { uploading, error, inputRef, upload, remove, pendingFile, cancelCrop, uploadPrepared };
}
