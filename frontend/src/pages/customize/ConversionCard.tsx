import { useEffect, useState } from "react";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { Plus, Trash2 } from "lucide-react";
import {
  MAX_QUICK_LINKS,
  QUICK_LINK_LABELS,
  QUICK_LINK_PLATFORMS,
  quickLinkSchema,
  whatsappNumberSchema,
  type PresskitUpdateInput,
  type QuickLink,
  type QuickLinkPlatform,
} from "@presskit/shared";
import type { Presskit } from "../../api/presskit";
import { Button, FieldError, Input, Label, Select, Textarea } from "../../components/ui";

const DEFAULT_WHATSAPP_MESSAGE = "Oi! Vi seu presskit e quero conversar sobre um show.";

function WhatsAppFields({ presskit, onChange }: { presskit: Presskit; onChange: (patch: PresskitUpdateInput) => void }) {
  const [number, setNumber] = useState(presskit.whatsappNumber ?? "");
  const [message, setMessage] = useState(presskit.whatsappMessage ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setNumber(presskit.whatsappNumber ?? ""), [presskit.whatsappNumber]);
  useEffect(() => setMessage(presskit.whatsappMessage ?? ""), [presskit.whatsappMessage]);

  function commitNumber() {
    const digits = number.replace(/\D/g, "");
    if (!digits) {
      setError(null);
      if (presskit.whatsappNumber) onChange({ whatsappNumber: null });
      return;
    }
    const parsed = whatsappNumberSchema.safeParse(digits);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Número inválido");
      return;
    }
    setError(null);
    if (parsed.data !== presskit.whatsappNumber) onChange({ whatsappNumber: parsed.data });
  }

  function commitMessage() {
    const trimmed = message.trim();
    if ((trimmed || null) !== presskit.whatsappMessage) onChange({ whatsappMessage: trimmed || null });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label hint={FIELD_HELP.whatsapp}>Número do WhatsApp (com DDI e DDD)</Label>
        <Input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          onBlur={commitNumber}
          placeholder="5511999998888"
          inputMode="tel"
        />
        <p className="mt-1 text-xs text-fg-muted">Com número, aparece um botão flutuante na página e um "Falar no WhatsApp" no topo.</p>
        <FieldError>{error}</FieldError>
      </div>
      {presskit.whatsappNumber && (
        <div>
          <Label hint={FIELD_HELP.whatsappMessage}>Mensagem pronta</Label>
          <Textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={commitMessage}
            maxLength={300}
            placeholder={DEFAULT_WHATSAPP_MESSAGE}
          />
        </div>
      )}
    </div>
  );
}

function QuickLinksEditor({ links, onChange }: { links: QuickLink[]; onChange: (links: QuickLink[]) => void }) {
  const [platform, setPlatform] = useState<QuickLinkPlatform>("SPOTIFY");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const parsed = quickLinkSchema.safeParse({ platform, url: url.trim(), label: label.trim() || undefined });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira o link");
      return;
    }
    if (links.length >= MAX_QUICK_LINKS) {
      setError(`No máximo ${MAX_QUICK_LINKS} links`);
      return;
    }
    setError(null);
    onChange([...links, parsed.data]);
    setUrl("");
    setLabel("");
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <Label hint={FIELD_HELP.quickLinks}>Links rápidos (ícones abaixo do nome)</Label>
      {links.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {links.map((link, index) => (
            <li key={`${link.platform}:${link.url}`} className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
              <span className="w-24 shrink-0 font-bold text-fg">{link.label || QUICK_LINK_LABELS[link.platform]}</span>
              <span className="min-w-0 flex-1 truncate text-xs text-fg-muted">{link.url}</span>
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Mover para cima" className="px-1 text-fg-muted hover:text-fg disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === links.length - 1} aria-label="Mover para baixo" className="px-1 text-fg-muted hover:text-fg disabled:opacity-30">
                ↓
              </button>
              <button
                type="button"
                onClick={() => onChange(links.filter((_, i) => i !== index))}
                aria-label={`Remover ${QUICK_LINK_LABELS[link.platform]}`}
                className="px-1 text-fg-muted hover:text-fg"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {links.length < MAX_QUICK_LINKS && (
        <div className="flex flex-wrap gap-2">
          <Select value={platform} onChange={(e) => setPlatform(e.target.value as QuickLinkPlatform)} className="w-40">
            {QUICK_LINK_PLATFORMS.map((key) => (
              <option key={key} value={key}>
                {QUICK_LINK_LABELS[key]}
              </option>
            ))}
          </Select>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            inputMode="url"
            className="min-w-[200px] flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Texto (opcional)" maxLength={30} className="w-36" />
          <Button type="button" variant="secondary" onClick={add}>
            <Plus size={15} /> Adicionar
          </Button>
        </div>
      )}
      <FieldError>{error}</FieldError>
    </div>
  );
}

export function ConversionCard({ presskit, onChange }: { presskit: Presskit; onChange: (patch: PresskitUpdateInput) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <WhatsAppFields presskit={presskit} onChange={onChange} />
      <QuickLinksEditor links={presskit.quickLinks ?? []} onChange={(quickLinks) => onChange({ quickLinks })} />
    </div>
  );
}
