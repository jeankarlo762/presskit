import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { SECTION_DEFAULT_TITLES, type PressSectionData } from "@presskit/shared";
import { createPressMention, deletePressMention, updateSectionData, type PressMention } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input, Label, Textarea } from "../../components/ui";

/**
 * Imprensa: a highlight line (section data) plus the list of mentions
 * (their own table — add/remove take effect immediately).
 */
export function PressManager({
  initialMentions,
  initialData,
  initialTitle,
  onMentionsChange,
  onLiveChange,
  onSaved,
}: {
  initialMentions: PressMention[];
  initialData: PressSectionData;
  initialTitle: string;
  onMentionsChange: (items: PressMention[]) => void;
  onLiveChange: (data: PressSectionData, title: string) => void;
  onSaved: (data: PressSectionData, title: string) => void;
}) {
  const [mentions, setMentions] = useState(initialMentions);
  const [highlight, setHighlight] = useState(initialData.highlightStats ?? "");
  const [title, setTitle] = useState(initialTitle);
  const [outlet, setOutlet] = useState("");
  const [url, setUrl] = useState("");
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMentions(initialMentions), [initialMentions]);
  useEffect(() => setHighlight(initialData.highlightStats ?? ""), [initialData]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const dirty = highlight !== (initialData.highlightStats ?? "") || title !== initialTitle;

  async function handleAdd() {
    if (!outlet.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const mention = await createPressMention({
        outlet: outlet.trim(),
        url: url.trim() || undefined,
        quote: quote.trim() || undefined,
      });
      const next = [mention, ...mentions];
      setMentions(next);
      onMentionsChange(next);
      setOutlet("");
      setUrl("");
      setQuote("");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível adicionar — confira o link"));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    await deletePressMention(id);
    const next = mentions.filter((item) => item.id !== id);
    setMentions(next);
    onMentionsChange(next);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const section = await updateSectionData("PRESS", { highlightStats: highlight.trim() || undefined }, title);
      onSaved(section.data as PressSectionData, section.title ?? SECTION_DEFAULT_TITLES.PRESS);
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
        defaultTitle={SECTION_DEFAULT_TITLES.PRESS}
        onChange={(value) => {
          setTitle(value);
          onLiveChange({ highlightStats: highlight }, value);
        }}
      />
      <div>
        <Label>Destaque (uma linha)</Label>
        <Input
          value={highlight}
          maxLength={500}
          placeholder='Ex.: "Um dos nomes mais promissores da cena" — Rolling Stone Brasil'
          onChange={(e) => {
            setHighlight(e.target.value);
            setSaved(false);
            onLiveChange({ highlightStats: e.target.value }, title);
          }}
        />
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        {saved && !dirty && <span className="text-sm text-emerald-400">Salvo</span>}
      </div>

      <div className="flex flex-col gap-2 border-t border-white/5 pt-4">
        <Label>Matérias e menções</Label>
        {mentions.length > 0 && (
          <ul className="flex flex-col gap-1.5">
            {mentions.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl bg-bg px-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-bold text-fg">{item.outlet}</span>
                  {item.quote && <span className="block truncate text-xs text-fg-muted">“{item.quote}”</span>}
                </span>
                <Button onClick={() => handleDelete(item.id)} variant="ghost" size="sm">
                  remover
                </Button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap gap-2">
          <Input value={outlet} onChange={(e) => setOutlet(e.target.value)} placeholder="Veículo (ex.: Rolling Stone Brasil)" maxLength={150} className="min-w-[180px] flex-1" />
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link (opcional)" inputMode="url" className="w-56" />
        </div>
        <Textarea rows={2} value={quote} onChange={(e) => setQuote(e.target.value)} placeholder="Trecho citado (opcional)" maxLength={400} />
        <Button type="button" variant="secondary" size="sm" className="self-start" disabled={busy || !outlet.trim()} onClick={() => void handleAdd()}>
          <Plus size={14} /> Adicionar menção
        </Button>
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
