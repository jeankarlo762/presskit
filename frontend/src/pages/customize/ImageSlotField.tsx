import { ImagePlus, Trash2 } from "lucide-react";
import type { ImageSlot } from "@presskit/shared";
import type { Presskit } from "../../api/presskit";
import { FieldError } from "../../components/ui";
import { useImageSlot } from "./useImageSlot";

/** One upload tile: current image (or dashed drop target), upload / remove. */
export function ImageSlotField({
  slot,
  label,
  hint,
  url,
  shape = "wide",
  onChange,
}: {
  slot: ImageSlot;
  label: string;
  hint?: string;
  url: string | null;
  shape?: "wide" | "square" | "round" | "logo";
  onChange: (presskit: Presskit) => void;
}) {
  const { uploading, error, inputRef, upload, remove } = useImageSlot(slot, onChange);
  const frame =
    shape === "round"
      ? "h-20 w-20 rounded-full"
      : shape === "square"
        ? "h-20 w-20 rounded-xl"
        : shape === "logo"
          ? "h-14 w-28 rounded-xl"
          : "h-16 w-28 rounded-xl";

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold text-fg-muted">{label}</span>
      {url ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg p-2">
          <img src={url} alt="" className={`${frame} shrink-0 object-cover ${shape === "logo" ? "object-contain bg-white/5 p-1" : ""}`} />
          <span className="flex-1 text-xs text-fg-muted">{hint}</span>
          <label
            className={
              "inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-fg-muted hover:bg-white/5 hover:text-fg " +
              (uploading ? "pointer-events-none opacity-60" : "")
            }
          >
            <ImagePlus size={16} />
            {uploading ? "Enviando..." : "Trocar"}
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void upload(file);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => void remove()}
            aria-label={`Remover ${label.toLowerCase()}`}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-fg-muted hover:bg-white/5 hover:text-fg"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ) : (
        <label
          className={
            "flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/25 bg-bg px-3 py-3 text-sm font-bold text-fg transition hover:border-white/45 focus-within:border-primary-text " +
            (uploading ? "pointer-events-none opacity-60" : "")
          }
        >
          <ImagePlus size={17} />
          {uploading ? "Enviando..." : `Enviar ${label.toLowerCase()}`}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={uploading}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
        </label>
      )}
      {!url && hint && <p className="text-xs text-fg-muted">{hint}</p>}
      <FieldError>{error}</FieldError>
    </div>
  );
}
