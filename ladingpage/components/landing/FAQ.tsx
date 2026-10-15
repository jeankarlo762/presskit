import { Plus } from "lucide-react";
import { Container, SectionHeading } from "./ui";

const FAQS = [
  {
    q: "Preciso de cartão pra testar?",
    a: "Não. Você cria a conta e ganha 14 dias de PRO grátis, sem cadastrar cartão. No fim do teste, escolhe um plano ou continua no plano grátis.",
  },
  {
    q: "Preciso saber design pra usar?",
    a: "Não. Você escolhe sua categoria, cola seus links e o presskit se monta sozinho — dá pra editar tudo depois se quiser ajustar.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim, o cancelamento é simples e direto no painel, sem burocracia e sem multa.",
  },
  {
    q: "O que acontece com meu presskit se o plano expirar?",
    a: "Nada é apagado. Seu presskit continua no ar no plano grátis, com marca d'água e 1 link rastreável, e os recursos PRO voltam assim que você reativar um plano.",
  },
  {
    q: "Meus dados e material ficam seguros?",
    a: "Sim — criptografia em trânsito e em repouso, backup automático, e conformidade com a LGPD em todo o fluxo.",
  },
  {
    q: "Dá pra usar em mais de um idioma?",
    a: "Dá. Seu presskit pode ser gerado em português, inglês e espanhol.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-line">
      <Container className="flex max-w-[880px] flex-col gap-8 py-16 sm:py-[72px]">
        <SectionHeading>Perguntas frequentes</SectionHeading>
        <div className="flex flex-col gap-3">
          {FAQS.map((item) => (
            <details key={item.q} className="group rounded-2xl border border-line bg-surface">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-extrabold [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus
                  size={22}
                  aria-hidden
                  className="shrink-0 text-accent transition-transform group-open:rotate-45"
                />
              </summary>
              <p className="px-6 pb-6 text-[15px] leading-relaxed text-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
