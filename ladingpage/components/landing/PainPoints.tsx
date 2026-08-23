import { Container, Eyebrow, SectionHeading } from "./ui";

const PAINS = [
  {
    title: "Press kit amador",
    body: "PDF feito no Canva às pressas, sem identidade, que não passa a seriedade que seu trabalho merece.",
  },
  {
    title: "Tempo que você não tem",
    body: "Horas escrevendo bio, organizando foto e link — tempo que devia estar na música, não em planilha.",
  },
  {
    title: "Oportunidade perdida",
    body: "Booker e patrocinador decidem em segundos. Material fraco é show que não rola, parceria que não fecha.",
  },
  {
    title: "Designer custa caro",
    body: "Contratar um material profissional toda vez que sai lançamento novo não cabe no orçamento de quem tá começando.",
  },
];

export function PainPoints() {
  return (
    <section id="a-dor" className="border-t border-border py-24">
      <Container>
        <Eyebrow>o problema</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Seu som já tá pronto. <span className="text-gradient-warm">Seu material, não.</span>
        </SectionHeading>
        <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-2">
          {PAINS.map((pain) => (
            <div key={pain.title} className="bg-bg p-8 sm:bg-bg-elevated">
              <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight text-fg">
                {pain.title}
              </h3>
              <p className="mt-3 font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
                {pain.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
