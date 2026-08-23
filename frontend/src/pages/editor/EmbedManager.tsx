import { useEffect, useState } from "react";
import type { MediaProvider, SectionType } from "@presskit/shared";
import { createMedia, deleteMedia, updateSectionData, type MediaEmbed } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";

export function EmbedManager({
  sectionType,
  providers,
  initial,
  initialTitle,
  defaultTitle,
  onChange,
  onTitleSaved,
}: {
  sectionType: SectionType;
  providers: MediaProvider[];
  initial: MediaEmbed[];
  initialTitle: string;
  defaultTitle: string;
  onChange: (items: MediaEmbed[]) => void;
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
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-end gap-2">
        <SectionTitleField value={sectionTitle} defaultTitle={defaultTitle} onChange={setSectionTitle} />
        {titleChanged && (
          <button
            onClick={handleSaveTitle}
            disabled={titleSaving}
            className="rounded bg-black px-3 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Salvar título
          </button>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              [{item.provider}] {item.title || item.url}
            </span>
            <button onClick={() => handleDelete(item.id)} className="shrink-0 text-red-600">
              remover
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as MediaProvider)}
          className="rounded border px-2 py-2 text-sm"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="min-w-[200px] flex-1 rounded border px-3 py-2 text-sm"
        />
        <input
          value={embedTitle}
          onChange={(e) => setEmbedTitle(e.target.value)}
          placeholder="Título (opcional)"
          className="w-40 rounded border px-3 py-2 text-sm"
        />
        <button
          onClick={handleAdd}
          disabled={busy}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Adicionar
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
