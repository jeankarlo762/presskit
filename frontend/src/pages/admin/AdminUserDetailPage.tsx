import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, User as UserIcon } from "lucide-react";
import {
  BILLING_PLANS,
  PLAN_KEYS,
  USER_ROLES,
  USER_ROLE_LABELS,
  formatBRL,
  type AdminUserDetail,
  type PlanKey,
  type UserRole,
} from "@presskit/shared";
import { fetchAdminUser, updateAdminUser } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { publicPresskitUrl } from "../../config";
import { formatDate, formatDateTime } from "../../lib/format";
import { Card, FieldError, Select } from "../../components/ui";
import { Badge, EmptyState, PageHeader, PaymentBadge, SubscriptionBadge, TableShell } from "../../components/admin/ui";

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const me = useAuthStore((state) => state.user);
  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchAdminUser(id)
      .then(setUser)
      .catch((err) => setError(apiErrorMessage(err, "Não foi possível carregar o usuário")));
  }, [id]);

  async function handleChange(patch: { role?: UserRole; planKey?: PlanKey }) {
    if (!user) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateAdminUser(user.id, patch);
      setUser({ ...user, ...updated });
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <Link to="/admin/usuarios" className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft size={14} /> Voltar para usuários
      </Link>

      <FieldError>{error}</FieldError>

      {!user ? (
        <EmptyState>{error ? "" : "Carregando..."}</EmptyState>
      ) : (
        <>
          <PageHeader icon={UserIcon} title={user.name} description={user.email} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="flex flex-col gap-3 text-sm">
              <h2 className="font-medium text-fg">Conta</h2>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Papel</span>
                {user.id === me?.id ? (
                  <Badge tone="info">{USER_ROLE_LABELS[user.role]}</Badge>
                ) : (
                  <Select
                    value={user.role}
                    disabled={saving}
                    onChange={(e) => handleChange({ role: e.target.value as UserRole })}
                    className="w-36 py-1.5"
                  >
                    {USER_ROLES.map((key) => (
                      <option key={key} value={key}>
                        {USER_ROLE_LABELS[key]}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Plano</span>
                <Select
                  value={user.planKey}
                  disabled={saving}
                  onChange={(e) => handleChange({ planKey: e.target.value as PlanKey })}
                  className="w-28 py-1.5"
                >
                  {PLAN_KEYS.map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Criado em</span>
                <span className="text-fg">{formatDateTime(user.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Último acesso</span>
                <span className="text-fg">{formatDateTime(user.lastLoginAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-fg-muted">Feedbacks enviados</span>
                <span className="text-fg">{user.feedbackCount}</span>
              </div>
            </Card>

            <Card className="flex flex-col gap-3 text-sm">
              <h2 className="font-medium text-fg">Presskit</h2>
              {user.presskit ? (
                <>
                  <a
                    href={publicPresskitUrl(user.presskit.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-fg hover:underline"
                  >
                    /{user.presskit.slug} <ExternalLink size={12} />
                  </a>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Status</span>
                    <Badge tone={user.presskit.published ? "success" : "neutral"}>
                      {user.presskit.published ? "publicado" : "rascunho"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-fg-muted">Visitas (total)</span>
                    <span className="text-fg">{user.presskit.pageViews}</span>
                  </div>
                </>
              ) : (
                <p className="text-fg-muted">Ainda não criou o presskit.</p>
              )}
            </Card>

            <Card className="flex flex-col gap-3 text-sm">
              <h2 className="font-medium text-fg">Assinatura atual</h2>
              {user.subscription ? (
                <>
                  <SubscriptionBadge status={user.subscription.status} pastDue={user.subscription.pastDue} />
                  <span className="text-fg">{BILLING_PLANS[user.subscription.cycle].label}</span>
                </>
              ) : (
                <p className="text-fg-muted">Sem assinatura aberta.</p>
              )}
            </Card>
          </div>

          <Card className="flex flex-col gap-3">
            <h2 className="font-medium text-fg">Histórico de assinaturas</h2>
            {user.subscriptions.length === 0 ? (
              <EmptyState>Nenhuma assinatura.</EmptyState>
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <th>Ciclo</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Próx. cobrança</th>
                    <th>Pago até</th>
                    <th>Falhas</th>
                    <th>Criada</th>
                    <th>MP</th>
                  </tr>
                </thead>
                <tbody>
                  {user.subscriptions.map((s) => (
                    <tr key={s.id}>
                      <td className="text-fg">{BILLING_PLANS[s.cycle].label}</td>
                      <td>
                        <SubscriptionBadge status={s.status} pastDue={s.pastDue} />
                      </td>
                      <td className="text-fg">{formatBRL(s.amountCents)}</td>
                      <td className="text-fg-muted">{formatDate(s.nextPaymentDate)}</td>
                      <td className="text-fg-muted">{formatDate(s.currentPeriodEnd)}</td>
                      <td className="text-fg-muted">{s.failedCharges}</td>
                      <td className="text-fg-muted">{formatDate(s.createdAt)}</td>
                      <td className="font-mono text-xs text-fg-muted">{s.mpPreapprovalId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="font-medium text-fg">Pagamentos</h2>
            {user.payments.length === 0 ? (
              <EmptyState>Nenhum pagamento.</EmptyState>
            ) : (
              <TableShell>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Detalhe</th>
                    <th>Forma</th>
                    <th>MP</th>
                  </tr>
                </thead>
                <tbody>
                  {user.payments.map((p) => (
                    <tr key={p.id}>
                      <td className="text-fg-muted">{formatDateTime(p.paidAt ?? p.createdAt)}</td>
                      <td className="text-fg">{formatBRL(p.amountCents)}</td>
                      <td>
                        <PaymentBadge status={p.status} />
                      </td>
                      <td className="text-fg-muted">{p.statusDetail ?? "—"}</td>
                      <td className="text-fg-muted">{p.paymentMethod ?? "—"}</td>
                      <td className="font-mono text-xs text-fg-muted">{p.mpPaymentId}</td>
                    </tr>
                  ))}
                </tbody>
              </TableShell>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
