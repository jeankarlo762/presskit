import { useState } from "react";
import { createPressMention, deletePressMention, type PressMention } from "../../api/presskit";

export function PressManager({
  initial,
  onChange,
}: {
  initial: PressMention[];
  onChange: (items: PressMention[]) => void;
}) {
  const [items, setItems] = useState(initial);
  const [outlet, setOutlet] = useState("");
  const [url, setUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!outlet.trim()) return;
    setBusy(true);
    try {
      const mention = await createPressMention({
        outlet: outlet.trim(),
        url: url.trim() || undefined,
        quote: quote.trim() || undefined,
      });
      const next = [...items, mention];
      setItems(next);
      onChange(next);
      setOutlet("");
      setUrl("");
      setQuote("");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deletePressMention(id);
    const next = items.filter((item) => item.id !== id);
    setItems(next);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">Imprensa</h3>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">{item.outlet}</span>
            <button onClick={() => handleDelete(item.id)} className="shrink-0 text-red-400">
              remover
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={outlet}
          onChange={(e) => setOutlet(e.target.value)}
          placeholder="Veículo (ex: Rolling Stone Brasil)"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Link (opcional)"
          className="w-48 rounded border px-3 py-2 text-sm"
        />
        <input
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          placeholder="Trecho (opcional)"
          className="w-48 rounded border px-3 py-2 text-sm"
        />
        <button onClick={handleAdd} disabled={busy} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          Adicionar
        </button>
      </div>
    </div>
  );
}
