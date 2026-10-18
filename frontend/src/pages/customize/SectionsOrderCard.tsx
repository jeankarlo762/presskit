import { useState } from "react";
import { ArrowDown, ArrowUp, Check, Paintbrush, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  SECTION_DEFAULT_TITLES,
  SECTION_TYPES,
  SECTION_TYPE_INFO,
  type SectionStyleInput,
  type SectionType,
} from "@presskit/shared";
import type { Presskit, Section } from "../../api/presskit";
import { Card, FieldError, Input } from "../../components/ui";
import { InfoTip } from "../../components/InfoTip";
import { FIELD_HELP } from "../../lib/fieldHelp";
import { SectionStylePanel } from "./SectionStylePanel";

function sectionDisplayName(section: Section) {
  return section.title?.trim() || SECTION_DEFAULT_TITLES[section.type] || SECTION_TYPE_INFO[section.type].label;
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
  presskit,
  isFirst,
  isLast,
  onMove,
  onToggle,
  onRename,
  onRemove,
  onStyleChange,
  onSectionChange,
}: {
  section: Section;
  presskit: Presskit;
  isFirst: boolean;
  isLast: boolean;
  onMove: (direction: -1 | 1) => void;
  onToggle: (visible: boolean) => void;
  onRename: (title: string) => Promise<void>;
  onRemove: () => Promise<void>;
  onStyleChange: (patch: { style?: SectionStyleInput; layout?: string | null }) => void;
  onSectionChange: (section: Section) => void;
}) {
  const name = sectionDisplayName(section);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [styling, setStyling] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const hasOwnStyle = Object.keys(section.style ?? {}).length > 0 || Boolean(section.layout);

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
            <span className={"min-w-0 flex-1 truncate text-sm font-semibold " + (section.visible ? "text-fg" : "text-fg-muted/60")}>
              {name}
              <span className="ml-2 text-[11px] font-normal text-fg-muted/70">{SECTION_TYPE_INFO[section.type].label}</span>
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
            <button
              type="button"
              className={iconButton + (styling || hasOwnStyle ? " text-primary-text" : "")}
              aria-label={`Estilo de ${name}`}
              aria-expanded={styling}
              onClick={() => setStyling((v) => !v)}
            >
              <Paintbrush size={17} />
            </button>
            <button type="button" className={iconButton} aria-label="Subir" disabled={isFirst} onClick={() => onMove(-1)}>
              <ArrowUp size={18} />
            </button>
            <button type="button" className={iconButton} aria-label="Descer" disabled={isLast} onClick={() => onMove(1)}>
              <ArrowDown size={18} />
            </button>
            <Toggle checked={section.visible} label={section.visible ? `Ocultar ${name}` : `Mostrar ${name}`} onChange={onToggle} />
          </>
        )}
      </div>
      <FieldError>{error}</FieldError>
      {styling && (
        <div className="mt-2 flex flex-col gap-2">
          <SectionStylePanel section={section} presskit={presskit} onStyleChange={onStyleChange} onSectionChange={onSectionChange} />
          <div className="flex items-center justify-end gap-2 text-xs">
            {confirmRemove ? (
              <>
                <span className="text-fg-muted">Remover a seção da página? O conteúdo das coleções (fotos, mídias, datas) fica guardado.</span>
                <button type="button" onClick={() => void onRemove()} className="rounded-lg bg-red-500/15 px-3 py-1.5 font-bold text-red-400 hover:bg-red-500/25">
                  Remover
                </button>
                <button type="button" onClick={() => setConfirmRemove(false)} className="px-2 py-1.5 font-bold text-fg-muted hover:text-fg">
                  Cancelar
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmRemove(true)} className="inline-flex items-center gap-1 px-2 py-1.5 font-bold text-fg-muted hover:text-red-400">
                <Trash2 size={13} /> Remover seção
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export function SectionsOrderCard({
  sections,
  presskit,
  onMove,
  onToggle,
  onRename,
  onAdd,
  onRemove,
  onStyleChange,
  onSectionChange,
}: {
  sections: Section[];
  presskit: Presskit;
  onMove: (index: number, direction: -1 | 1) => void;
  onToggle: (section: Section, visible: boolean) => void;
  onRename: (section: Section, title: string) => Promise<void>;
  onAdd: (type: SectionType) => Promise<void>;
  onRemove: (section: Section) => Promise<void>;
  onStyleChange: (section: Section, patch: { style?: SectionStyleInput; layout?: string | null }) => void;
  onSectionChange: (section: Section) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const present = new Set(sections.map((s) => s.type));
  const addable = SECTION_TYPES.filter((type) => !present.has(type));

  async function add(type: SectionType) {
    setAddError(null);
    try {
      await onAdd(type);
      setAdding(false);
    } catch {
      setAddError("Não foi possível adicionar a seção.");
    }
  }

  return (
    <Card className="flex flex-col gap-1 p-5">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-1.5 text-[15px] font-extrabold text-fg">
            Seções da página
            <InfoTip content={FIELD_HELP.sections} label="Sobre: seções da página" />
          </h2>
          <p className="text-xs text-fg-muted">Ordem, nome, visibilidade e o estilo de cada uma (pincel).</p>
        </div>
        {addable.length > 0 && (
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            aria-expanded={adding}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/15 px-3.5 text-sm font-bold text-fg hover:bg-white/5"
          >
            <Plus size={16} /> Adicionar seção
          </button>
        )}
      </div>

      {adding && (
        <ul className="mb-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {addable.map((type) => (
            <li key={type}>
              <button
                type="button"
                onClick={() => void add(type)}
                className="flex w-full flex-col items-start rounded-xl border border-white/10 bg-bg px-3 py-2 text-left transition hover:border-white/30"
              >
                <span className="text-sm font-bold text-fg">{SECTION_TYPE_INFO[type].label}</span>
                <span className="text-xs text-fg-muted">{SECTION_TYPE_INFO[type].description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldError>{addError}</FieldError>

      {sections.length === 0 ? (
        <p className="text-sm text-fg-muted">Nenhuma seção ainda.</p>
      ) : (
        <ul>
          {sections.map((section, index) => (
            <SectionRow
              key={section.id}
              section={section}
              presskit={presskit}
              isFirst={index === 0}
              isLast={index === sections.length - 1}
              onMove={(direction) => onMove(index, direction)}
              onToggle={(visible) => onToggle(section, visible)}
              onRename={(title) => onRename(section, title)}
              onRemove={() => onRemove(section)}
              onStyleChange={(patch) => onStyleChange(section, patch)}
              onSectionChange={onSectionChange}
            />
          ))}
        </ul>
      )}
    </Card>
  );
}
