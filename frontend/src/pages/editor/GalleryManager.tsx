import { useRef, useState } from "react";
import axios from "axios";
import { confirmGalleryPhoto, deleteGalleryPhoto, requestGalleryUploadUrl, type GalleryPhoto } from "../../api/presskit";
import { Card, FieldError } from "../../components/ui";

function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(objectUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Não foi possível ler a imagem"));
    };
    img.src = objectUrl;
  });
}

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

  async function handleFileSelected(file: File) {
    setError(null);
    setUploading(true);
    try {
      const extension = file.name.split(".").pop() ?? "jpg";
      const { uploadUrl, storageKey, publicUrl } = await requestGalleryUploadUrl(extension);
      const { width, height } = await readImageDimensions(file);

      await axios.put(uploadUrl, file, { headers: { "Content-Type": file.type } });
      const photo = await confirmGalleryPhoto({ storageKey, url: publicUrl, width, height });

      const next = [...items, photo];
      setItems(next);
      onChange(next);
    } catch {
      setError("Não foi possível enviar a foto — verifique se o armazenamento está configurado");
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
      <h3 className="font-medium text-neutral-900">Fotos</h3>
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {items.map((item) => (
            <div key={item.id} className="group relative aspect-square overflow-hidden rounded-2xl">
              <img src={item.url} alt={item.caption ?? ""} className="h-full w-full object-cover" />
              <button
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
          className="text-sm text-neutral-500 file:mr-3 file:rounded-full file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-xs file:font-medium file:text-white hover:file:bg-neutral-700"
        />
        {uploading && <p className="mt-2 text-sm text-neutral-500">Enviando...</p>}
        <FieldError>{error}</FieldError>
      </div>
    </Card>
  );
}
