import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, LayoutDashboard, RefreshCw } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BILLING_CYCLES, BILLING_PLANS, formatBRL, type AdminOverview, type DailyPoint } from "@presskit/shared";
import { fetchAdminOverview, runAdminReconcile } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { Button, Card, FieldError } from "../../components/ui";
import { PageHeader, StatCard } from "../../components/admin/ui";

// One series per chart, so one hue per chart is all the colour the data
// needs; values/labels stay in text tokens (recharts tick fill below).
const SERIES_COLOR = "#8b5cf6";
const GRID_COLOR = "rgba(255,255,255,0.06)";
const TICK_COLOR = "#a8a3ad";

function shortDate(iso: string) {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

function TrendChart({
  title,
  data,
  format = (value: number) => String(value),
}: {
  title: string;
  data: DailyPoint[];
  format?: (value: number) => string;
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const gradientId = `grad-${title.replace(/\W+/g, "-").toLowerCase()}`;
  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-medium text-fg">{title}</h3>
        <span className="text-xs text-fg-muted">últimos 30 dias · {format(total)}</span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.35} />
                <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fill: TICK_COLOR, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={6}
            />
            <YAxis
              tick={{ fill: TICK_COLOR, fontSize: 11 }}
              tickFormatter={(value: number) => format(value)}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              width={64}
            />
            <Tooltip
              cursor={{ stroke: TICK_COLOR, strokeWidth: 1, strokeDasharray: "3 3" }}
              contentStyle={{
                background: "#1a1620",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                fontSize: 12,
                color: "#f5f5f5",
              }}
              labelStyle={{ color: TICK_COLOR }}
              labelFormatter={(label) => shortDate(String(label))}
              formatter={(value) => [format(Number(value)), title]}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={SERIES_COLOR}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#121016" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{title}</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{children}</div>
    </section>
  );
}

export function AdminOverviewPage() {
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reconciling, setReconciling] = useState(false);

  const load = useCallback(() => {
    return fetchAdminOverview()
      .then(setData)
      .catch((err) => setError(apiErrorMessage(err, "Não foi possível carregar a visão geral")));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReconcile() {
    setReconciling(true);
    try {
      await runAdminReconcile();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível reconciliar"));
    } finally {
      setReconciling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Visão geral"
        description="Como a ferramenta está funcionando: pessoas, dinheiro e uso."
        actions={
          <Button variant="secondary" size="sm" onClick={handleReconcile} disabled={reconciling}>
            <RefreshCw size={14} className={reconciling ? "animate-spin" : ""} />
            Reconciliar cobranças
          </Button>
        }
      />

      <FieldError>{error}</FieldError>

      {!data ? (
        <p className="text-sm text-fg-muted">{error ? "" : "Carregando..."}</p>
      ) : (
        <>
          {(!data.billing.checkoutConfigured || !data.billing.webhookSecretConfigured) && (
            <div className="flex flex-col gap-1 rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
              {!data.billing.checkoutConfigured && (
                <p className="flex items-center gap-2">
                  <AlertTriangle size={16} /> Mercado Pago sem access token — ninguém consegue assinar ainda.
                </p>
              )}
              {!data.billing.webhookSecretConfigured && (
                <p className="flex items-center gap-2">
                  <AlertTriangle size={16} /> Webhook sem chave secreta — notificações são aceitas sem validar a
                  assinatura (a reconciliação horária continua cobrindo).
                </p>
              )}
            </div>
          )}

          <Section title="Receita">
            <StatCard label="MRR" value={formatBRL(data.billing.mrrCents)} hint="receita mensal recorrente" />
            <StatCard label="Receita 30 dias" value={formatBRL(data.billing.revenueLast30DaysCents)} />
            <StatCard label="Receita total" value={formatBRL(data.billing.revenueTotalCents)} />
            <StatCard
              label="Pagantes"
              value={data.billing.payingUsers}
              hint={`${data.users.total ? Math.round((data.billing.payingUsers / data.users.total) * 100) : 0}% dos usuários`}
            />
          </Section>

          <Section title="Assinaturas">
            <StatCard label="Ativas" value={data.billing.activeSubscriptions} />
            <StatCard
              label="Em atraso"
              value={<span className={data.billing.pastDue > 0 ? "text-red-400" : undefined}>{data.billing.pastDue}</span>}
              hint={<Link to="/admin/inadimplencia" className="hover:underline">ver inadimplência</Link>}
            />
            <StatCard label="Checkouts pendentes" value={data.billing.pendingCheckouts} hint="começaram e não pagaram" />
            <StatCard label="Cancelamentos 30d" value={data.billing.cancelledLast30Days} />
          </Section>

          <Section title="Usuários">
            <StatCard label="Total" value={data.users.total} hint={`${data.users.superadmins} superadmin(s)`} />
            <StatCard label="Novos 7 dias" value={data.users.newLast7Days} />
            <StatCard label="Novos 30 dias" value={data.users.newLast30Days} />
            <StatCard label="Ativos 7 dias" value={data.users.activeLast7Days} hint="fizeram login" />
          </Section>

          <Section title="Produto">
            <StatCard label="Presskits" value={data.presskits.total} />
            <StatCard label="Publicados" value={data.presskits.published} />
            <StatCard label="Visitas 7 dias" value={data.traffic.pageViewsLast7Days} />
            <StatCard label="Visitas 30 dias" value={data.traffic.pageViewsLast30Days} />
          </Section>

          <Section title="Feedback">
            <StatCard
              label="Em aberto"
              value={data.feedback.open}
              hint={<Link to="/admin/feedback" className="hover:underline">ver feedback</Link>}
            />
            <StatCard label="Recebidos 30d" value={data.feedback.last30Days} />
            <StatCard label="Nota média" value={data.feedback.averageRating ?? "—"} hint="de 1 a 5" />
            <Card className="flex flex-col gap-1 p-4">
              <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Ativas por ciclo</span>
              <ul className="mt-1 flex flex-col gap-1 text-sm">
                {BILLING_CYCLES.map((cycle) => (
                  <li key={cycle} className="flex items-center justify-between">
                    <span className="text-fg-muted">{BILLING_PLANS[cycle].label}</span>
                    <span className="font-medium text-fg">{data.billing.byCycle[cycle]}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Section>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
            <TrendChart title="Cadastros" data={data.series.signupsLast30Days} />
            <TrendChart title="Receita" data={data.series.revenueLast30Days} format={formatBRL} />
            <TrendChart title="Visitas aos presskits" data={data.series.pageViewsLast30Days} />
          </div>
        </>
      )}
    </div>
  );
}
