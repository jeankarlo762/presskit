import { Container, Eyebrow, SectionHeading } from "./ui";

const STEPS = [
  { n: "01", title: "Cadastro", body: "Cria sua conta em menos de um minuto. Sem cartão, sem burocracia." },
  {
    n: "02",
    title: "Preenchimento guiado",
    body: "Responde perguntas curtas — a IA te ajuda a transformar isso em bio e texto de apresentação de verdade.",
  },
  {
    n: "03",
    title: "Geração automática",
    body: "Seu press kit sai pronto, com layout combinando com o seu estilo musical.",
  },
  {
    n: "04",
    title: "Exportação e link",
    body: "Baixa em PDF ou compartilha o link do seu mini-site. Prontinho pra mandar pra quem interessa.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-t border-border py-24">
      <Container>
        <Eyebrow>como funciona</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Do zero ao <span className="text-gradient-brand">press kit pronto</span>
        </SectionHeading>
        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.n} className="relative">
              <span className="font-[family-name:var(--font-display)] text-6xl text-white/10">{step.n}</span>
              <h3 className="mt-2 font-[family-name:var(--font-display)] text-xl uppercase tracking-tight">
                {step.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
                {step.body}
              </p>
              {i < STEPS.length - 1 && (
                <div
                  className="absolute right-[-1.25rem] top-8 hidden h-px w-8 bg-gradient-to-r from-violet to-magenta lg:block"
                  aria-hidden
                />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
