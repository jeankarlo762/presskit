import { Input, Label } from "../../components/ui";
import { FIELD_HELP } from "../../lib/fieldHelp";

export function SectionTitleField({
  value,
  defaultTitle,
  onChange,
}: {
  value: string;
  defaultTitle: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <Label className="text-xs text-fg-muted" hint={FIELD_HELP.sectionTitle}>Título da seção</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultTitle}
        className="max-w-xs py-1.5 font-medium"
      />
    </div>
  );
}
