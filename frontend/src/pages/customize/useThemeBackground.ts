import { useRef, useState } from "react";
import {
  confirmThemeBackground,
  removeThemeBackground,
  requestThemeBackgroundUploadUrl,
} from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { fileExtension, uploadImageToStorage } from "../../lib/uploadImage";

/**
 * Background image upload/removal for the presskit theme: presigned URL →
 * PUT straight to storage → server confirms the key it signed. Shared by the
 * Personalizar page and the older ThemeEditor card.
 */
export function useThemeBackground(onChange: (url: string | null) => void) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ticket = await requestThemeBackgroundUploadUrl(fileExtension(file));
      await uploadImageToStorage(ticket, file);
      const presskit = await confirmThemeBackground({ storageKey: ticket.storageKey });
      onChange(presskit.themeBackgroundImageUrl);
    } catch (err) {
      setError(
        apiErrorMessage(err, "Não foi possível enviar a imagem de fundo — verifique se o armazenamento está configurado"),
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function remove() {
    setError(null);
    try {
      const presskit = await removeThemeBackground();
      onChange(presskit.themeBackgroundImageUrl);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível remover a imagem de fundo"));
    }
  }

  return { uploading, error, fileInputRef, upload, remove };
}
