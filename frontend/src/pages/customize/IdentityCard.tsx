import { useEffect, useState } from "react";
import { heroVideoUrlSchema, type PresskitUpdateInput } from "@presskit/shared";
import type { Presskit } from "../../api/presskit";
import { FieldError, Input, Label } from "../../components/ui";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { ImageSlotField } from "./ImageSlotField";

export function IdentityCard({
  presskit,
  onImageChange,
  onChange,
}: {
  presskit: Presskit;
  onImageChange: (presskit: Presskit) => void;
  onChange: (patch: PresskitUpdateInput) => void;
}) {
  const [video, setVideo] = useState(presskit.heroVideoUrl ?? "");
  const [videoError, setVideoError] = useState<string | null>(null);
  useEffect(() => setVideo(presskit.heroVideoUrl ?? ""), [presskit.heroVideoUrl]);

  function commitVideo() {
    const trimmed = video.trim();
    if (!trimmed) {
      setVideoError(null);
      if (presskit.heroVideoUrl) onChange({ heroVideoUrl: null });
      return;
    }
    const parsed = heroVideoUrlSchema.safeParse(trimmed);
    if (!parsed.success) {
      setVideoError(parsed.error.issues[0]?.message ?? "Link inválido");
      return;
    }
    setVideoError(null);
    if (parsed.data !== presskit.heroVideoUrl) onChange({ heroVideoUrl: parsed.data });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <ImageSlotField
          slot="cover"
          label="Capa"
          hint="Banner no topo (ou capa do Palco). Vale uma foto horizontal."
          url={presskit.coverImageUrl}
          onChange={onImageChange}
        />
        <ImageSlotField
          slot="avatar"
          label="Foto de perfil"
          hint="Aparece redonda ao lado do nome."
          shape="round"
          url={presskit.avatarImageUrl}
          onChange={onImageChange}
        />
      </div>
      <ImageSlotField
        slot="logo"
        label="Logo"
        hint="Substitui o nome em texto. PNG com fundo transparente funciona melhor."
        shape="logo"
        url={presskit.logoImageUrl}
        onChange={onImageChange}
      />

      <div>
        <Label hint={FIELD_HELP.heroVideo}>Vídeo no topo (YouTube ou Vimeo)</Label>
        <Input
          value={video}
          onChange={(e) => setVideo(e.target.value)}
          onBlur={commitVideo}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitVideo();
            }
          }}
          placeholder="https://youtu.be/..."
          inputMode="url"
        />
        <p className="mt-1 text-xs text-fg-muted">Toca mudo e em loop no lugar da capa. Deixe vazio para não usar.</p>
        <FieldError>{videoError}</FieldError>
      </div>
    </div>
  );
}
