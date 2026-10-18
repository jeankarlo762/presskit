import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { SectionType } from "@presskit/shared";
import { updateSectionData } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input, Textarea } from "../../components/ui";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";

export type ListField = {
  key: string;
  label: string;
  kind?: "text" | "textarea";
  maxLength?: number;
  placeholder?: string;
  optional?: boolean;
};

type Item = Record<string, string>;

/**
 * One form for every "list of small records" section (Números, Depoimentos,
 * FAQ): the fields describe one item, the artist adds/removes rows, and
 * everything saves as `{ items }` through the section data endpoint.
 */
export function ListSectionForm({
  sectionType,
  fields,
  initialItems,
  initialTitle,
  defaultTitle,
  description,
  max,
  onLiveChange,
  onSaved,
}: {
  sectionType: SectionType;
  fields: ListField[];
  initialItems: Item[];
  initialTitle: string;
  defaultTitle: string;
  description?: string;
  max: number;
  onLiveChange: (items: Item[], title: string) => void;
  onSaved: (items: Item[], title: string) => void;
}) {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setItems(initialItems), [initialItems]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const dirty = JSON.stringify(items) !== JSON.stringify(initialItems) || title !== initialTitle;

  function update(next: Item[], nextTitle = title) {
    setItems(next);
    setSaved(false);
    onLiveChange(next, nextTitle);
  }

  function emptyItem(): Item {
    return Object.fromEntries(fields.map((field) => [field.key, ""]));
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const cleaned = items
        .map((item) => Object.fromEntries(Object.entries(item).map(([k, v]) => [k, v.trim()])))
        .filter((item) => fields.some((field) => !field.optional && item[field.key]));
      const section = await updateSectionData(sectionType, { items: cleaned }, title);
      const savedItems = ((section.data as { items?: Item[] })?.items ?? []) as Item[];
      onSaved(savedItems, section.title ?? defaultTitle);
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
      {description && (
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">
          {description}
          <InfoTip
            content={sectionType === "STATS" ? FIELD_HELP.stats : sectionType === "FAQ" ? FIELD_HELP.faq : FIELD_HELP.testimonials}
            label="Sobre esta seção"
          />
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {items.map((item, index) => (
          <li key={index} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-bg p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {fields.map((field) =>
                field.kind === "textarea" ? (
                  <div key={field.key} className="sm:col-span-2">
                    <Textarea
                      rows={3}
                      value={item[field.key] ?? ""}
                      maxLength={field.maxLength}
                      placeholder={field.label + (field.optional ? " (opcional)" : "")}
                      aria-label={field.label}
                      onChange={(e) => update(items.map((it, i) => (i === index ? { ...it, [field.key]: e.target.value } : it)))}
                    />
                  </div>
                ) : (
                  <Input
                    key={field.key}
                    value={item[field.key] ?? ""}
                    maxLength={field.maxLength}
                    placeholder={field.placeholder ?? field.label + (field.optional ? " (opcional)" : "")}
                    aria-label={field.label}
                    onChange={(e) => update(items.map((it, i) => (i === index ? { ...it, [field.key]: e.target.value } : it)))}
                  />
                ),
              )}
            </div>
            <button
              type="button"
              onClick={() => update(items.filter((_, i) => i !== index))}
              className="inline-flex items-center gap-1 self-end text-xs font-bold text-fg-muted hover:text-red-400"
            >
              <Trash2 size={13} /> remover
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        {items.length < max && (
          <Button type="button" variant="secondary" size="sm" onClick={() => update([...items, emptyItem()])}>
            <Plus size={14} /> Adicionar
          </Button>
        )}
        <Button type="button" size="sm" disabled={saving || !dirty} onClick={() => void save()}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        {saved && !dirty && <span className="text-sm text-emerald-400">Salvo</span>}
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}
