import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";
import {
  FEEDBACK_STATUSES,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_LABELS,
  type FeedbackRow,
  type FeedbackStatus,
  type FeedbackType,
} from "@presskit/shared";
import { fetchAdminFeedback, updateAdminFeedback } from "../../api/admin";
import { apiErrorMessage } from "../../api/axios";
import { formatDateTime } from "../../lib/format";
import { Button, Card, FieldError, Select, Textarea } from "../../components/ui";
import { EmptyState, FeedbackBadge, PageHeader, Pagination } from "../../components/admin/ui";

const PAGE_SIZE = 20;

function FeedbackCard({ item, onSaved }: { item: FeedbackRow; onSaved: (row: FeedbackRow) => void }) {
  const [note, setNote] = useState(item.adminNote ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteChanged = note.trim() !== (item.adminNote ?? "").trim();

  async function save(patch: { status?: FeedbackStatus; adminNote?: string | null }) {
    setSaving(true);
    setError(null);
    try {
      onSaved(await updateAdminFeedback(item.id, patch));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível salvar"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-fg">{FEEDBACK_TYPE_LABELS[item.type]}</span>
        <FeedbackBadge status={item.status} />
        {item.rating && (
          <span className="inline-flex items-center gap-0.5 text-amber-400">
            {Array.from({ length: item.rating }).map((_, i) => (
              <Star key={i} size={14} className="fill-amber-400" />
            ))}
          </span>
        )}
        <span className="ml-auto text-xs text-fg-muted">{formatDateTime(item.createdAt)}</span>
      </div>
      <p className="whitespace-pre-line text-sm text-fg">{item.message}</p>
      <div className="text-xs text-fg-muted">
        {item.user ? (
          <Link to={`/admin/usuarios/${item.user.id}`} className="hover:underline">
            {item.user.name} · {item.user.email}
          </Link>
        ) : (
          "usuário removido"
        )}
        {item.pageUrl && <span> · {item.pageUrl}</span>}
      </div>
      <div className="flex flex-col gap-2 border-t border-white/5 pt-3 sm:flex-row sm:items-start">
        <Select
          value={item.status}
          disabled={saving}
          onChange={(e) => save({ status: e.target.value as FeedbackStatus })}
          className="w-44 py-1.5"
        >
          {FEEDBACK_STATUSES.map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_STATUS_LABELS[key]}
            </option>
          ))}
        </Select>
        <div className="flex flex-1 flex-col gap-1">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota interna / resposta visível para o usuário"
            className="py-1.5 text-xs"
          />
          {noteChanged && (
            <Button size="sm" className="self-end" disabled={saving} onClick={() => save({ adminNote: note.trim() || null })}>
              Salvar nota
            </Button>
          )}
        </div>
      </div>
      <FieldError>{error}</FieldError>
    </Card>
  );
}

export function AdminFeedbackPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<FeedbackStatus | "">("");
  const [type, setType] = useState<FeedbackType | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchAdminFeedback({ status: status || undefined, type: type || undefined, page, pageSize: PAGE_SIZE });
      setRows(result.items);
      setTotal(result.total);
      setError(null);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar o feedback"));
    } finally {
      setLoading(false);
    }
  }, [status, type, page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader icon={MessageSquare} title="Feedback dos usuários" description="O que está chegando pela página Feedback do painel." />

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as FeedbackStatus | "");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Todos os status</option>
          {FEEDBACK_STATUSES.map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_STATUS_LABELS[key]}
            </option>
          ))}
        </Select>
        <Select
          value={type}
          onChange={(e) => {
            setType(e.target.value as FeedbackType | "");
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">Todos os tipos</option>
          {FEEDBACK_TYPES.map((key) => (
            <option key={key} value={key}>
              {FEEDBACK_TYPE_LABELS[key]}
            </option>
          ))}
        </Select>
        <span className="ml-auto text-sm text-fg-muted">{total} {total === 1 ? "item" : "itens"}</span>
      </div>

      <FieldError>{error}</FieldError>

      {loading ? (
        <EmptyState>Carregando...</EmptyState>
      ) : rows.length === 0 ? (
        <EmptyState>Nenhum feedback com esses filtros.</EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((item) => (
            <FeedbackCard
              key={item.id}
              item={item}
              onSaved={(row) => setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))}
            />
          ))}
        </div>
      )}

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onChange={setPage} />
    </div>
  );
}
