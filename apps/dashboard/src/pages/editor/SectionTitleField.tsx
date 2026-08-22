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
      <label className="mb-1 block text-xs font-medium text-neutral-500">Título da seção</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={defaultTitle}
        className="w-full max-w-xs rounded border px-3 py-1.5 text-sm font-medium"
      />
    </div>
  );
}
