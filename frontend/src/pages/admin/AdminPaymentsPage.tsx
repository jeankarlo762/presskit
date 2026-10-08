import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Receipt, RefreshCw } from "lucide-react";
import {
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  formatBRL,
  type AdminPaymentRow,
  type PaymentStatus,
} from "@presskit/shared";
import { fetchAdminPayments, fetchAdminWebhookEvents, runAdminReconcile, type WebhookEventRow } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { formatDateTime } from "../../lib/format";
import { Button, Card, FieldError, Input, Select } from "../../components/ui";
import { Badge, EmptyState, PageHeader, Pagination, PaymentBadge, TableShell, UserCell } from "../../components/admin/ui";

const PAGE_SIZE = 25;

export function AdminPaymentsPage() {
  const [rows, setRows] = useState<AdminPaymentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<WebhookEventRow[]>([]);
  const [reconciling, setReconciling] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [result, webhookEvents] = await Promise.all([
        fetchAdminPayments({ q: query || undefined, status: status || undefined, page, pageSize: PAGE_SIZE }),
        fetchAdminWebhookEvents(),
      ]);
      setRows(result.items);
      setTotal(result.total);
      setEvents(webhookEvents);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar os pagamentos"));
    } finally {
      setLoading(false);
    }
  }, [query, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReconcile() {
    setReconciling(true);
    setError(null);
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
        icon={Receipt}
        title="Pagamentos"
        description="Cada cobrança registrada a partir do Mercado Pago (webhooks + reconciliação horária)."
        actions={
          <Button variant="secondary" size="sm" onClick={handleReconcile} disabled={reconciling}>
            <RefreshCw size={14} className={reconciling ? "animate-spin" : ""} />
            Reconciliar agora
          </Button>
        }
      />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuário ou id do pagamento"
            className="max-w-sm"
          />
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as PaymentStatus | "");
              setPage(1);
            }}
            className="w-44"
          >
            <option value="">Todos os status</option>
            {PAYMENT_STATUSES.map((key) => (
              <option key={key} value={key}>
                {PAYMENT_STATUS_LABELS[key]}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-sm text-fg-muted">
            {total} {total === 1 ? "pagamento" : "pagamentos"}
          </span>
        </div>

        <FieldError>{error}</FieldError>

        {loading ? (
          <EmptyState>Carregando...</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>Nenhum pagamento registrado.</EmptyState>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Detalhe</th>
                <th>Forma</th>
                <th>ID MP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="text-fg-muted">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                  <td>
                    <Link to={`/admin/usuarios/${p.user.id}`} className="hover:underline">
                      <UserCell user={p.user} />
                    </Link>
                  </td>
                  <td className="font-medium text-fg">{formatBRL(p.amountCents)}</td>
                  <td>
                    <PaymentBadge status={p.status} />
                  </td>
                  <td className="font-mono text-xs text-fg-muted">{p.statusDetail ?? "—"}</td>
                  <td className="text-fg-muted">{p.paymentMethod ?? "—"}</td>
                  <td className="font-mono text-xs text-fg-muted">{p.mpPaymentId}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}

        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>

      <Card className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium text-fg">Webhooks recebidos (últimos 50)</h2>
          <p className="text-sm text-fg-muted">
            Linhas com erro voltam a ser tentadas pelo Mercado Pago automaticamente; "Reconciliar agora" cobre o que ficou para trás.
          </p>
        </div>
        {events.length === 0 ? (
          <EmptyState>Nenhum webhook recebido ainda.</EmptyState>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tópico</th>
                <th>Ação</th>
                <th>ID</th>
                <th>Resultado</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="text-fg-muted">{formatDateTime(e.createdAt)}</td>
                  <td className="text-fg">{e.type}</td>
                  <td className="text-fg-muted">{e.action ?? "—"}</td>
                  <td className="font-mono text-xs text-fg-muted">{e.externalId}</td>
                  <td>
                    {e.processedAt && !e.error ? (
                      <Badge tone="success">processado</Badge>
                    ) : e.processedAt ? (
                      <Badge tone="neutral" >{e.error}</Badge>
                    ) : (
                      <Badge tone="danger">{e.error ?? "pendente"}</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
