import { useEffect, useState } from "react";
import { Languages } from "lucide-react";
import type { BioSectionData } from "@presskit/shared";
import { updateSectionTranslation, type Section } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { Button, Card, FieldError, Label, Textarea } from "../../components/ui";

/** English version of the bio — shown only when the artist offers EN. Each
 * field is optional; blank ones fall back to Portuguese on the page. */
export function BioTranslationForm({
  initial,
  onLiveChange,
  onSaved,
}: {
  initial: Partial<BioSectionData> | null | undefined;
  onLiveChange: (dataEn: Partial<BioSectionData>) => void;
  onSaved: (section: Section) => void;
}) {
  const [shortBio, setShortBio] = useState(initial?.shortBio ?? "");
  const [longBio, setLongBio] = useState(initial?.longBio ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setShortBio(initial?.shortBio ?? "");
    setLongBio(initial?.longBio ?? "");
  }, [initial]);

  const dirty = shortBio !== (initial?.shortBio ?? "") || longBio !== (initial?.longBio ?? "");

  function update(next: { shortBio?: string; longBio?: string }) {
    const merged = { shortBio: next.shortBio ?? shortBio, longBio: next.longBio ?? longBio };
    if (next.shortBio !== undefined) setShortBio(next.shortBio);
    if (next.longBio !== undefined) setLongBio(next.longBio);
    setSaved(false);
    onLiveChange(merged);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const section = await updateSectionTranslation("BIO", {
        dataEn: { shortBio: shortBio.trim(), longBio: longBio.trim() },
      });
      onSaved(section);
      setSaved(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar a tradução"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Languages size={18} className="text-primary-text" />
        <h3 className="font-bold text-fg">Bio em inglês</h3>
      </div>
      <div>
        <Label>Short bio (up to 280 characters)</Label>
        <Textarea rows={2} value={shortBio} maxLength={280} onChange={(e) => update({ shortBio: e.target.value })} />
      </div>
      <div>
        <Label>Full bio</Label>
        <Textarea rows={6} value={longBio} maxLength={4000} onChange={(e) => update({ longBio: e.target.value })} />
      </div>
      <FieldError>{error}</FieldError>
      <div className="flex items-center gap-3">
        <Button type="button" size="sm" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? "Salvando..." : "Salvar tradução"}
        </Button>
        {saved && !dirty && <span className="text-sm text-emerald-400">Salvo</span>}
      </div>
    </Card>
  );
}
