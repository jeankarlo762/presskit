import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { BILLING_GRACE_DAYS, formatBRL, type AdminPaymentRow } from "@presskit/shared";
import { fetchAdminPayments } from "../../api/admin";
import { formatDateTime } from "../../lib/format";
import { Card } from "../../components/ui";
import { EmptyState, PageHeader, PaymentBadge, TableShell, UserCell } from "../../components/admin/ui";
import { AdminSubscriptionsPage } from "./AdminSubscriptionsPage";

export function AdminDelinquencyPage() {
  const [rejected, setRejected] = useState<AdminPaymentRow[]>([]);

  useEffect(() => {
    fetchAdminPayments({ status: "REJECTED", page: 1, pageSize: 20 })
      .then((result) => setRejected(result.items))
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={AlertTriangle}
        title="Inadimplência"
        description={`Assinaturas ativas cuja cobrança falhou ou está mais de ${BILLING_GRACE_DAYS} dias atrasada. O Mercado Pago tenta cobrar de novo sozinho; o plano volta a PRO assim que um pagamento for aprovado.`}
      />

      <AdminSubscriptionsPage onlyPastDue />

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium text-fg">Cobranças recusadas recentes</h2>
        {rejected.length === 0 ? (
          <EmptyState>Nenhuma cobrança recusada.</EmptyState>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Usuário</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Motivo (MP)</th>
              </tr>
            </thead>
            <tbody>
              {rejected.map((p) => (
                <tr key={p.id}>
                  <td className="text-fg-muted">{formatDateTime(p.createdAt)}</td>
                  <td>
                    <Link to={`/admin/usuarios/${p.user.id}`} className="hover:underline">
                      <UserCell user={p.user} />
                    </Link>
                  </td>
                  <td className="text-fg">{formatBRL(p.amountCents)}</td>
                  <td>
                    <PaymentBadge status={p.status} />
                  </td>
                  <td className="font-mono text-xs text-fg-muted">{p.statusDetail ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
