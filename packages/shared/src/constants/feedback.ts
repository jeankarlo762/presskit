export const FEEDBACK_TYPES = ["BUG", "SUGESTAO", "ELOGIO", "DUVIDA", "OUTRO"] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];

export const FEEDBACK_TYPE_LABELS: Record<FeedbackType, string> = {
  BUG: "Problema / bug",
  SUGESTAO: "Sugestão",
  ELOGIO: "Elogio",
  DUVIDA: "Dúvida",
  OUTRO: "Outro",
};

export const FEEDBACK_STATUSES = ["NOVO", "EM_ANALISE", "RESOLVIDO"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  RESOLVIDO: "Resolvido",
};
