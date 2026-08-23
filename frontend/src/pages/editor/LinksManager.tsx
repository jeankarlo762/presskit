import { useState } from "react";
import { createLink, deleteLink, type TrackableLink } from "../../api/presskit";

export function LinksManager({ initial, slug }: { initial: TrackableLink[]; slug: string }) {
  const [items, setItems] = useState(initial);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    setError(null);
    if (!code.trim() || !label.trim()) return;
    setBusy(true);
    try {
      const link = await createLink({ code: code.trim(), label: label.trim(), active: true });
      setItems([link, ...items]);
      setCode("");
      setLabel("");
    } catch {
      setError("Não foi possível criar o link — o código pode já estar em uso, ou o limite do seu plano foi atingido");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteLink(id);
    setItems(items.filter((item) => item.id !== id));
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">Links rastreáveis</h3>
      <p className="text-sm text-neutral-500">
        Crie um link diferente para cada destinatário e veja quem abriu na aba de analytics.
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate">
              {item.label} — presskit.com.br/{slug}?ref={item.code}
            </span>
            <button onClick={() => handleDelete(item.id)} className="shrink-0 text-red-600">
              remover
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rótulo (ex: Rolling Stone)"
          className="flex-1 rounded border px-3 py-2 text-sm"
        />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toLowerCase())}
          placeholder="codigo-do-link"
          className="w-48 rounded border px-3 py-2 text-sm"
        />
        <button onClick={handleAdd} disabled={busy} className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50">
          Criar link
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
