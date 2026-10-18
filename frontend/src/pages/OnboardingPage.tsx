import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Camera, Clapperboard, Disc3, Mic2, Music2 } from "lucide-react";
import {
  presskitOnboardingSchema,
  PICKABLE_ARTIST_CATEGORIES,
  ARTIST_CATEGORY_LABELS,
  type AccountType,
  type ArtistCategory,
  type PresskitOnboardingInput,
} from "@presskit/shared";
import { api, apiErrorMessage } from "../api/axios";
import { SITE_HOST } from "../config";
import { useAuthStore } from "../store/auth.store";
import { fetchMe } from "../api/auth";
import { CHOSEN_ACCOUNT_KEY, CHOSEN_PLAN_KEY } from "./SignupPage";
import { Button, FieldError, Logo } from "../components/ui";

function consumeSession(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    if (value) sessionStorage.removeItem(key);
    return value;
  } catch {
    return null;
  }
}

const CATEGORY_ICONS: Record<ArtistCategory, typeof Music2> = {
  MUSICO_BANDA: Music2,
  DJ: Disc3,
  ATOR: Clapperboard,
  ARTISTA_VISUAL: Camera,
  PRODUTORA: Building2,
};

const CATEGORY_HINTS: Record<ArtistCategory, string> = {
  MUSICO_BANDA: "Músicas, clipes, agenda e rider",
  DJ: "Sets, agenda, rider e fotos de palco",
  ATOR: "Vídeos, fotos e trabalhos",
  ARTISTA_VISUAL: "Portfólio com galeria ampliada",
  PRODUTORA: "Página da produtora com a lista de artistas",
};

const ACCOUNT_OPTIONS: { key: AccountType; label: string; hint: string; icon: typeof Music2 }[] = [
  { key: "ARTIST", label: "Sou artista", hint: "Uma página só minha: presskit, portfólio e contato", icon: Mic2 },
  {
    key: "AGENCY",
    label: "Sou produtora / agência",
    hint: "Minha página com a lista de artistas e uma página completa para cada um",
    icon: Building2,
  },
];

/** Suggests a slug from the name: lower case, no accents, hyphens. */
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
  const { user, setUser } = useAuthStore();
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
    defaultValues: { accountType: "ARTIST", category: "MUSICO_BANDA", slug: slugify(user?.name ?? "") },
  });

  const accountType = watch("accountType");
  const category = watch("category");
  const slug = watch("slug");
  const isAgency = accountType === "AGENCY";

  // "Criar conta de produtora" on the landing page pre-selects the type.
  useEffect(() => {
    if (consumeSession(CHOSEN_ACCOUNT_KEY) === "produtora") setValue("accountType", "AGENCY");
  }, [setValue]);

  const steps = isAgency ? ["Quem é você", "Seu endereço"] : ["Quem é você", "O que você faz", "Seu endereço"];
  const lastStep = steps.length - 1;

  async function onSubmit(input: PresskitOnboardingInput) {
    setServerError(null);
    try {
      await api.post("/presskit/onboarding", input);
      // The account type is fixed now; refresh the stored profile so the
      // sidebar shows the agency tools right away.
      fetchMe().then(setUser).catch(() => undefined);
      const plano = consumeSession(CHOSEN_PLAN_KEY);
      navigate(plano ? `/assinatura?plano=${encodeURIComponent(plano)}` : isAgency ? "/artistas" : "/");
    } catch (error) {
      setServerError(apiErrorMessage(error, "Não foi possível criar a página"));
    }
  }

  function OptionCard({
    selected,
    icon: Icon,
    label,
    hint,
    onSelect,
  }: {
    selected: boolean;
    icon: typeof Music2;
    label: string;
    hint: string;
    onSelect: () => void;
  }) {
    return (
      <label
        className={
          "flex min-h-11 cursor-pointer items-center gap-4 rounded-2xl border bg-bg-elevated p-4 transition " +
          (selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-white/25")
        }
      >
        <input type="radio" checked={selected} onChange={onSelect} className="sr-only" />
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-bg-elevated-2 text-primary-text">
          <Icon size={22} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="font-bold text-fg">{label}</span>
          <span className="text-[13px] text-fg-muted">{hint}</span>
        </span>
      </label>
    );
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
            {steps.map((label, index) => (
              <div key={label} className={"h-1.5 flex-1 rounded-full " + (index <= step ? "bg-primary" : "bg-white/10")} />
            ))}
          </div>
          <p className="text-[13px] font-semibold text-fg-muted">
            Passo {step + 1} de {steps.length} · {steps[step]}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-7">
          {step === 0 && (
            <>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-4xl uppercase leading-none text-fg sm:text-5xl">Quem é você?</h1>
                <p className="text-[17px] leading-relaxed text-fg-muted">
                  Artista tem uma página. Produtora tem a própria página e cria a página de cada artista do casting.
                </p>
              </div>
              <fieldset className="grid grid-cols-1 gap-3">
                <legend className="sr-only">Tipo de conta</legend>
                {ACCOUNT_OPTIONS.map((option) => (
                  <OptionCard
                    key={option.key}
                    selected={accountType === option.key}
                    icon={option.icon}
                    label={option.label}
                    hint={option.hint}
                    onSelect={() => setValue("accountType", option.key)}
                  />
                ))}
              </fieldset>
              <div>
                <Button type="button" onClick={() => setStep(1)}>
                  Continuar
                </Button>
              </div>
            </>
          )}

          {step === 1 && !isAgency && (
            <>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-4xl uppercase leading-none text-fg sm:text-5xl">O que você faz?</h1>
                <p className="text-[17px] leading-relaxed text-fg-muted">
                  Montamos as seções certas para a sua categoria. Dá para mudar tudo depois.
                </p>
              </div>
              <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <legend className="sr-only">Categoria</legend>
                {PICKABLE_ARTIST_CATEGORIES.map((option) => (
                  <OptionCard
                    key={option}
                    selected={option === category}
                    icon={CATEGORY_ICONS[option]}
                    label={ARTIST_CATEGORY_LABELS[option]}
                    hint={CATEGORY_HINTS[option]}
                    onSelect={() => setValue("category", option)}
                  />
                ))}
              </fieldset>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" onClick={() => setStep(2)}>
                  Continuar
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(0)}>
                  Voltar
                </Button>
              </div>
            </>
          )}

          {step === lastStep && step > 0 && (
            <>
              <div className="flex flex-col gap-2.5">
                <h1 className="font-display text-4xl uppercase leading-none text-fg sm:text-5xl">Escolha seu link</h1>
                <p className="text-[17px] leading-relaxed text-fg-muted">
                  {isAgency
                    ? "É o endereço da página da produtora. Cada artista ganha o próprio link depois."
                    : "É o endereço que você vai mandar para contratantes e colocar na bio."}
                </p>
              </div>
              <div>
                <label htmlFor="slug" className="mb-2 block text-sm font-bold text-fg">
                  {isAgency ? "Endereço da produtora" : "Endereço do seu presskit"}
                </label>
                <div className="flex min-h-11 w-full items-center rounded-xl border border-white/15 bg-bg px-4 py-3 transition focus-within:border-primary-text focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="text-[15px] text-fg-muted">{SITE_HOST}/</span>
                  <input
                    id="slug"
                    className="w-full bg-transparent text-[15px] text-fg outline-none placeholder:text-fg-muted/70"
                    placeholder={isAgency ? "sua-produtora" : "seu-nome"}
                    autoFocus
                    {...register("slug")}
                  />
                </div>
                <FieldError>{errors.slug?.message}</FieldError>
              </div>
              <FieldError>{serverError}</FieldError>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : isAgency ? "Criar página da produtora" : "Criar meu presskit"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setStep(step - 1)}>
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
                {ARTIST_CATEGORY_LABELS[isAgency ? "PRODUTORA" : category]}
              </p>
              <div className="h-3 w-3/4 rounded bg-white/10" />
              <div className="h-3 w-11/12 rounded bg-white/10" />
              {isAgency ? (
                <div className="mt-1 grid grid-cols-3 gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="aspect-[4/5] rounded-[8px] bg-white/10" />
                  ))}
                </div>
              ) : (
                <div className="mt-1 h-10 rounded-[10px] bg-primary" />
              )}
            </div>
          </div>
        </div>
        <p className="text-sm text-fg-muted">
          {SITE_HOST}/{slug || (isAgency ? "sua-produtora" : "seu-nome")}
        </p>
      </aside>
    </div>
  );
}
