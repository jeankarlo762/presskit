import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SECTION_DEFAULT_TITLES, type ContactSectionData } from "@presskit/shared";
import { updateSectionData } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Input, Label, Select } from "../../components/ui";

const PLATFORMS = ["INSTAGRAM", "TIKTOK", "YOUTUBE", "SPOTIFY", "X", "IMDB", "SITE", "OUTRO"] as const;

const schema = z.object({
  email: z.string().trim().email(),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  socialLinks: z
    .array(z.object({ platform: z.enum(PLATFORMS), url: z.string().trim().url() }))
    .max(10)
    .default([]),
});

function toLiveData(values: {
  email?: string;
  phone?: string;
  socialLinks?: { platform?: (typeof PLATFORMS)[number]; url?: string }[];
}): ContactSectionData {
  return {
    email: values.email ?? "",
    phone: values.phone,
    socialLinks: (values.socialLinks ?? [])
      .filter((l): l is { platform: (typeof PLATFORMS)[number]; url: string } => Boolean(l?.platform && l.url)),
  };
}

export function ContactForm({
  initial,
  initialTitle,
  onLiveChange,
  onSaved,
}: {
  initial: ContactSectionData;
  initialTitle: string;
  /** Fires on every keystroke (unsaved) so the preview panel updates
   * instantly — persistence still only happens on "Salvar". */
  onLiveChange: (data: ContactSectionData, title: string) => void;
  onSaved: (data: ContactSectionData, title: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ContactSectionData>({ resolver: zodResolver(schema), defaultValues: initial });
  const { fields, append, remove } = useFieldArray({ control, name: "socialLinks" });

  useEffect(() => reset(initial), [initial, reset]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  useEffect(() => {
    const subscription = watch((values) => onLiveChange(toLiveData(values), title));
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, title]);

  function handleTitleChange(value: string) {
    setTitle(value);
    onLiveChange(toLiveData(watch()), value);
  }

  const titleChanged = title !== initialTitle;

  async function onSubmit(values: ContactSectionData) {
    setSaved(false);
    const section = await updateSectionData("CONTACT", values, title);
    onSaved(section.data as ContactSectionData, section.title ?? SECTION_DEFAULT_TITLES.CONTACT);
    reset(values);
    setSaved(true);
  }

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <SectionTitleField value={title} defaultTitle={SECTION_DEFAULT_TITLES.CONTACT} onChange={handleTitleChange} />
      <div>
        <Label>E-mail</Label>
        <Input {...register("email")} />
        <FieldError>{errors.email?.message}</FieldError>
      </div>
      <div>
        <Label>Telefone</Label>
        <Input {...register("phone")} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Redes sociais</Label>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Select className="w-40" {...register(`socialLinks.${index}.platform`)}>
              {PLATFORMS.map((platform) => (
                <option key={platform} value={platform}>
                  {platform}
                </option>
              ))}
            </Select>
            <Input placeholder="https://..." {...register(`socialLinks.${index}.url`)} />
            <Button type="button" onClick={() => remove(index)} variant="ghost" size="sm">
              remover
            </Button>
          </div>
        ))}
        <Button
          type="button"
          onClick={() => append({ platform: "INSTAGRAM", url: "" })}
          variant="secondary"
          size="sm"
          className="self-start"
        >
          + adicionar rede social
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || (!isDirty && !titleChanged)} size="sm">
          {isSubmitting ? "Salvando..." : "Salvar"}
        </Button>
        {saved && !isDirty && !titleChanged && <span className="text-sm text-emerald-600">Salvo</span>}
      </div>
    </Card>
  );
}
