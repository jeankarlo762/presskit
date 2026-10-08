import { useState } from "react";
import { createLink, deleteLink, type TrackableLink } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { publicPresskitUrl } from "../../config";
import { Button, Card, FieldError, Input } from "../../components/ui";

export function LinksManager({ initial, slug }: { initial: TrackableLink[]; slug: string }) {
  const [items, setItems] = useState(initial);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleAdd() {
    setError(null);
    if (!code.trim() || !label.trim()) return;
    setBusy(true);
    try {
      const link = await createLink({ code: code.trim(), label: label.trim(), active: true });
      setItems([link, ...items]);
      setCode("");
      setLabel("");
    } catch (err) {
      setError(
        apiErrorMessage(
          err,
          "Não foi possível criar o link — o código pode já estar em uso, ou o limite do seu plano foi atingido",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteLink(id);
    setItems(items.filter((item) => item.id !== id));
  }

  async function handleCopy(item: TrackableLink) {
    try {
      await navigator.clipboard.writeText(publicPresskitUrl(slug, item.code));
      setCopiedId(item.id);
      setTimeout(() => setCopiedId((current) => (current === item.id ? null : current)), 1500);
    } catch {
      // Clipboard blocked (insecure context / permissions) — the URL is
      // still visible in the list for manual copy.
    }
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
          {items.map((item) => {
            const href = publicPresskitUrl(slug, item.code);
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-2 text-sm"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{item.label}</span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-fg-muted hover:text-fg"
                  >
                    {href}
                  </a>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <Button onClick={() => handleCopy(item)} variant="secondary" size="sm">
                    {copiedId === item.id ? "copiado" : "copiar"}
                  </Button>
                  <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm">
                    remover
                  </Button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleAdd();
        }}
      >
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Rótulo (ex: Rolling Stone)"
          maxLength={120}
          className="flex-1"
        />
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          placeholder="codigo-do-link"
          maxLength={40}
          className="w-48"
        />
        <Button type="submit" disabled={busy}>
          Criar link
        </Button>
      </form>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
