import { useState } from "react";
import type { MediaProvider } from "@presskit/shared";
import { createMedia, deleteMedia, type MediaEmbed } from "../../api/presskit";

const PROVIDERS: MediaProvider[] = ["SPOTIFY", "YOUTUBE", "SOUNDCLOUD", "VIMEO"];

export function MediaManager({ initial, onChange }: { initial: MediaEmbed[]; onChange: (items: MediaEmbed[]) => void }) {
  const [items, setItems] = useState(initial);
  const [provider, setProvider] = useState<MediaProvider>("SPOTIFY");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setError(null);
    if (!url.trim()) return;
    setBusy(true);
    try {
      const media = await createMedia({ provider, url: url.trim(), title: title.trim() || undefined });
      const next = [...items, media];
      setItems(next);
      onChange(next);
      setUrl("");
      setTitle("");
    } catch {
      setError("Não foi possível adicionar essa mídia — confira o link");
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

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">Música e vídeos</h3>
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
          {PROVIDERS.map((p) => (
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
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
