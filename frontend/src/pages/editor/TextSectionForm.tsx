import { useEffect, useRef, useState } from "react";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { FileUp, Trash2 } from "lucide-react";
import type { SectionType } from "@presskit/shared";
import { confirmFile, requestFileUploadUrl, updateSectionData } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { fileExtension, uploadImageToStorage } from "../../lib/uploadImage";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Label, Textarea } from "../../components/ui";

/**
 * Editor for the single-text sections: "Texto livre" (CUSTOM.body) and
 * "Rider técnico" (TECH_RIDER.text + optional PDF). The PDF goes through the
 * files upload and is stored as pdfUrl.
 */
export function TextSectionForm({
  sectionType,
  textKey,
  initialText,
  initialPdfUrl,
  initialTitle,
  defaultTitle,
  label,
  placeholder,
  maxLength,
  withPdf = false,
  onLiveChange,
  onSaved,
}: {
  sectionType: SectionType;
  textKey: "body" | "text";
  initialText: string;
  initialPdfUrl?: string | null;
  initialTitle: string;
  defaultTitle: string;
  label: string;
  placeholder?: string;
  maxLength: number;
  withPdf?: boolean;
  onLiveChange: (data: Record<string, unknown>, title: string) => void;
  onSaved: (data: Record<string, unknown>, title: string) => void;
}) {
  const [text, setText] = useState(initialText);
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl ?? null);
  const [title, setTitle] = useState(initialTitle);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(initialText), [initialText]);
  useEffect(() => setPdfUrl(initialPdfUrl ?? null), [initialPdfUrl]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const dirty = text !== initialText || (pdfUrl ?? null) !== (initialPdfUrl ?? null) || title !== initialTitle;

  function buildData(nextText = text, nextPdf = pdfUrl): Record<string, unknown> {
    const data: Record<string, unknown> = { [textKey]: nextText };
    if (withPdf && nextPdf) data.pdfUrl = nextPdf;
    return data;
  }

  async function uploadPdf(file: File) {
    setUploading(true);
    setError(null);
    try {
      const ticket = await requestFileUploadUrl(fileExtension(file));
      await uploadImageToStorage(ticket, file);
      const stored = await confirmFile(ticket.storageKey);
      setPdfUrl(stored.url);
      setSaved(false);
      onLiveChange(buildData(text, stored.url), title);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar o PDF"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const section = await updateSectionData(sectionType, buildData(text.trim()), title);
      onSaved(section.data as Record<string, unknown>, section.title ?? defaultTitle);
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
          onLiveChange(buildData(), value);
        }}
      />
      <div>
        <Label hint={withPdf ? FIELD_HELP.rider : FIELD_HELP.custom}>{label}</Label>
        <Textarea
          rows={6}
          value={text}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
            onLiveChange(buildData(e.target.value), title);
          }}
        />
        <p className="mt-1 text-right text-xs text-fg-muted">
          {text.length}/{maxLength}
        </p>
      </div>

      {withPdf && (
        <div className="flex flex-col gap-2">
          <Label hint={FIELD_HELP.riderPdf}>PDF do rider</Label>
          {pdfUrl ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-bg px-3 py-2 text-sm">
              <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate font-bold text-fg hover:underline">
                Abrir PDF
              </a>
              <button
                type="button"
                onClick={() => {
                  setPdfUrl(null);
                  setSaved(false);
                  onLiveChange(buildData(text, null), title);
                }}
                aria-label="Remover PDF"
                className="text-fg-muted hover:text-red-400"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <label
              className={
                "inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-xl border border-dashed border-white/25 px-3.5 text-sm font-bold text-fg hover:border-white/45 " +
                (uploading ? "pointer-events-none opacity-60" : "")
              }
            >
              <FileUp size={16} />
              {uploading ? "Enviando..." : "Enviar PDF"}
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf"
                disabled={uploading}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPdf(file);
                }}
              />
            </label>
          )}
        </div>
      )}

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
