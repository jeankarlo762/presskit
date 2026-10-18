import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCw, X, ZoomIn, ZoomOut } from "lucide-react";
import { IMAGE_SPECS, prepareImage, type ImageKind, type PreparedImage } from "../lib/imageResize";
import { Button, FieldError } from "./ui";

const KIND_TITLE: Record<ImageKind, string> = {
  avatar: "Foto de perfil",
  cover: "Capa",
  logo: "Logo",
  background: "Imagem de fundo",
  "section-bg": "Fundo da seção",
  gallery: "Foto da galeria",
};

/** Gallery photos can keep their shape or take one of the common ones. */
const GALLERY_ASPECTS: { key: string; label: string; value: number | null }[] = [
  { key: "original", label: "Original", value: null },
  { key: "square", label: "1:1", value: 1 },
  { key: "portrait", label: "4:5", value: 4 / 5 },
  { key: "wide", label: "16:9", value: 16 / 9 },
];

/**
 * Instagram-style framing before an upload: the photo sits inside the
 * frame of the slot's shape (round for the avatar), drag/pinch/zoom to
 * choose what stays, then confirm. The crop is applied in the browser by
 * prepareImage, which also resizes to the slot's pixel budget.
 */
export function ImageCropModal({
  file,
  kind,
  onCancel,
  onConfirm,
}: {
  file: File;
  kind: ImageKind;
  onCancel: () => void;
  onConfirm: (prepared: PreparedImage) => void | Promise<void>;
}) {
  const spec = IMAGE_SPECS[kind];
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null);
  const [aspectKey, setAspectKey] = useState("original");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => URL.revokeObjectURL(url), [url]);

  // Lock page scroll and close on Escape while the modal is open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [onCancel]);

  const galleryAspect = GALLERY_ASPECTS.find((a) => a.key === aspectKey)?.value ?? null;
  const aspect =
    spec.aspect ?? galleryAspect ?? (natural ? natural.width / natural.height : 1);

  const onCropComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function confirm() {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      await onConfirm(await prepareImage(file, kind, { ...area, rotation }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível preparar a imagem");
      setBusy(false);
    }
  }

  const outputHint =
    spec.fit === "cover"
      ? `Sai em ${spec.width}×${spec.height} px`
      : `Sai em até ${spec.width}×${spec.height} px`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Ajustar ${KIND_TITLE[kind].toLowerCase()}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6"
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-bg-elevated sm:max-h-[92vh] sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <h2 className="font-extrabold text-fg">Ajustar {KIND_TITLE[kind].toLowerCase()}</h2>
            <p className="text-xs text-fg-muted">
              Arraste para posicionar, use o zoom para enquadrar. {outputHint}.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-fg-muted hover:bg-white/5 hover:text-fg"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative h-[52dvh] min-h-[280px] bg-black sm:h-[420px]">
          <Cropper
            image={url}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={spec.round ? "round" : "rect"}
            showGrid={!spec.round}
            restrictPosition
            minZoom={1}
            maxZoom={5}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
            onMediaLoaded={(media) => setNatural({ width: media.naturalWidth, height: media.naturalHeight })}
          />
        </div>

        <div className="flex flex-col gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="shrink-0 text-fg-muted" aria-hidden />
            <input
              type="range"
              min={1}
              max={5}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              aria-label="Zoom"
              className="flex-1 accent-primary"
            />
            <ZoomIn size={16} className="shrink-0 text-fg-muted" aria-hidden />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              aria-label="Girar 90 graus"
              title="Girar"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 text-fg-muted hover:text-fg"
            >
              <RotateCw size={16} />
            </button>
          </div>

          {kind === "gallery" && (
            <div role="radiogroup" aria-label="Proporção" className="flex flex-wrap gap-1.5">
              {GALLERY_ASPECTS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={aspectKey === option.key}
                  onClick={() => setAspectKey(option.key)}
                  className={
                    "min-h-9 rounded-lg px-3 text-xs font-bold transition " +
                    (aspectKey === option.key ? "bg-bg-elevated-2 text-fg ring-1 ring-primary" : "text-fg-muted hover:text-fg")
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <FieldError>{error}</FieldError>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
              Cancelar
            </Button>
            <Button type="button" onClick={() => void confirm()} disabled={busy || !area}>
              {busy ? "Enviando..." : "Usar esta imagem"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
