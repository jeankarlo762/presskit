import { Check } from "lucide-react";
import { Container, Eyebrow, GradientButton, SectionHeading } from "./ui";

// Preços de exemplo — o usuário precisa definir os valores reais antes de publicar.
const PLANS = [
  {
    cycle: "Trimestral",
    period: "3 meses",
    price: 59,
    popular: false,
    features: ["Press kits limitados", "1 template", "Marca d'água leve", "Exportação em PDF"],
  },
  {
    cycle: "Semestral",
    period: "6 meses",
    price: 49,
    popular: true,
    savings: "economize 17%",
    features: [
      "Mais press kits",
      "Múltiplos templates",
      "Domínio próprio",
      "Analytics básico",
      "Sem marca d'água",
    ],
  },
  {
    cycle: "Anual",
    period: "12 meses",
    price: 39,
    popular: false,
    savings: "economize 34%",
    features: [
      "Press kits ilimitados",
      "Todos os templates",
      "Domínio próprio",
      "Analytics avançado",
      "Suporte prioritário",
    ],
  },
];

export function Pricing() {
  return (
    <section id="planos" className="border-t border-border py-24">
      <Container>
        <Eyebrow>planos</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Quanto mais tempo, <span className="text-gradient-brand">mais barato</span>
        </SectionHeading>
        <p className="mt-4 max-w-lg font-[family-name:var(--font-body)] text-sm text-fg-muted">
          Sem taxa escondida. Renovação automática, cancelamento simples, e você decide o que acontece com
          seu press kit se o plano expirar.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.cycle}
              className={`relative rounded-2xl border p-8 ${
                plan.popular
                  ? "border-magenta bg-bg-elevated shadow-[0_0_60px_-20px_rgba(225,29,156,0.5)]"
                  : "border-border bg-bg-elevated/50"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet to-magenta px-4 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Mais popular
                </span>
              )}
              <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
                {plan.cycle}
              </h3>
              <p className="mt-1 text-sm text-fg-muted">Ciclo de {plan.period}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-5xl">R${plan.price}</span>
                <span className="text-sm text-fg-muted">/mês</span>
              </div>
              {plan.savings && (
                <p className="mt-1 text-sm font-semibold text-yellow">{plan.savings}</p>
              )}
              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-fg-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-violet" />
                    {f}
                  </li>
                ))}
              </ul>
              <GradientButton
                href="#"
                variant={plan.popular ? "solid" : "outline"}
                className="mt-8 w-full"
              >
                Escolher {plan.cycle.toLowerCase()}
              </GradientButton>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
