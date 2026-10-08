import { useEffect, useState } from "react";
import { ExternalLink, ShieldCheck, Users } from "lucide-react";
import {
  PLAN_KEYS,
  USER_ROLES,
  USER_ROLE_LABELS,
  type AdminStats,
  type AdminUserRow,
  type PlanKey,
  type UserRole,
} from "@presskit/shared";
import { fetchAdminStats, fetchAdminUsers, updateAdminUser } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { useAuthStore } from "../../store/auth.store";
import { publicPresskitUrl } from "../../config";
import { Button, Card, FieldError, Input, Select } from "../../components/ui";

const PAGE_SIZE = 25;

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
      <span className="font-display text-3xl text-fg">{value}</span>
    </Card>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  const superadmin = role === "SUPERADMIN";
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium " +
        (superadmin ? "bg-violet/15 text-violet" : "bg-white/5 text-fg-muted")
      }
    >
      {superadmin && <ShieldCheck size={12} />}
      {USER_ROLE_LABELS[role]}
    </span>
  );
}

export function AdminUsersPage() {
  const me = useAuthStore((state) => state.user);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    fetchAdminStats().then(setStats).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchAdminUsers({ q: query || undefined, page, pageSize: PAGE_SIZE })
      .then((result) => {
        if (cancelled) return;
        setUsers(result.users);
        setTotal(result.total);
        setError(null);
      })
      .catch((err) => !cancelled && setError(apiErrorMessage(err, "Não foi possível carregar os usuários")))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [query, page]);

  // Debounce so every keystroke doesn't hit /admin/users.
  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setQuery(search.trim());
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  async function handleChange(user: AdminUserRow, patch: { role?: UserRole; planKey?: PlanKey }) {
    setSavingId(user.id);
    setError(null);
    try {
      const updated = await updateAdminUser(user.id, patch);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      fetchAdminStats().then(setStats).catch(() => undefined);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar a alteração"));
    } finally {
      setSavingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Users className="text-violet" size={24} />
        <div>
          <h1 className="text-lg font-semibold text-fg">Administração — usuários</h1>
          <p className="text-sm text-fg-muted">Contas da plataforma, papéis e planos.</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="Usuários" value={stats.users} />
          <StatCard label="Superadmins" value={stats.superadmins} />
          <StatCard label="Presskits" value={stats.presskits} />
          <StatCard label="Publicados" value={stats.publishedPresskits} />
          <StatCard label="Visitas (7 dias)" value={stats.pageViewsLast7Days} />
        </div>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, e-mail ou slug"
            className="max-w-sm"
          />
          <span className="text-sm text-fg-muted">
            {total} {total === 1 ? "conta" : "contas"}
          </span>
        </div>

        <FieldError>{error}</FieldError>

        {loading ? (
          <p className="py-8 text-center text-sm text-fg-muted">Carregando...</p>
        ) : users.length === 0 ? (
          <p className="py-8 text-center text-sm text-fg-muted">Nenhum usuário encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-fg-muted">
                <tr className="border-b border-white/5">
                  <th className="px-3 py-2 font-medium">Usuário</th>
                  <th className="px-3 py-2 font-medium">Presskit</th>
                  <th className="px-3 py-2 font-medium">Visitas</th>
                  <th className="px-3 py-2 font-medium">Plano</th>
                  <th className="px-3 py-2 font-medium">Papel</th>
                  <th className="px-3 py-2 font-medium">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => {
                  const isMe = user.id === me?.id;
                  const saving = savingId === user.id;
                  return (
                    <tr key={user.id} className="align-middle">
                      <td className="px-3 py-3">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-2 font-medium text-fg">
                            {user.name}
                            {isMe && <span className="text-[11px] font-normal text-fg-muted">(você)</span>}
                          </span>
                          <span className="text-xs text-fg-muted">{user.email}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        {user.presskit ? (
                          <a
                            href={publicPresskitUrl(user.presskit.slug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-fg-muted hover:text-fg"
                          >
                            /{user.presskit.slug}
                            <ExternalLink size={12} />
                            <span
                              className={
                                "ml-1 rounded-full px-1.5 py-0.5 text-[10px] " +
                                (user.presskit.published ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5")
                              }
                            >
                              {user.presskit.published ? "publicado" : "rascunho"}
                            </span>
                          </a>
                        ) : (
                          <span className="text-fg-muted">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-fg-muted">{user.presskit?.pageViews ?? "—"}</td>
                      <td className="px-3 py-3">
                        <Select
                          value={user.planKey}
                          disabled={saving}
                          onChange={(e) => handleChange(user, { planKey: e.target.value as PlanKey })}
                          className="w-28 py-1.5"
                        >
                          {PLAN_KEYS.map((plan) => (
                            <option key={plan} value={plan}>
                              {plan}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-3 py-3">
                        {isMe ? (
                          <RoleBadge role={user.role} />
                        ) : (
                          <Select
                            value={user.role}
                            disabled={saving}
                            onChange={(e) => handleChange(user, { role: e.target.value as UserRole })}
                            className="w-36 py-1.5"
                          >
                            {USER_ROLES.map((role) => (
                              <option key={role} value={role}>
                                {USER_ROLE_LABELS[role]}
                              </option>
                            ))}
                          </Select>
                        )}
                      </td>
                      <td className="px-3 py-3 text-fg-muted">
                        {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 text-sm text-fg-muted">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              anterior
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              próxima
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
