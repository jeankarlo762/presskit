import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, RefreshCw } from "lucide-react";
import {
  BILLING_PLANS,
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_STATUS_LABELS,
  formatBRL,
  type AdminSubscriptionRow,
  type SubscriptionStatus,
} from "@presskit/shared";
import { cancelAdminSubscription, fetchAdminSubscriptions, syncAdminSubscription } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { formatDate } from "../../lib/format";
import { Button, Card, FieldError, Input, Select } from "../../components/ui";
import { ConfirmButton, EmptyState, PageHeader, Pagination, SubscriptionBadge, TableShell, UserCell } from "../../components/admin/ui";

const PAGE_SIZE = 25;

export function AdminSubscriptionsPage({ onlyPastDue = false }: { onlyPastDue?: boolean }) {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SubscriptionStatus | "">(onlyPastDue ? "AUTHORIZED" : "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);

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
      const result = await fetchAdminSubscriptions({
        q: query || undefined,
        status: status || undefined,
        pastDue: onlyPastDue ? "true" : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setRows(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar as assinaturas"));
    } finally {
      setLoading(false);
    }
  }, [query, status, page, onlyPastDue]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await syncAdminSubscription(id);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível sincronizar com o Mercado Pago"));
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancel(id: string) {
    setBusyId(id);
    setError(null);
    try {
      await cancelAdminSubscription(id);
      setArmedId(null);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível cancelar"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, e-mail ou slug"
          className="max-w-sm"
        />
        {!onlyPastDue && (
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as SubscriptionStatus | "");
              setPage(1);
            }}
            className="w-52"
          >
            <option value="">Todos os status</option>
            {SUBSCRIPTION_STATUSES.map((key) => (
              <option key={key} value={key}>
                {SUBSCRIPTION_STATUS_LABELS[key]}
              </option>
            ))}
          </Select>
        )}
        <span className="ml-auto text-sm text-fg-muted">
          {total} {total === 1 ? "assinatura" : "assinaturas"}
        </span>
      </div>

      <FieldError>{error}</FieldError>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>{onlyPastDue ? "Nenhuma assinatura em atraso. 🎉" : "Nenhuma assinatura encontrada."}</EmptyState>
      ) : (
        <TableShell>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Plano</th>
              <th>Status</th>
              <th>Próx. cobrança</th>
              <th>Pago até</th>
              <th>Último pgto</th>
              <th>Falhas</th>
              <th>Criada</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const busy = busyId === s.id;
              return (
                <tr key={s.id} className="align-middle">
                  <td>
                    <Link to={`/admin/usuarios/${s.user.id}`} className="hover:underline">
                      <UserCell user={s.user} />
                    </Link>
                  </td>
                  <td>
                    <span className="flex flex-col">
                      <span className="text-fg">{BILLING_PLANS[s.cycle].label}</span>
                      <span className="text-xs text-fg-muted">{formatBRL(s.amountCents)}</span>
                    </span>
                  </td>
                  <td>
                    <SubscriptionBadge status={s.status} pastDue={s.pastDue} />
                  </td>
                  <td className="text-fg-muted">{formatDate(s.nextPaymentDate)}</td>
                  <td className="text-fg-muted">{formatDate(s.currentPeriodEnd)}</td>
                  <td className="text-fg-muted">{formatDate(s.lastChargedAt)}</td>
                  <td className={s.failedCharges > 0 ? "font-medium text-red-400" : "text-fg-muted"}>{s.failedCharges}</td>
                  <td className="text-fg-muted">{formatDate(s.createdAt)}</td>
                  <td>
                    <span className="flex items-center justify-end gap-1">
                      {s.mpPreapprovalId && (
                        <Button variant="secondary" size="sm" disabled={busy} onClick={() => handleSync(s.id)} title="Sincronizar com o Mercado Pago">
                          <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
                        </Button>
                      )}
                      {s.status !== "CANCELLED" && (
                        <ConfirmButton
                          label="cancelar"
                          confirmLabel="confirmar"
                          armed={armedId === s.id}
                          onArm={() => setArmedId(s.id)}
                          onDisarm={() => setArmedId(null)}
                          onConfirm={() => handleCancel(s.id)}
                          disabled={busy}
                        />
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </Card>
  );
}

export function AdminSubscriptionsRoute() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={CreditCard}
        title="Assinaturas"
        description="Todas as assinaturas do Mercado Pago. Sincronize uma linha para puxar o estado atual da API."
      />
      <AdminSubscriptionsPage />
    </div>
  );
}
