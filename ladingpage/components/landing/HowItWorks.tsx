import { Container, SectionHeading } from "./ui";

const STEPS = [
  {
    n: "01",
    title: "Monte em 10 minutos",
    body: "Escolha sua categoria, cole seus links do Spotify, SoundCloud e Instagram e o presskit se monta sozinho.",
  },
  {
    n: "02",
    title: "Mande um link por contratante",
    body: "Crie um link para cada casa, agência ou festival e envie pelo WhatsApp ou e-mail em um toque.",
  },
  {
    n: "03",
    title: "Saiba quem abriu",
    body: "Receba um aviso quando o contratante abrir, e veja o que ele ouviu e baixou. Você liga na hora certa.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="border-y border-line bg-band">
      <Container className="flex flex-col gap-10 py-16 sm:py-[72px]">
        <SectionHeading>Do cadastro ao contrato em 3 passos</SectionHeading>
        <ol className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step) => (
            <li key={step.n} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-7">
              <span aria-hidden className="font-display text-[40px] leading-none text-action">
                {step.n}
              </span>
              <h3 className="text-xl font-extrabold">{step.title}</h3>
              <p className="text-[15px] leading-relaxed text-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
