import { useRef, useState } from "react";
import { confirmGalleryPhoto, deleteGalleryPhoto, requestGalleryUploadUrl, type GalleryPhoto } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { uploadImageToStorage } from "../../lib/uploadImage";
import type { PreparedImage } from "../../lib/imageResize";
import { ImageCropModal } from "../../components/ImageCropModal";
import { Card, FieldError } from "../../components/ui";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";

export function GalleryManager({
  initial,
  onChange,
}: {
  initial: GalleryPhoto[];
  onChange: (items: GalleryPhoto[]) => void;
}) {
  const [items, setItems] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  function handleFileSelected(file: File) {
    setError(null);
    setPendingFile(file);
  }

  function cancelCrop() {
    setPendingFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function uploadPrepared({ file: resized, width, height, extension }: PreparedImage) {
    setPendingFile(null);
    setUploading(true);
    try {
      const ticket = await requestGalleryUploadUrl(extension);
      await uploadImageToStorage(ticket, resized);
      const photo = await confirmGalleryPhoto({ storageKey: ticket.storageKey, width, height });

      const next = [...items, photo];
      setItems(next);
      onChange(next);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar a foto — verifique se o armazenamento está configurado"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    await deleteGalleryPhoto(id);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    onChange(next);
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="flex items-center gap-1.5 text-xs text-fg-muted">
        Fotos até 2000 px, JPG/PNG/WebP, 10 MB cada — ajustadas automaticamente.
        <InfoTip content={FIELD_HELP.gallery} label="Especificações: fotos" />
      </p>
      <h3 className="font-medium text-fg">Fotos</h3>
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl">
              <img src={item.url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                className="absolute right-1.5 top-1.5 hidden rounded-full bg-black/70 px-2.5 py-1 text-xs text-white backdrop-blur group-hover:block"
              >
                remover
              </button>
            </div>
          ))}
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFileSelected(file);
          }}
          className="text-sm text-fg-muted file:mr-3 file:rounded-xl file:border-0 file:bg-primary file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-white hover:file:bg-primary-hover"
        />
        {uploading && <p className="mt-2 text-sm text-fg-muted">Enviando...</p>}
        <FieldError>{error}</FieldError>
      </div>
      {pendingFile && <ImageCropModal file={pendingFile} kind="gallery" onCancel={cancelCrop} onConfirm={uploadPrepared} />}
    </Card>
  );
}
