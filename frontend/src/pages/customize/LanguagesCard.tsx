import { useEffect, useState } from "react";
import { SECTION_DEFAULT_TITLES, SECTION_DEFAULT_TITLES_EN, type PresskitUpdateInput } from "@presskit/shared";
import { updateSectionTranslation, type Presskit, type Section } from "../../api/presskit";
import { apiErrorMessage } from "../../api/axios";
import { FieldError, Input } from "../../components/ui";

function EnglishTitleField({ section, onSaved }: { section: Section; onSaved: (section: Section) => void }) {
  const [value, setValue] = useState(section.titleEn ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setValue(section.titleEn ?? ""), [section.titleEn]);

  async function commit() {
    const trimmed = value.trim();
    if ((trimmed || null) === (section.titleEn ?? null)) return;
    try {
      onSaved(await updateSectionTranslation(section.type, { titleEn: trimmed || null }));
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    }
  }

  return (
    <li className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <span className="w-32 shrink-0 truncate text-sm text-fg-muted">{section.title || SECTION_DEFAULT_TITLES[section.type]}</span>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => void commit()}
          placeholder={SECTION_DEFAULT_TITLES_EN[section.type]}
          maxLength={60}
          className="py-1.5"
        />
      </div>
      <FieldError>{error}</FieldError>
    </li>
  );
}

export function LanguagesCard({
  presskit,
  sections,
  onChange,
  onSectionSaved,
}: {
  presskit: Presskit;
  sections: Section[];
  onChange: (patch: PresskitUpdateInput) => void;
  onSectionSaved: (section: Section) => void;
}) {
  const english = presskit.languages?.includes("en") ?? false;

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-11 items-center gap-2.5 text-sm font-bold text-fg">
        <input
          type="checkbox"
          checked={english}
          onChange={(e) => onChange({ languages: e.target.checked ? ["pt", "en"] : ["pt"] })}
          className="h-4 w-4 accent-primary"
        />
        Oferecer a página também em inglês
      </label>
      <p className="text-xs text-fg-muted">
        A página ganha um seletor PT/EN. O que não for traduzido continua em português. A bio em inglês você
        escreve em "Meu presskit"; os títulos das seções, aqui:
      </p>
      {english && (
        <ul className="flex flex-col gap-2">
          {sections.map((section) => (
            <EnglishTitleField key={section.id} section={section} onSaved={onSectionSaved} />
          ))}
        </ul>
      )}
    </div>
  );
}
