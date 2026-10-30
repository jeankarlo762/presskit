import { useEffect, useMemo, useRef, useState } from "react";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";
import {
  MAX_VIDEO_UPLOAD_MB,
  MEDIA_PROVIDER_LABELS,
  VIDEO_UPLOAD_EXTENSIONS,
  parseMediaUrl,
  type MediaProvider,
  type SectionType,
} from "@presskit/shared";
import {
  confirmUploadedVideo,
  createMedia,
  deleteMedia,
  requestVideoUploadUrl,
  updateSectionData,
  type MediaEmbed,
} from "../../api/presskit";
import { fileExtension, uploadVideoToStorage } from "../../lib/uploadImage";
import { apiErrorMessage } from "../../api/axios";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input } from "../../components/ui";

const PLACEHOLDER_BY_KIND: Record<"video" | "audio", string> = {
  video: "Cole o link do YouTube ou Vimeo (ex: https://youtu.be/...)",
  audio: "Cole o link do Spotify ou SoundCloud",
};

export function EmbedManager({
  sectionType,
  providers,
  initial,
  initialTitle,
  defaultTitle,
  onChange,
  onTitleLiveChange,
  onTitleSaved,
}: {
  sectionType: SectionType;
  providers: MediaProvider[];
  initial: MediaEmbed[];
  initialTitle: string;
  defaultTitle: string;
  onChange: (items: MediaEmbed[]) => void;
  /** Fires on every keystroke in the title field (unsaved) so the preview
   * updates instantly — persistence still waits for "Salvar título". */
  onTitleLiveChange: (title: string) => void;
  onTitleSaved: (title: string) => void;
}) {
  const [items, setItems] = useState(initial);
  const [url, setUrl] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  /** 0–1 while a video file is uploading, null otherwise. */
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const isVideoSection = sectionType === "VIDEO";

  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [titleSaving, setTitleSaving] = useState(false);
  const titleChanged = sectionTitle !== initialTitle;

  useEffect(() => setItems(initial), [initial]);
  useEffect(() => setSectionTitle(initialTitle), [initialTitle]);

  // The provider is read off the pasted link instead of asked for in a
  // dropdown — nobody knows (or should care) that a youtu.be short link and
  // a youtube.com/shorts link are "the same provider".
  const parsed = useMemo(() => parseMediaUrl(url), [url]);
  const trimmedUrl = url.trim();
  const providerMismatch = parsed !== null && !providers.includes(parsed.provider);

  let hint: string | null = null;
  if (trimmedUrl && !parsed) hint = "Link não reconhecido — confira se é um link completo do YouTube, Vimeo, Spotify ou SoundCloud";
  else if (parsed && providerMismatch) {
    hint = `Esse link é do ${MEDIA_PROVIDER_LABELS[parsed.provider]} — adicione na seção ${isVideoSection ? "Música" : "Vídeos"}`;
  }

  async function handleAdd() {
    setError(null);
    if (!parsed || providerMismatch) return;
    setBusy(true);
    try {
      const media = await createMedia({ provider: parsed.provider, url: trimmedUrl, title: embedTitle.trim() || undefined });
      const next = [...items, media];
      setItems(next);
      onChange(next);
      setUrl("");
      setEmbedTitle("");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível adicionar — confira o link"));
    } finally {
      setBusy(false);
    }
  }

  async function handleVideoFile(file: File) {
    setError(null);
    const extension = fileExtension(file);
    if (!(VIDEO_UPLOAD_EXTENSIONS as readonly string[]).includes(extension)) {
      setError("Formato não suportado — envie MP4, MOV ou WebM");
      return;
    }
    setUploadProgress(0);
    try {
      const ticket = await requestVideoUploadUrl(extension);
      await uploadVideoToStorage(ticket, file, setUploadProgress);
      const title = embedTitle.trim() || file.name.replace(/\.[^.]+$/, "").slice(0, 150);
      const media = await confirmUploadedVideo({ storageKey: ticket.storageKey, title });
      const next = [...items, media];
      setItems(next);
      onChange(next);
      setEmbedTitle("");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar o vídeo"));
    } finally {
      setUploadProgress(null);
    }
  }

  async function handleDelete(id: string) {
    await deleteMedia(id);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    onChange(next);
  }

  function handleTitleChange(value: string) {
    setSectionTitle(value);
    onTitleLiveChange(value);
  }

  async function handleSaveTitle() {
    setTitleSaving(true);
    try {
      const section = await updateSectionData(sectionType, {}, sectionTitle);
      onTitleSaved(section.title ?? defaultTitle);
    } finally {
      setTitleSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-end gap-2">
        <SectionTitleField value={sectionTitle} defaultTitle={defaultTitle} onChange={handleTitleChange} />
        <InfoTip content={sectionType === "MUSIC" ? FIELD_HELP.music : FIELD_HELP.video} label="Sobre esta seção" className="mb-2.5" />
        {titleChanged && (
          <Button onClick={handleSaveTitle} disabled={titleSaving} size="sm">
            Salvar título
          </Button>
        )}
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-fg-muted">
                  {MEDIA_PROVIDER_LABELS[item.provider]}
                </span>
                <span className="truncate">{item.title || item.url}</span>
              </span>
              <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="shrink-0">
                remover
              </Button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={PLACEHOLDER_BY_KIND[isVideoSection ? "video" : "audio"]}
              inputMode="url"
              autoComplete="off"
              className={parsed && !providerMismatch ? "pr-24" : undefined}
            />
            {parsed && !providerMismatch && (
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                {MEDIA_PROVIDER_LABELS[parsed.provider]}
              </span>
            )}
          </div>
          <Input
            value={embedTitle}
            onChange={(e) => setEmbedTitle(e.target.value)}
            placeholder="Título (opcional)"
            maxLength={150}
            className="w-44"
          />
          <Button type="submit" disabled={busy || !parsed || providerMismatch}>
            {busy ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
        {hint && <p className="text-sm text-fg-muted">{hint}</p>}
        <FieldError>{error}</FieldError>
      </form>
      {isVideoSection && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={uploadProgress !== null}
              onClick={() => fileInput.current?.click()}
            >
              {uploadProgress !== null ? `Enviando... ${Math.round(uploadProgress * 100)}%` : "Enviar arquivo de vídeo"}
            </Button>
            <span className="text-sm text-fg-muted">MP4, MOV ou WebM, até {MAX_VIDEO_UPLOAD_MB} MB</span>
          </div>
          {uploadProgress !== null && (
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress * 100}%` }} />
            </div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="video/mp4,video/quicktime,video/webm,.mp4,.m4v,.mov,.webm"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void handleVideoFile(file);
            }}
          />
        </div>
      )}
    </Card>
  );
}
