import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ContactSectionData } from "@presskit/shared";
import { updateSectionData } from "../../api/presskit";

const PLATFORMS = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "SPOTIFY", "X", "IMDB", "SITE", "OUTRO"] as const;

const schema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  socialLinks: z
    .array(z.object({ platform: z.enum(PLATFORMS), url: z.string().trim().url() }))
    .max(10)
    .default([]),
});

export function ContactForm({
  initial,
  onSaved,
}: {
  initial: ContactSectionData;
  onSaved: (data: ContactSectionData) => void;
}) {
  const [saved, setSaved] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ContactSectionData>({ resolver: zodResolver(schema), defaultValues: initial });
  const { fields, append, remove } = useFieldArray({ control, name: "socialLinks" });

  useEffect(() => reset(initial), [initial, reset]);

  async function onSubmit(values: ContactSectionData) {
    setSaved(false);
    const section = await updateSectionData("CONTACT", values);
    onSaved(section.data as ContactSectionData);
    reset(values);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 rounded-lg border p-4">
      <h3 className="font-medium">Contato</h3>
      <div>
        <label className="mb-1 block text-sm font-medium">E-mail</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("email")} />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Telefone</label>
        <input className="w-full rounded border px-3 py-2 text-sm" {...register("phone")} />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Redes sociais</label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <select className="rounded border px-2 py-2 text-sm" {...register(`socialLinks.${index}.platform`)}>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </select>
            <input
              className="flex-1 rounded border px-3 py-2 text-sm"
              placeholder="https://..."
              {...register(`socialLinks.${index}.url`)}
            />
            <button type="button" onClick={() => remove(index)} className="text-sm text-red-600">
              remover
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => append({ platform: "INSTAGRAM", url: "" })}
          className="self-start text-sm underline"
        >
          + adicionar rede social
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting || !isDirty}
          className="self-start rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {isSubmitting ? "Salvando..." : "Salvar"}
        </button>
        {saved && !isDirty && <span className="text-sm text-green-600">Salvo</span>}
      </div>
    </form>
  );
}
