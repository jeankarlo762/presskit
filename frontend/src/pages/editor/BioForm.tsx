import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SECTION_DEFAULT_TITLES, type BioSectionData } from "@presskit/shared";
import { updateSectionData } from "../../api/presskit";
import { SectionTitleField } from "./SectionTitleField";
import { Button, Card, FieldError, Label, Textarea } from "../../components/ui";

const schema = z.object({
  shortBio: z.string().trim().max(280),
  longBio: z.string().trim().max(4000),
});

export function BioForm({
  initial,
  initialTitle,
  onLiveChange,
  onSaved,
}: {
  initial: BioSectionData;
  initialTitle: string;
  /** Fires on every keystroke (unsaved) so the preview panel updates
   * instantly — persistence still only happens on "Salvar". */
  onLiveChange: (data: BioSectionData, title: string) => void;
  onSaved: (data: BioSectionData, title: string) => void;
}) {
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BioSectionData>({ resolver: zodResolver(schema), defaultValues: initial });

  useEffect(() => reset(initial), [initial, reset]);
  useEffect(() => setTitle(initialTitle), [initialTitle]);

  useEffect(() => {
    const subscription = watch((values) => {
      onLiveChange({ shortBio: values.shortBio ?? "", longBio: values.longBio ?? "" }, title);
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch, title]);

  function handleTitleChange(value: string) {
    setTitle(value);
    onLiveChange({ shortBio: watch("shortBio") ?? "", longBio: watch("longBio") ?? "" }, value);
  }

  const titleChanged = title !== initialTitle;

  async function onSubmit(values: BioSectionData) {
    setSaved(false);
    const section = await updateSectionData("BIO", values, title);
    onSaved(section.data as BioSectionData, section.title ?? SECTION_DEFAULT_TITLES.BIO);
    reset(values);
    setSaved(true);
  }

  return (
    <Card as="form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <SectionTitleField value={title} defaultTitle={SECTION_DEFAULT_TITLES.BIO} onChange={handleTitleChange} />
      <div>
        <Label>Bio curta (até 280 caracteres)</Label>
        <Textarea rows={2} {...register("shortBio")} />
        <FieldError>{errors.shortBio?.message}</FieldError>
      </div>
      <div>
        <Label>Bio completa</Label>
        <Textarea rows={6} {...register("longBio")} />
        <FieldError>{errors.longBio?.message}</FieldError>
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
