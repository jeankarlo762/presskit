import { Container, Eyebrow, SectionHeading } from "./ui";

const AUDIENCES = [
  { title: "Artista independente", body: "Profissionaliza sua carreira sem depender de gravadora ou agência." },
  { title: "Selo independente", body: "Padroniza o material de todo o roster com a identidade de cada artista preservada." },
  { title: "Assessoria de imprensa", body: "Entrega material pronto pra imprensa em minutos, não em dias." },
  { title: "Produtor e manager", body: "Um press kit atualizado pra cada artista que você representa, sem trabalho manual." },
];

export function Audiences() {
  return (
    <section id="para-quem" className="border-t border-border py-24">
      <Container>
        <Eyebrow>pra quem é</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Feito pra quem vive de <span className="text-gradient-warm">música</span>
        </SectionHeading>
        <div className="mt-14 flex flex-wrap gap-4">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="min-w-[240px] flex-1 rounded-2xl border border-border p-6">
              <h3 className="font-[family-name:var(--font-editorial)] text-xl font-bold italic text-fg">
                {a.title}
              </h3>
              <p className="mt-2 font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
                {a.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
