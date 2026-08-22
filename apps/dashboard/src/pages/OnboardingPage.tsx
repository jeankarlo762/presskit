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
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-semibold">Vamos criar seu presskit</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Categoria</label>
          <select className="w-full rounded border px-3 py-2" {...register("category")}>
            {ARTIST_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {ARTIST_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Endereço do seu presskit</label>
          <div className="flex items-center rounded border px-3 py-2 text-gray-500">
            <span className="text-sm">presskit.com.br/</span>
            <input className="w-full outline-none" placeholder="seu-nome" {...register("slug")} />
          </div>
          {errors.slug && <p className="mt-1 text-sm text-red-600">{errors.slug.message}</p>}
        </div>
        {serverError && <p className="text-sm text-red-600">{serverError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Criando..." : "Criar presskit"}
        </button>
      </form>
    </div>
  );
}
