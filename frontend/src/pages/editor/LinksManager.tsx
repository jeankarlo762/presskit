import { useState } from "react";
import { createLink, deleteLink, type TrackableLink } from "../../api/presskit";
import { Button, Card, FieldError, Input } from "../../components/ui";

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
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-medium text-fg">Links rastreáveis</h3>
        <p className="text-sm text-fg-muted">
          Crie um link diferente para cada destinatário e veja quem abriu na aba de analytics.
        </p>
      </div>
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm"
            >
              <span className="truncate">
                {item.label} — presskit.com.br/{slug}?ref={item.code}
              </span>
              <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm" className="shrink-0">
                remover
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rótulo (ex: Rolling Stone)"
          className="flex-1"
        />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toLowerCase())}
          placeholder="codigo-do-link"
          className="w-48"
        />
        <Button onClick={handleAdd} disabled={busy}>
          Criar link
        </Button>
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
