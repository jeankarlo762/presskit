import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Users } from "lucide-react";
import {
  BILLING_PLANS,
  PLAN_KEYS,
  USER_ROLES,
  USER_ROLE_LABELS,
  type AdminUserRow,
  type PlanKey,
  type UserRole,
} from "@presskit/shared";
import { fetchAdminUsers, updateAdminUser } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { publicPresskitUrl } from "../../config";
import { formatDate, formatRelativeDays } from "../../lib/format";
import { Card, FieldError, Input, Select } from "../../components/ui";
import { Badge, EmptyState, PageHeader, Pagination, SubscriptionBadge, TableShell } from "../../components/admin/ui";

const PAGE_SIZE = 25;

export function AdminUsersPage() {
  const me = useAuthStore((state) => state.user);

  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState<PlanKey | "">("");
  const [role, setRole] = useState<UserRole | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminUsers({ q: query || undefined, plan: plan || undefined, role: role || undefined, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setRows(result.items);
        setTotal(result.total);
        setError(null);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Não foi possível carregar os usuários")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, plan, role, page]);

  async function handleChange(user: AdminUserRow, patch: { role?: UserRole; planKey?: PlanKey }) {
    setSavingId(user.id);
    setError(null);
    try {
      const updated = await updateAdminUser(user.id, patch);
      setRows((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar a alteração"));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader icon={Users} title="Usuários" description="Contas da plataforma, papéis, planos e assinaturas." />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou slug"
            className="max-w-sm"
          />
          <Select value={plan} onChange={(e) => { setPlan(e.target.value as PlanKey | ""); setPage(1); }} className="w-36">
            <option value="">Todos os planos</option>
            {PLAN_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </Select>
          <Select value={role} onChange={(e) => { setRole(e.target.value as UserRole | ""); setPage(1); }} className="w-40">
            <option value="">Todos os papéis</option>
            {USER_ROLES.map((key) => (
              <option key={key} value={key}>
                {USER_ROLE_LABELS[key]}
              </option>
            ))}
          </Select>
          <span className="ml-auto text-sm text-fg-muted">
            {total} {total === 1 ? "conta" : "contas"}
          </span>
        </div>

        <FieldError>{error}</FieldError>

        {loading ? (
          <EmptyState>Carregando...</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>Nenhum usuário encontrado.</EmptyState>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Presskit</th>
                <th>Assinatura</th>
                <th>Plano</th>
                <th>Papel</th>
                <th>Último acesso</th>
                <th>Criado em</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((user) => {
                const isMe = user.id === me?.id;
                const saving = savingId === user.id;
                return (
                  <tr key={user.id} className="align-middle">
                    <td>
                      <Link to={`/admin/usuarios/${user.id}`} className="flex flex-col hover:underline">
                        <span className="flex items-center gap-2 font-medium text-fg">
                          {user.name}
                          {isMe && <span className="text-[11px] font-normal text-fg-muted">(você)</span>}
                        </span>
                        <span className="text-xs text-fg-muted">{user.email}</span>
                      </Link>
                    </td>
                    <td>
                      {user.presskit ? (
                        <a
                          href={publicPresskitUrl(user.presskit.slug)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-fg-muted hover:text-fg"
                        >
                          /{user.presskit.slug}
                          <ExternalLink size={12} />
                          <Badge tone={user.presskit.published ? "success" : "neutral"}>
                            {user.presskit.published ? "publicado" : "rascunho"}
                          </Badge>
                          <span className="text-xs">{user.presskit.pageViews} visitas</span>
                        </a>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                    <td>
                      {user.subscription ? (
                        <span className="flex flex-col gap-1">
                          <SubscriptionBadge status={user.subscription.status} pastDue={user.subscription.pastDue} />
                          <span className="text-xs text-fg-muted">{BILLING_PLANS[user.subscription.cycle].label}</span>
                        </span>
                      ) : (
                        <span className="text-fg-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Select
                        value={user.planKey}
                        disabled={saving}
                        onChange={(e) => handleChange(user, { planKey: e.target.value as PlanKey })}
                        className="w-28 py-1.5"
                      >
                        {PLAN_KEYS.map((key) => (
                          <option key={key} value={key}>
                            {key}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td>
                      {isMe ? (
                        <Badge tone="info">{USER_ROLE_LABELS[user.role]}</Badge>
                      ) : (
                        <Select
                          value={user.role}
                          disabled={saving}
                          onChange={(e) => handleChange(user, { role: e.target.value as UserRole })}
                          className="w-36 py-1.5"
                        >
                          {USER_ROLES.map((key) => (
                            <option key={key} value={key}>
                              {USER_ROLE_LABELS[key]}
                            </option>
                          ))}
                        </Select>
                      )}
                    </td>
                    <td className="text-fg-muted">{formatRelativeDays(user.lastLoginAt)}</td>
                    <td className="text-fg-muted">{formatDate(user.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}

        <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
      </Card>
    </div>
  );
}
