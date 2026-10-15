import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Pencil, X } from "lucide-react";
import { SECTION_DEFAULT_TITLES } from "@presskit/shared";
import type { Section } from "../../api/presskit";
import { Card, FieldError, Input } from "../../components/ui";

function sectionDisplayName(section: Section) {
  return section.title?.trim() || SECTION_DEFAULT_TITLES[section.type] || "Seção personalizada";
}

const iconButton =
  "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-bg-elevated-2 text-fg-muted transition hover:text-fg disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text";

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
    >
      <span
        className={
          "flex h-6 w-10 items-center rounded-full p-0.5 transition " +
          (checked ? "justify-end bg-primary" : "justify-start bg-white/15")
        }
      >
        <span className="h-5 w-5 rounded-full bg-white" />
      </span>
    </button>
  );
}

function SectionRow({
  section,
  isFirst,
  isLast,
  onMove,
  onToggle,
  onRename,
}: {
  section: Section;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggle: (visible: boolean) => void;
  onRename: (title: string) => Promise<void>;
}) {
  const name = sectionDisplayName(section);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function commit() {
    const title = draft.trim();
    if (!title || title === name) {
      setEditing(false);
      setError(null);
      return;
    }
    setSaving(true);
    try {
      await onRename(title);
      setEditing(false);
      setError(null);
    } catch {
      setError("Não foi possível renomear. Tente de novo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className="border-t border-white/7 py-1.5">
      <div className="flex items-center gap-2">
        {editing ? (
          <form
            className="flex flex-1 items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void commit();
            }}
          >
            <Input
              autoFocus
              value={draft}
              maxLength={60}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setDraft(name);
                  setEditing(false);
                  setError(null);
                }
              }}
              aria-label="Nome da seção"
              className="min-h-11 py-2"
            />
            <button type="submit" disabled={saving} className={iconButton} aria-label="Salvar nome">
              <Check size={18} />
            </button>
            <button
              type="button"
              className={iconButton}
              aria-label="Cancelar"
              onClick={() => {
                setDraft(name);
                setEditing(false);
                setError(null);
              }}
            >
              <X size={18} />
            </button>
          </form>
        ) : (
          <>
            <span
              className={"min-w-0 flex-1 truncate text-sm font-semibold " + (section.visible ? "text-fg" : "text-fg-muted/60")}
            >
              {name}
            </span>
            <button
              type="button"
              className={iconButton + " bg-transparent"}
              aria-label={`Renomear ${name}`}
              onClick={() => {
                setDraft(name);
                setEditing(true);
              }}
            >
              <Pencil size={16} />
            </button>
          </>
        )}
        {!editing && (
          <>
            <button type="button" className={iconButton} aria-label="Subir" disabled={isFirst} onClick={() => onMove(-1)}>
              <ArrowUp size={18} />
            </button>
            <button type="button" className={iconButton} aria-label="Descer" disabled={isLast} onClick={() => onMove(1)}>
              <ArrowDown size={18} />
            </button>
            <Toggle
              checked={section.visible}
              label={section.visible ? `Ocultar ${name}` : `Mostrar ${name}`}
              onChange={onToggle}
            />
          </>
        )}
      </div>
      <FieldError>{error}</FieldError>
    </li>
  );
}

export function SectionsOrderCard({
  sections,
  onMove,
  onToggle,
  onRename,
}: {
  sections: Section[];
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle: (section: Section, visible: boolean) => void;
  onRename: (section: Section, title: string) => Promise<void>;
}) {
  return (
    <Card className="flex flex-col gap-1 p-5">
      <h2 className="mb-2 text-[15px] font-extrabold text-fg">Ordem e visibilidade das seções</h2>
      {sections.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhuma seção ainda.</p>
      ) : (
        <ul>
          {sections.map((section, index) => (
            <SectionRow
              key={section.id}
              section={section}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
              onMove={(direction) => onMove(index, direction)}
              onToggle={(visible) => onToggle(section, visible)}
              onRename={(title) => onRename(section, title)}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
