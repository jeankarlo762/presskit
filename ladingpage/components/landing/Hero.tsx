import { Container, GradientButton } from "./ui";
import { Waveform } from "./Waveform";
import { GlitchText } from "./GlitchText";

export function Hero() {
  return (
    <section id="topo" className="relative overflow-hidden pb-24 pt-40 sm:pt-48">
      <div
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(closest-side, var(--violet), transparent)" }}
        aria-hidden
      />
      <Container className="relative flex flex-col items-center text-center">
        <p className="mb-6 rounded-full border border-white/15 px-4 py-1.5 font-[family-name:var(--font-body)] text-xs font-semibold uppercase tracking-[0.2em] text-fg-muted">
          press kit com IA, feito pra sua música
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-6xl uppercase leading-[0.9] tracking-tight sm:text-7xl md:text-8xl">
          Seu press kit
          <br />
          <GlitchText text="pronto em minutos" className="text-gradient-brand" />
        </h1>
        <p className="mt-8 max-w-xl font-[family-name:var(--font-editorial)] text-xl italic text-fg-muted sm:text-2xl">
          com a cara da sua música.
        </p>
        <p className="mt-6 max-w-lg font-[family-name:var(--font-body)] text-base text-fg-muted">
          Bio, discografia, fotos, métricas e contato — gerado automaticamente, editável, pronto pra
          negociar show, parceria e patrocínio.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <GradientButton href="#planos">Criar meu press kit</GradientButton>
          <GradientButton href="#como-funciona" variant="outline">
            Ver como funciona
          </GradientButton>
        </div>
        <Waveform className="mt-20 w-full max-w-2xl opacity-70" />
      </Container>
    </section>
  );
}
