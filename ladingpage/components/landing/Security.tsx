import { Fingerprint, Lock, RefreshCcw, ShieldCheck } from "lucide-react";
import { Container, Eyebrow, SectionHeading } from "./ui";

const POINTS = [
  { icon: Lock, title: "Criptografia ponta a ponta", body: "Dados protegidos em trânsito e em repouso." },
  { icon: Fingerprint, title: "Autenticação em duas etapas", body: "2FA disponível pra toda conta, sem custo extra." },
  { icon: ShieldCheck, title: "Seu material, sua propriedade", body: "Marca d'água em preview e controle de quem baixa o arquivo original." },
  { icon: RefreshCcw, title: "Backup automático", body: "Seus dados e material replicados — nunca dependem de uma coisa só." },
];

export function Security() {
  return (
    <section id="seguranca" className="border-t border-border py-24">
      <Container>
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-2 lg:items-center">
          <div>
            <Eyebrow>segurança</Eyebrow>
            <SectionHeading>
              Seu material é <span className="text-gradient-brand">seu</span>. Ponto.
            </SectionHeading>
            <p className="mt-6 max-w-md font-[family-name:var(--font-body)] text-sm leading-relaxed text-fg-muted">
              Tratamos segurança como parte da marca, não só como exigência técnica — em conformidade com a
              LGPD, com consentimento claro de uso de dados e exclusão sob solicitação a qualquer momento.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {POINTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-bg-elevated p-6">
                <Icon size={22} className="text-magenta" strokeWidth={2} />
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-base uppercase tracking-tight">
                  {title}
                </h3>
                <p className="mt-1.5 font-[family-name:var(--font-body)] text-xs leading-relaxed text-fg-muted">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
