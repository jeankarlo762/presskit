import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, CreditCard, ExternalLink } from "lucide-react";
import {
  BILLING_CYCLES,
  BILLING_PLAN_LIST,
  BILLING_PLANS,
  cycleTotalCents,
  formatBRL,
  type BillingCycle,
  type MyBilling,
} from "@presskit/shared";
import { cancelMySubscription, fetchMyBilling, startCheckout, syncMyBilling } from "../../api/billing";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { fetchMe } from "../../api/auth";
import { formatDate } from "../../lib/format";
import { Button, Card, FieldError } from "../../components/ui";
import { Badge, ConfirmButton, EmptyState, PageHeader, PaymentBadge, SubscriptionBadge, TableShell } from "../../components/admin/ui";

function cycleFromParam(value: string | null): BillingCycle | null {
  const upper = value?.toUpperCase();
  return BILLING_CYCLES.find((cycle) => cycle === upper) ?? null;
}

export function SubscriptionPage() {
  const [params, setParams] = useSearchParams();
  const setUser = useAuthStore((state) => state.setUser);

  const [billing, setBilling] = useState<MyBilling | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyCycle, setBusyCycle] = useState<BillingCycle | null>(null);
  const [cancelArmed, setCancelArmed] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const highlighted = cycleFromParam(params.get("plano"));
  const returnedFromMp = params.get("retorno") === "mp";

  useEffect(() => {
    let cancelled = false;
    // Coming back from Mercado Pago: force a pull so the page reflects the
    // authorisation even before the webhook lands.
    const load = returnedFromMp ? syncMyBilling() : fetchMyBilling();
    load
      .then(async (result) => {
        if (cancelled) return;
        setBilling(result);
        if (returnedFromMp) {
          setNotice(
            result.subscription?.status === "AUTHORIZED"
              ? "Assinatura confirmada! Seu plano PRO já está ativo."
              : "Recebemos seu retorno do Mercado Pago. A confirmação do pagamento pode levar alguns minutos.",
          );
          setParams({}, { replace: true });
          fetchMe().then(setUser).catch(() => undefined);
        }
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Não foi possível carregar sua assinatura")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubscribe(cycle: BillingCycle) {
    setError(null);
    setBusyCycle(cycle);
    try {
      const { checkoutUrl } = await startCheckout(cycle);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível iniciar o pagamento"));
      setBusyCycle(null);
    }
  }

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const result = await cancelMySubscription();
      setBilling(result);
      setCancelArmed(false);
      setNotice("Assinatura cancelada. Você mantém o acesso PRO até o fim do período já pago.");
      fetchMe().then(setUser).catch(() => undefined);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível cancelar"));
    } finally {
      setCancelling(false);
    }
  }

  const subscription = billing?.subscription ?? null;
  const hasOpenSubscription = subscription !== null && subscription.status !== "CANCELLED";
  const isActive = subscription?.status === "AUTHORIZED";

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={CreditCard}
        title="Assinatura"
        description="Escolha um ciclo, pague pelo Mercado Pago e seu presskit fica no plano PRO."
      />

      {notice && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</p>}
      <FieldError>{error}</FieldError>

      {loading ? (
        <p className="text-sm text-fg-muted">Carregando...</p>
      ) : (
        <>
          <Card className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-medium text-fg">Seu plano</h2>
                <Badge tone={billing?.planKey === "PRO" ? "success" : "neutral"}>{billing?.planKey ?? "FREE"}</Badge>
                {subscription && <SubscriptionBadge status={subscription.status} pastDue={subscription.pastDue} />}
              </div>
              {hasOpenSubscription && (
                <ConfirmButton
                  label="Cancelar assinatura"
                  confirmLabel="Confirmar cancelamento"
                  armed={cancelArmed}
                  onArm={() => setCancelArmed(true)}
                  onDisarm={() => setCancelArmed(false)}
                  onConfirm={handleCancel}
                  disabled={cancelling}
                />
              )}
            </div>

            {!subscription && (
              <p className="text-sm text-fg-muted">
                Você está no plano gratuito. Assine abaixo para liberar todos os recursos do presskit.
              </p>
            )}

            {subscription && (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-fg-muted">Ciclo</dt>
                  <dd className="font-medium text-fg">
                    {BILLING_PLANS[subscription.cycle].label} · {formatBRL(subscription.amountCents)}
                  </dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Próxima cobrança</dt>
                  <dd className="font-medium text-fg">{formatDate(subscription.nextPaymentDate)}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Acesso PRO até</dt>
                  <dd className="font-medium text-fg">{formatDate(subscription.currentPeriodEnd)}</dd>
                </div>
                <div>
                  <dt className="text-fg-muted">Último pagamento</dt>
                  <dd className="font-medium text-fg">{formatDate(subscription.lastChargedAt)}</dd>
                </div>
              </dl>
            )}

            {subscription?.status === "PENDING" && subscription.checkoutUrl && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
                <span>Pagamento ainda não concluído.</span>
                <a
                  href={subscription.checkoutUrl}
                  className="inline-flex items-center gap-1 font-medium underline underline-offset-2"
                >
                  Concluir no Mercado Pago <ExternalLink size={14} />
                </a>
              </div>
            )}

            {subscription?.pastDue && (
              <div className="flex items-start gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Não conseguimos cobrar sua assinatura ({subscription.failedCharges} tentativa
                  {subscription.failedCharges === 1 ? "" : "s"}). Atualize o cartão no Mercado Pago para manter o
                  plano PRO.
                </span>
              </div>
            )}
          </Card>

          {!billing?.checkoutAvailable && (
            <p className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-fg-muted">
              Os pagamentos ainda estão sendo configurados — em breve você poderá assinar por aqui.
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {BILLING_PLAN_LIST.map((plan) => {
              const current = subscription?.cycle === plan.cycle && hasOpenSubscription;
              const emphasized = plan.popular || highlighted === plan.cycle;
              return (
                <Card
                  key={plan.cycle}
                  className={`relative flex flex-col gap-4 ${emphasized ? "border-magenta/60 shadow-[0_0_60px_-20px_rgba(225,29,156,0.5)]" : ""}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-violet to-magenta px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Mais popular
                    </span>
                  )}
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-tight text-fg">{plan.label}</h3>
                    <p className="text-sm text-fg-muted">Ciclo de {plan.months} meses</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-4xl text-fg">{formatBRL(plan.monthlyPriceCents)}</span>
                    <span className="text-sm text-fg-muted">/mês</span>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {formatBRL(cycleTotalCents(plan.cycle))} cobrados a cada {plan.months} meses
                    {plan.savingsLabel ? ` · ${plan.savingsLabel}` : ""}
                  </p>
                  <ul className="flex flex-col gap-2 text-sm text-fg-muted">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check size={16} className="mt-0.5 shrink-0 text-violet" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="mt-auto w-full"
                    variant={emphasized ? "primary" : "secondary"}
                    disabled={!billing?.checkoutAvailable || isActive || busyCycle !== null || current}
                    onClick={() => handleSubscribe(plan.cycle)}
                  >
                    {current
                      ? subscription?.status === "PENDING"
                        ? "Aguardando pagamento"
                        : "Plano atual"
                      : busyCycle === plan.cycle
                        ? "Redirecionando..."
                        : isActive
                          ? "Cancele para trocar"
                          : "Assinar"}
                  </Button>
                </Card>
              );
            })}
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="font-medium text-fg">Histórico de pagamentos</h2>
            {billing && billing.payments.length > 0 ? (
              <TableShell>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Forma</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="text-fg-muted">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
                      <td className="font-medium text-fg">{formatBRL(payment.amountCents)}</td>
                      <td className="text-fg-muted">{payment.paymentMethod ?? "—"}</td>
                      <td>
                        <PaymentBadge status={payment.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            ) : (
              <EmptyState>Nenhum pagamento ainda.</EmptyState>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
