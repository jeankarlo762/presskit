import { useEffect, useState } from "react";
import { MessageSquare, Star } from "lucide-react";
import {
  FEEDBACK_TYPES,
  FEEDBACK_TYPE_LABELS,
  feedbackCreateSchema,
  type FeedbackCreateInput,
  type FeedbackRow,
  type FeedbackType,
} from "@presskit/shared";
import { fetchMyFeedback, sendFeedback } from "../../api/feedback";
import { apiErrorMessage } from "../../api/axios";
import { formatDate } from "../../lib/format";
import { Button, Card, FieldError, Label, Select, Textarea } from "../../components/ui";
import { FeedbackBadge, PageHeader } from "../../components/admin/ui";

function Stars({ value, onChange }: { value: number | undefined; onChange?: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          disabled={!onChange}
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          className="disabled:cursor-default"
        >
          <Star
            size={18}
            className={value !== undefined && n <= value ? "fill-amber-400 text-amber-400" : "text-fg-muted/40"}
          />
        </button>
      ))}
    </div>
  );
}

export function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("SUGESTAO");
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<FeedbackRow[]>([]);

  useEffect(() => {
    fetchMyFeedback().then(setHistory).catch(() => undefined);
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSent(false);
    const input: FeedbackCreateInput = { type, message: message.trim(), ...(rating ? { rating } : {}) };
    const parsed = feedbackCreateSchema.safeParse(input);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Confira o formulário");
      return;
    }
    setSending(true);
    try {
      const created = await sendFeedback(parsed.data);
      setHistory((prev) => [created, ...prev]);
      setMessage("");
      setRating(undefined);
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível enviar"));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        icon={MessageSquare}
        title="Feedback"
        description="Achou um problema, tem uma ideia ou quer elogiar? Isso vai direto para quem cuida da ferramenta."
      />

      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Tipo</Label>
            <Select value={type} onChange={(e) => setType(e.target.value as FeedbackType)}>
              {FEEDBACK_TYPES.map((option) => (
                <option key={option} value={option}>
                  {FEEDBACK_TYPE_LABELS[option]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Como está sua experiência? (opcional)</Label>
            <div className="py-2.5">
              <Stars value={rating} onChange={setRating} />
            </div>
          </div>
        </div>
        <div>
          <Label>Mensagem</Label>
          <Textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={2000}
            placeholder="Conte o que aconteceu ou o que você gostaria de ver..."
          />
          <p className="mt-1 text-right text-xs text-fg-muted">{message.length}/2000</p>
        </div>
        <FieldError>{error}</FieldError>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={sending}>
            {sending ? "Enviando..." : "Enviar feedback"}
          </Button>
          {sent && <span className="text-sm text-emerald-400">Recebido — obrigado!</span>}
        </div>
      </Card>

      {history.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium text-fg">Seus envios</h2>
          <ul className="flex flex-col divide-y divide-white/5">
            {history.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 py-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-fg">{FEEDBACK_TYPE_LABELS[item.type]}</span>
                  <FeedbackBadge status={item.status} />
                  {item.rating && <Stars value={item.rating} />}
                  <span className="ml-auto text-xs text-fg-muted">{formatDate(item.createdAt)}</span>
                </div>
                <p className="whitespace-pre-line text-fg-muted">{item.message}</p>
                {item.adminNote && (
                  <p className="rounded-xl bg-violet/10 px-3 py-2 text-xs text-violet">Resposta: {item.adminNote}</p>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
