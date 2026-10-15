import { Check } from "lucide-react";
import { BILLING_PLAN_LIST, cycleTotalCents, type BillingPlan } from "@presskit/shared";
import { ButtonLink, Container, SectionHeading } from "./ui";
import { DASHBOARD_SIGNUP_URL } from "../../lib/urls";

/** "R$ 59" for whole amounts, "R$ 59,90" otherwise — the cards read cleaner without ",00". */
function formatPrice(cents: number): string {
  const whole = cents % 100 === 0;
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  });
}

function cycleSummary(plan: BillingPlan): string {
  const total = formatPrice(cycleTotalCents(plan.cycle));
  const period = plan.months === 12 ? "por ano" : `a cada ${plan.months} meses`;
  return [`${total} ${period}`, plan.savingsLabel].filter(Boolean).join(" · ");
}

export function Pricing() {
  return (
    <section id="planos" className="border-t border-line bg-band">
      <Container className="flex flex-col gap-8 py-16 sm:py-[72px]">
        <div className="flex flex-col gap-2.5">
          <SectionHeading>Um show paga o ano inteiro</SectionHeading>
          <p className="text-[17px] text-soft">
            Comece com 14 dias de PRO grátis. Depois escolha o plano, no Pix ou no cartão.
          </p>
        </div>

        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {BILLING_PLAN_LIST.map((plan) => (
            <li
              key={plan.cycle}
              className={`flex flex-col gap-3.5 rounded-[18px] bg-surface p-7 ${
                plan.popular ? "border-2 border-action" : "border border-line"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-extrabold">{plan.label}</h3>
                {plan.popular && (
                  <span className="rounded-full bg-action px-2.5 py-1 text-xs font-extrabold text-white">
                    Mais escolhido
                  </span>
                )}
              </div>
              <p className="flex items-baseline gap-1.5">
                <span className="font-display text-[52px] leading-none">{formatPrice(plan.monthlyPriceCents)}</span>
                <span className="text-[15px] text-muted">/mês</span>
              </p>
              <p className="text-sm text-muted">{cycleSummary(plan)}</p>
              <ButtonLink
                href={`${DASHBOARD_SIGNUP_URL}?plano=${plan.cycle.toLowerCase()}`}
                variant={plan.popular ? "primary" : "outline"}
                aria-label={`Começar teste grátis — plano ${plan.label.toLowerCase()}`}
              >
                Começar teste grátis
              </ButtonLink>
              <ul className="flex flex-col gap-2 text-sm text-soft">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>

        <p className="text-sm text-muted">
          Plano grátis disponível para sempre, com marca d&apos;água e 1 link rastreável.
        </p>
      </Container>
    </section>
  );
}
