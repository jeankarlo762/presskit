import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  presskitOnboardingSchema,
  ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  type PresskitOnboardingInput,
} from "@presskit/shared";
import { api } from "../api/axios";
import { Button, Card, FieldError, Label, Select } from "../components/ui";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PresskitOnboardingInput>({
    resolver: zodResolver(presskitOnboardingSchema),
    defaultValues: { category: "MUSICO_BANDA" },
  });

  async function onSubmit(input: PresskitOnboardingInput) {
    setServerError(null);
    try {
      await api.post("/presskit/onboarding", input);
      navigate("/");
    } catch (error) {
      setServerError(
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Não foi possível criar o presskit",
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight">Vamos criar seu presskit</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <Label>Categoria</Label>
            <Select {...register("category")}>
              {ARTIST_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {ARTIST_CATEGORY_LABELS[category]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Endereço do seu presskit</Label>
            <div className="flex w-full items-center rounded-2xl border border-neutral-200 bg-white px-4 py-2.5 shadow-sm transition focus-within:border-neutral-900 focus-within:ring-4 focus-within:ring-neutral-900/5">
              <span className="text-sm text-neutral-400">presskit.com.br/</span>
              <input
                className="w-full bg-transparent text-sm text-neutral-900 outline-none"
                placeholder="seu-nome"
                {...register("slug")}
              />
            </div>
            <FieldError>{errors.slug?.message}</FieldError>
          </div>
          <FieldError>{serverError}</FieldError>
          <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
            {isSubmitting ? "Criando..." : "Criar presskit"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
