import { Container, Eyebrow, SectionHeading } from "./ui";

// Números e depoimentos são placeholders — sem dado real ainda. Trocar por
// métricas reais e depoimentos de artistas de verdade antes de publicar
// (nunca atribuir uma citação a alguém que não disse aquilo).
const STATS = [
  { value: "—", label: "press kits gerados" },
  { value: "—", label: "artistas ativos" },
  { value: "—", label: "selos e assessorias" },
];

export function SocialProof() {
  return (
    <section className="border-t border-border py-24">
      <Container>
        <Eyebrow>quem já usa</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Números que ainda vão <span className="text-gradient-warm">crescer com você</span>
        </SectionHeading>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-border p-8 text-center">
              <p className="font-[family-name:var(--font-display)] text-5xl text-gradient-brand">
                {stat.value}
              </p>
              <p className="mt-2 font-[family-name:var(--font-body)] text-sm text-fg-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex flex-col justify-between rounded-2xl border border-dashed border-white/15 p-6"
            >
              <p className="font-[family-name:var(--font-editorial)] text-sm italic text-fg-muted">
                Espaço reservado pra depoimento de artista real.
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/10" />
                <div>
                  <p className="text-sm font-semibold text-fg-muted">Nome do artista</p>
                  <p className="text-xs text-fg-muted/70">Cidade, estilo</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
