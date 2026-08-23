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
import { Button, Card, FieldError, GrainOverlay, Label, Logo, Select } from "../components/ui";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden px-4">
      <GrainOverlay />
      <div
        className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--orange), transparent)" }}
        aria-hidden
      />
      <Logo className="relative text-2xl" />
      <Card className="relative w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight text-fg">Vamos criar seu presskit</h1>
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
            <div className="flex w-full items-center rounded-2xl border border-white/10 bg-bg-elevated px-4 py-2.5 transition focus-within:border-violet/60 focus-within:ring-4 focus-within:ring-violet/15">
              <span className="text-sm text-fg-muted">presskit.com.br/</span>
              <input
                className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-fg-muted/60"
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
