import { Container, Eyebrow, SectionHeading } from "./ui";

const FAQS = [
  {
    q: "Preciso saber design pra usar?",
    a: "Não. Você responde algumas perguntas e a IA monta o texto e o layout — dá pra editar depois se quiser ajustar.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, o cancelamento é simples e direto no painel, sem burocracia e sem multa.",
  },
  {
    q: "O que acontece com meu press kit se o plano expirar?",
    a: "Seu material fica salvo. O link público e algumas funções ficam pausados até você reativar um plano.",
  },
  {
    q: "Meus dados e material ficam seguros?",
    a: "Sim — criptografia em trânsito e em repouso, backup automático, e conformidade com a LGPD em todo o fluxo.",
  },
  {
    q: "Dá pra usar em mais de um idioma?",
    a: "Dá. Seu press kit pode ser gerado em português, inglês e espanhol.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-border py-24">
      <Container className="max-w-3xl">
        <Eyebrow>perguntas frequentes</Eyebrow>
        <SectionHeading>
          Ainda com <span className="text-gradient-brand">dúvida?</span>
        </SectionHeading>
        <div className="mt-12 flex flex-col divide-y divide-border">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-[family-name:var(--font-display)] text-lg uppercase tracking-tight">
                {item.q}
                <span className="ml-4 shrink-0 text-2xl text-fg-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
