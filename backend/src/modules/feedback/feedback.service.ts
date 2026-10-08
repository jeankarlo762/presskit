import type { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import type { AdminFeedbackQuery, AdminFeedbackUpdateInput, FeedbackCreateInput, FeedbackRow, Paginated } from "@presskit/shared";

export class FeedbackNotFoundError extends Error {
  constructor() {
    super("Feedback não encontrado");
    this.name = "FeedbackNotFoundError";
  }
}

const feedbackSelect = {
  id: true,
  type: true,
  rating: true,
  message: true,
  pageUrl: true,
  status: true,
  adminNote: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true } },
} satisfies Prisma.FeedbackSelect;

type FeedbackRecord = Prisma.FeedbackGetPayload<{ select: typeof feedbackSelect }>;

function toRow(feedback: FeedbackRecord): FeedbackRow {
  return { ...feedback, createdAt: feedback.createdAt.toISOString() };
}

export async function createFeedback(userId: string, input: FeedbackCreateInput) {
  const feedback = await prisma.feedback.create({ data: { userId, ...input }, select: feedbackSelect });
  return toRow(feedback);
}

export async function listMyFeedback(userId: string) {
  const rows = await prisma.feedback.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: feedbackSelect,
  });
  return rows.map(toRow);
}

export async function listFeedback(query: AdminFeedbackQuery): Promise<Paginated<FeedbackRow>> {
  const where: Prisma.FeedbackWhereInput = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
  const [total, rows] = await Promise.all([
    prisma.feedback.count({ where }),
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      select: feedbackSelect,
    }),
  ]);
  return { total, page: query.page, pageSize: query.pageSize, items: rows.map(toRow) };
}

export async function updateFeedback(id: string, input: AdminFeedbackUpdateInput) {
  const existing = await prisma.feedback.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw new FeedbackNotFoundError();
  const updated = await prisma.feedback.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.adminNote !== undefined ? { adminNote: input.adminNote } : {}),
    },
    select: feedbackSelect,
  });
  return toRow(updated);
}
