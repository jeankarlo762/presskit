import { useEffect, useState } from "react";
import type { MediaProvider, SectionType } from "@presskit/shared";
import { createMedia, deleteMedia, updateSectionData, type MediaEmbed } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input, Select } from "../../components/ui";

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
  const [provider, setProvider] = useState<MediaProvider>(providers[0]);
  const [url, setUrl] = useState("");
  const [embedTitle, setEmbedTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [sectionTitle, setSectionTitle] = useState(initialTitle);
  const [titleSaving, setTitleSaving] = useState(false);
  const titleChanged = sectionTitle !== initialTitle;

  useEffect(() => setItems(initial), [initial]);
  useEffect(() => setSectionTitle(initialTitle), [initialTitle]);

  async function handleAdd() {
    setError(null);
    if (!url.trim()) return;
    setBusy(true);
    try {
      const media = await createMedia({ provider, url: url.trim(), title: embedTitle.trim() || undefined });
      const next = [...items, media];
      setItems(next);
      onChange(next);
      setUrl("");
      setEmbedTitle("");
    } catch {
      setError("Não foi possível adicionar — confira o link");
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
              <span className="truncate">
                [{item.provider}] {item.title || item.url}
              </span>
              <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="shrink-0">
                remover
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Select value={provider} onChange={(e) => setProvider(e.target.value as MediaProvider)} className="w-32">
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="min-w-[200px] flex-1"
        />
        <Input
          value={embedTitle}
          onChange={(e) => setEmbedTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="w-40"
        />
        <Button onClick={handleAdd} disabled={busy}>
          Adicionar
        </Button>
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
