import { Input, Label } from "../../components/ui";

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
      <Label className="text-xs text-fg-muted">Título da seção</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultTitle}
        className="max-w-xs py-1.5 font-medium"
      />
    </div>
  );
}
