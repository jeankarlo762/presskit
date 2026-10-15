import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Clapperboard, Disc3, Music2 } from "lucide-react";
import {
  presskitOnboardingSchema,
  ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  type ArtistCategory,
  type PresskitOnboardingInput,
} from "@presskit/shared";
import { api, apiErrorMessage } from "../api/axios";
import { SITE_HOST } from "../config";
import { useAuthStore } from "../store/auth.store";
import { CHOSEN_PLAN_KEY } from "./SignupPage";
import { Button, FieldError, Logo } from "../components/ui";

function consumeChosenPlan(): string | null {
  try {
    const plano = sessionStorage.getItem(CHOSEN_PLAN_KEY);
    if (plano) sessionStorage.removeItem(CHOSEN_PLAN_KEY);
    return plano;
  } catch {
    return null;
  }
}

const CATEGORY_ICONS: Record<ArtistCategory, typeof Music2> = {
  MUSICO_BANDA: Music2,
  DJ: Disc3,
  ATOR: Clapperboard,
  ARTISTA_VISUAL: Camera,
};

const CATEGORY_HINTS: Record<ArtistCategory, string> = {
  MUSICO_BANDA: "Músicas, clipes, agenda e rider",
  DJ: "Sets, agenda, rider e fotos de palco",
  ATOR: "Vídeos, fotos e trabalhos",
  ARTISTA_VISUAL: "Portfólio com galeria ampliada",
};

const STEPS = ["Quem é você", "Seu endereço"] as const;

/** Suggests a slug from the artist name: lower case, no accents, hyphens. */
function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [serverError, setServerError] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PresskitOnboardingInput>({
    resolver: zodResolver(presskitOnboardingSchema),
    defaultValues: { category: "MUSICO_BANDA", slug: slugify(user?.name ?? "") },
  });

  const category = watch("category");
  const slug = watch("slug");

  async function onSubmit(input: PresskitOnboardingInput) {
    setServerError(null);
    try {
      await api.post("/presskit/onboarding", input);
      const plano = consumeChosenPlan();
      navigate(plano ? `/assinatura?plano=${encodeURIComponent(plano)}` : "/");
    } catch (error) {
      setServerError(apiErrorMessage(error, "Não foi possível criar o presskit"));
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row">
      <main className="flex flex-1 flex-col gap-8 px-6 py-8 sm:px-12 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Logo className="text-2xl" />
          {user?.trialEndsAt && <p className="text-sm text-fg-muted">Teste PRO ativo · 14 dias</p>}
        </div>

        <div className="flex max-w-2xl flex-col gap-2.5">
          <div className="flex gap-2" aria-hidden>
            {STEPS.map((label, index) => (
              <div key={label} className={"h-1.5 flex-1 rounded-full " + (index <= step ? "bg-primary" : "bg-white/10")} />
            ))}
          </div>
          <p className="text-[13px] font-semibold text-fg-muted">
            Passo {step + 1} de {STEPS.length} · {STEPS[step]}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-7">
          {step === 0 ? (
            <>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-4xl uppercase leading-none text-fg sm:text-5xl">O que você faz?</h1>
                <p className="text-[17px] leading-relaxed text-fg-muted">
                  Montamos as seções certas para a sua categoria. Dá para mudar tudo depois.
                </p>
              </div>
              <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <legend className="sr-only">Categoria</legend>
                {ARTIST_CATEGORIES.map((option) => {
                  const Icon = CATEGORY_ICONS[option];
                  const selected = option === category;
                  return (
                    <label
                      key={option}
                      className={
                        "flex min-h-11 cursor-pointer items-center gap-4 rounded-2xl border bg-bg-elevated p-4 transition " +
                        (selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-white/25")
                      }
                    >
                      <input
                        type="radio"
                        value={option}
                        checked={selected}
                        onChange={() => setValue("category", option)}
                        className="sr-only"
                      />
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-elevated-2 text-primary-text">
                        <Icon size={22} />
                      </span>
                      <span className="flex flex-col gap-0.5">
                        <span className="font-bold text-fg">{ARTIST_CATEGORY_LABELS[option]}</span>
                        <span className="text-[13px] text-fg-muted">{CATEGORY_HINTS[option]}</span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <div>
                <Button type="button" onClick={() => setStep(1)}>
                  Continuar
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-4xl uppercase leading-none text-fg sm:text-5xl">Escolha seu link</h1>
                <p className="text-[17px] leading-relaxed text-fg-muted">
                  É o endereço que você vai mandar para contratantes e colocar na bio.
                </p>
              </div>
              <div>
                <label htmlFor="slug" className="mb-2 block text-sm font-bold text-fg">
                  Endereço do seu presskit
                </label>
                <div className="flex min-h-11 w-full items-center rounded-xl border border-white/15 bg-bg px-4 py-3 transition focus-within:border-primary-text focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="text-[15px] text-fg-muted">{SITE_HOST}/</span>
                  <input
                    id="slug"
                    className="w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-muted/70"
                    placeholder="seu-nome"
                    autoFocus
                    {...register("slug")}
                  />
                </div>
                <FieldError>{errors.slug?.message}</FieldError>
              </div>
              <FieldError>{serverError}</FieldError>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar meu presskit"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                  Voltar
                </Button>
              </div>
            </>
          )}
        </form>
      </main>

      <aside className="hidden flex-col items-center justify-center gap-5 border-l border-border bg-bg-sidebar p-10 lg:flex lg:w-[420px]">
        <p className="text-[13px] font-bold uppercase tracking-widest text-fg-muted">Prévia</p>
        <div className="w-[280px] rounded-[32px] border border-white/10 bg-bg-elevated p-3">
          <div className="overflow-hidden rounded-[22px] bg-[#0f0e12]">
            <div className="flex h-[200px] items-end bg-[#2a1b2e] p-4">
              <p className="font-display text-3xl uppercase leading-none text-fg">{user?.name || "Seu nome"}</p>
            </div>
            <div className="flex flex-col gap-2.5 p-3.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary-text">
                {ARTIST_CATEGORY_LABELS[category]}
              </p>
              <div className="h-3 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-11/12 rounded bg-white/10" />
              <div className="mt-1 h-10 rounded-[10px] bg-primary" />
            </div>
          </div>
        </div>
        <p className="text-sm text-fg-muted">
          {SITE_HOST}/{slug || "seu-nome"}
        </p>
      </aside>
    </div>
  );
}
