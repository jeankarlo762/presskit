import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SECTION_DEFAULT_TITLES, type BioSectionData } from "@presskit/shared";
import { updateSectionData } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";

const schema = z.object({
  shortBio: z.string().trim().max(280),
  longBio: z.string().trim().max(4000),
});

export function BioForm({
  initial,
  initialTitle,
  onSaved,
}: {
  initial: BioSectionData;
  initialTitle: string;
  onSaved: (data: BioSectionData, title: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BioSectionData>({ resolver: zodResolver(schema), defaultValues: initial });

  useEffect(() => reset(initial), [initial, reset]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  const titleChanged = title !== initialTitle;

  async function onSubmit(values: BioSectionData) {
    setSaved(false);
    const section = await updateSectionData("BIO", values, title);
    onSaved(section.data as BioSectionData, section.title ?? SECTION_DEFAULT_TITLES.BIO);
    reset(values);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border p-4">
      <SectionTitleField value={title} defaultTitle={SECTION_DEFAULT_TITLES.BIO} onChange={setTitle} />
      <div>
        <label className="mb-1 block text-sm font-medium">Bio curta (até 280 caracteres)</label>
        <textarea rows={2} className="w-full rounded border px-3 py-2 text-sm" {...register("shortBio")} />
        {errors.shortBio && <p className="mt-1 text-sm text-red-600">{errors.shortBio.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Bio completa</label>
        <textarea rows={6} className="w-full rounded border px-3 py-2 text-sm" {...register("longBio")} />
        {errors.longBio && <p className="mt-1 text-sm text-red-600">{errors.longBio.message}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || (!isDirty && !titleChanged)}
          className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
        {saved && !isDirty && !titleChanged && <span className="text-sm text-green-600">Salvo</span>}
      </div>
    </form>
  );
}
