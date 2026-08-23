import { Container, GradientButton } from "./ui";
import { GlitchText } from "./GlitchText";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden border-t border-border py-28">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[130px]"
        style={{ background: "radial-gradient(closest-side, var(--magenta), transparent)" }}
        aria-hidden
      />
      <Container className="relative flex flex-col items-center text-center">
        <h2 className="font-[family-name:var(--font-display)] text-5xl uppercase leading-[0.95] tracking-tight sm:text-6xl md:text-7xl">
          Seu som merece um <GlitchText text="material à altura" className="text-gradient-brand" />
        </h2>
        <p className="mt-6 max-w-md font-[family-name:var(--font-body)] text-base text-fg-muted">
          Cria seu press kit agora e manda pra próxima oportunidade hoje mesmo.
        </p>
        <GradientButton href="#planos" className="mt-10">
          Criar meu press kit
        </GradientButton>
      </Container>
    </section>
  );
}
