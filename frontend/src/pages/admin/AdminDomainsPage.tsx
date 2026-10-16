import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";
import {
  activateAdminDomain,
  deactivateAdminDomain,
  fetchAdminDomains,
  removeAdminDomain,
  type AdminDomainRow,
} from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { formatDateTime } from "../../lib/format";
import { Button, Card, FieldError } from "../../components/ui";
import { Badge, ConfirmButton, EmptyState, PageHeader, TableShell, UserCell } from "../../components/admin/ui";

export function AdminDomainsPage() {
  const [rows, setRows] = useState<AdminDomainRow[]>([]);
  const [automation, setAutomation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [armedId, setArmedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminDomains();
      setRows(result.domains);
      setAutomation(result.railwayAutomation);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar os domínios"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(id: string, action: () => Promise<unknown>, done?: string) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      await action();
      if (done) setNotice(done);
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, "A ação falhou"));
    } finally {
      setBusyId(null);
      setArmedId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={Globe}
        title="Domínios dos artistas"
        description={
          automation
            ? "Ativar registra o domínio no Railway automaticamente e libera o roteamento."
            : "Ativar libera o roteamento; o domínio ainda precisa ser adicionado ao serviço landing no Railway (RAILWAY_API_TOKEN não configurado)."
        }
      />

      {notice && <p className="rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">{notice}</p>}
      <FieldError>{error}</FieldError>

      <Card className="flex flex-col gap-4">
        {loading ? (
          <EmptyState>Carregando...</EmptyState>
        ) : rows.length === 0 ? (
          <EmptyState>Nenhum artista configurou domínio próprio ainda.</EmptyState>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <th>Domínio</th>
                <th>Artista</th>
                <th>Presskit</th>
                <th>Status</th>
                <th>CNAME esperado</th>
                <th>Atualizado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const busy = busyId === row.presskitId;
                return (
                  <tr key={row.presskitId}>
                    <td className="font-mono text-xs text-fg">{row.domain}</td>
                    <td>
                      <Link to={`/admin/usuarios/${row.user.id}`} className="hover:underline">
                        <UserCell user={row.user} />
                      </Link>
                    </td>
                    <td className="text-fg-muted">
                      /{row.slug}{" "}
                      <Badge tone={row.published ? "success" : "neutral"}>{row.published ? "publicado" : "rascunho"}</Badge>
                    </td>
                    <td>
                      <Badge tone={row.status === "ACTIVE" ? "success" : "warning"}>
                        {row.status === "ACTIVE" ? "ativo" : "pendente"}
                      </Badge>
                    </td>
                    <td className="font-mono text-xs text-fg-muted">{row.cnameTarget}</td>
                    <td className="text-fg-muted">{formatDateTime(row.updatedAt)}</td>
                    <td>
                      <span className="flex items-center justify-end gap-1">
                        {row.status !== "ACTIVE" ? (
                          <Button
                            size="sm"
                            disabled={busy}
                            onClick={() =>
                              run(
                                row.presskitId,
                                () => activateAdminDomain(row.presskitId),
                                automation ? `${row.domain} ativado e registrado no Railway` : `${row.domain} ativado — adicione-o ao serviço landing no Railway`,
                              )
                            }
                          >
                            Ativar
                          </Button>
                        ) : (
                          <Button variant="secondary" size="sm" disabled={busy} onClick={() => run(row.presskitId, () => deactivateAdminDomain(row.presskitId))}>
                            Pausar
                          </Button>
                        )}
                        <ConfirmButton
                          label="remover"
                          confirmLabel="confirmar"
                          armed={armedId === row.presskitId}
                          onArm={() => setArmedId(row.presskitId)}
                          onDisarm={() => setArmedId(null)}
                          onConfirm={() => run(row.presskitId, () => removeAdminDomain(row.presskitId))}
                          disabled={busy}
                        />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Card>
    </div>
  );
}
