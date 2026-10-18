import { useEffect, useRef, useState } from "react";
import { FileUp, Link2, Trash2 } from "lucide-react";
import { httpUrlSchema, type DownloadsSectionData } from "@presskit/shared";
import { confirmFile, requestFileUploadUrl, updateSectionData } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { fileExtension, uploadImageToStorage } from "../../lib/uploadImage";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input } from "../../components/ui";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";

type Item = DownloadsSectionData["items"][number];

function formatSize(bytes?: number) {
  if (!bytes) return "";
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function DownloadsManager({
  initialItems,
  initialTitle,
  defaultTitle,
  onLiveChange,
  onSaved,
}: {
  initialItems: Item[];
  initialTitle: string;
  defaultTitle: string;
  onLiveChange: (items: Item[], title: string) => void;
  onSaved: (items: Item[], title: string) => void;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState(initialTitle);
  const [label, setLabel] = useState("");
  const [link, setLink] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setItems(initialItems), [initialItems]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems) || title !== initialTitle;

  function update(next: Item[], nextTitle = title) {
    setItems(next);
    setSaved(false);
    onLiveChange(next, nextTitle);
  }

  async function uploadFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const ticket = await requestFileUploadUrl(fileExtension(file));
      await uploadImageToStorage(ticket, file);
      const stored = await confirmFile(ticket.storageKey);
      const name = label.trim() || file.name.replace(/\.[^.]+$/, "");
      update([...items, { label: name, url: stored.url, sizeBytes: stored.sizeBytes }]);
      setLabel("");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar o arquivo"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addLink() {
    const parsed = httpUrlSchema.safeParse(link.trim());
    if (!parsed.success) {
      setError("Cole um link completo, começando com https://");
      return;
    }
    if (!label.trim()) {
      setError("Dê um nome ao download");
      return;
    }
    setError(null);
    update([...items, { label: label.trim(), url: parsed.data }]);
    setLabel("");
    setLink("");
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const section = await updateSectionData("DOWNLOADS", { items }, title);
      onSaved(((section.data as DownloadsSectionData)?.items ?? []) as Item[], section.title ?? defaultTitle);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <SectionTitleField
        value={title}
        defaultTitle={defaultTitle}
        onChange={(value) => {
          setTitle(value);
          onLiveChange(items, value);
        }}
      />
      <p className="flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
        Fotos em alta, release, rider, logo… Envie um arquivo (PDF, ZIP, DOCX, PPTX, MP3 ou imagem, até 50 MB) ou cole um link
        (Drive, WeTransfer).
        <InfoTip content={FIELD_HELP.downloads} label="Especificações: downloads" />
      </p>

      {items.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {items.map((item, index) => (
            <li key={`${item.url}:${index}`} className="flex items-center gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate font-bold text-fg">{item.label}</span>
              <span className="shrink-0 text-xs text-fg-muted">{formatSize(item.sizeBytes)}</span>
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-fg-muted hover:text-fg">
                abrir
              </a>
              <button
                type="button"
                onClick={() => update(items.filter((_, i) => i !== index))}
                aria-label={`Remover ${item.label}`}
                className="px-1 text-fg-muted hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-bg p-3">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome do download (ex.: Fotos em alta resolução)" maxLength={80} />
        <div className="flex flex-wrap gap-2">
          <label
            className={
              "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-white/25 px-3.5 text-sm font-bold text-fg hover:border-white/45 " +
              (uploading ? "pointer-events-none opacity-60" : "")
            }
          >
            <FileUp size={16} />
            {uploading ? "Enviando..." : "Enviar arquivo"}
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.zip,.docx,.pptx,.mp3,image/jpeg,image/png,image/webp"
              disabled={uploading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadFile(file);
              }}
            />
          </label>
          <span className="self-center text-xs text-fg-muted">ou</span>
          <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." inputMode="url" className="min-w-[200px] flex-1" />
          <Button type="button" variant="secondary" onClick={addLink}>
            <Link2 size={15} /> Adicionar link
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        {saved && !dirty && <span className="text-sm text-emerald-400">Salvo</span>}
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
