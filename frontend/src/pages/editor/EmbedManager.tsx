import { useEffect, useMemo, useState } from "react";
import { MEDIA_PROVIDER_LABELS, parseMediaUrl, type MediaProvider, type SectionType } from "@presskit/shared";
import { createMedia, deleteMedia, updateSectionData, type MediaEmbed } from "../../api/presskit";
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
  const isVideoSection = sectionType === "VIDEO";
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
    </Card>
  );
}
