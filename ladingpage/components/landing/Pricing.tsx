import { Check } from "lucide-react";
import { BILLING_PLAN_LIST, cycleTotalCents, formatBRL } from "@presskit/shared";
import { Container, Eyebrow, GradientButton, SectionHeading } from "./ui";
import { DASHBOARD_SIGNUP_URL } from "../../lib/urls";

export function Pricing() {
  return (
    <section id="planos" className="border-t border-border py-24">
      <Container>
        <Eyebrow>planos</Eyebrow>
        <SectionHeading className="max-w-2xl">
          Quanto mais tempo, <span className="text-gradient-brand">mais barato</span>
        </SectionHeading>
        <p className="mt-4 max-w-lg font-[family-name:var(--font-body)] text-sm text-fg-muted">
          Sem taxa escondida. Renovação automática pelo Mercado Pago, cancelamento simples, e você decide o que
          acontece com seu press kit se o plano expirar.
        </p>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {BILLING_PLAN_LIST.map((plan) => (
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
                {plan.label}
              </h3>
              <p className="mt-1 text-sm text-fg-muted">Ciclo de {plan.months} meses</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-[family-name:var(--font-display)] text-5xl">
                  {formatBRL(plan.monthlyPriceCents)}
                </span>
                <span className="text-sm text-fg-muted">/mês</span>
              </div>
              <p className="mt-1 text-xs text-fg-muted">
                {formatBRL(cycleTotalCents(plan.cycle))} a cada {plan.months} meses
              </p>
              {plan.savingsLabel && <p className="mt-1 text-sm font-semibold text-yellow">{plan.savingsLabel}</p>}
              <ul className="mt-6 flex flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-fg-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-violet" />
                    {feature}
                  </li>
                ))}
              </ul>
              <GradientButton
                href={`${DASHBOARD_SIGNUP_URL}?plano=${plan.cycle.toLowerCase()}`}
                variant={plan.popular ? "solid" : "outline"}
                className="mt-8 w-full"
              >
                Escolher {plan.label.toLowerCase()}
              </GradientButton>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
