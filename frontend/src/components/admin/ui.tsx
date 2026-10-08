import type { ComponentType, ReactNode } from "react";
import {
  FEEDBACK_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type FeedbackStatus,
  type PaymentStatus,
  type SubscriptionStatus,
} from "@presskit/shared";
import { Button, Card } from "../ui";

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <Icon className="text-violet" size={24} />
        <div>
          <h1 className="text-lg font-semibold text-fg">{title}</h1>
          {description && <p className="text-sm text-fg-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</span>
      <span className="font-display text-3xl text-fg">{value}</span>
      {hint && <span className="text-xs text-fg-muted">{hint}</span>}
    </Card>
  );
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-white/5 text-fg-muted",
  success: "bg-emerald-500/10 text-emerald-400",
  warning: "bg-amber-500/10 text-amber-400",
  danger: "bg-red-500/10 text-red-400",
  info: "bg-violet/15 text-violet",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASS[tone]}`}>
      {children}
    </span>
  );
}

export function SubscriptionBadge({ status, pastDue }: { status: SubscriptionStatus; pastDue: boolean }) {
  if (status === "AUTHORIZED" && pastDue) return <Badge tone="danger">Em atraso</Badge>;
  const tone: Tone =
    status === "AUTHORIZED" ? "success" : status === "PENDING" ? "warning" : status === "PAUSED" ? "info" : "neutral";
  return <Badge tone={tone}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const tone: Tone =
    status === "APPROVED"
      ? "success"
      : status === "REJECTED" || status === "CHARGED_BACK"
        ? "danger"
        : status === "REFUNDED" || status === "CANCELLED"
          ? "neutral"
          : "warning";
  return <Badge tone={tone}>{PAYMENT_STATUS_LABELS[status]}</Badge>;
}

export function FeedbackBadge({ status }: { status: FeedbackStatus }) {
  const tone: Tone = status === "NOVO" ? "warning" : status === "EM_ANALISE" ? "info" : "success";
  return <Badge tone={tone}>{FEEDBACK_STATUS_LABELS[status]}</Badge>;
}

export function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm [&_tbody_td]:px-3 [&_tbody_td]:py-3 [&_tbody_tr]:border-t [&_tbody_tr]:border-white/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-fg-muted">
        {children}
      </table>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-fg-muted">{children}</p>;
}

export function Pagination({
  page,
  total,
  pageSize,
  onChange,
}: {
  page: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 text-sm text-fg-muted">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        anterior
      </Button>
      <span>
        {page} / {totalPages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        próxima
      </Button>
    </div>
  );
}

/** Two-step destructive action without a native confirm() dialog. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  armed,
  onArm,
  onDisarm,
  disabled,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  armed: boolean;
  onArm: () => void;
  onDisarm: () => void;
  disabled?: boolean;
}) {
  if (!armed) {
    return (
      <Button variant="ghost" size="sm" onClick={onArm} disabled={disabled}>
        {label}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button variant="danger" size="sm" onClick={onConfirm} disabled={disabled}>
        {confirmLabel}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDisarm} disabled={disabled}>
        voltar
      </Button>
    </span>
  );
}

export function UserCell({ user }: { user: { id: string; name: string; email: string } }) {
  return (
    <div className="flex flex-col">
      <span className="font-medium text-fg">{user.name}</span>
      <span className="text-xs text-fg-muted">{user.email}</span>
    </div>
  );
}
