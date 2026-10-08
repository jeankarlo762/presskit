import { z } from "zod";
import { FEEDBACK_STATUSES, FEEDBACK_TYPES, type FeedbackStatus, type FeedbackType } from "../constants/feedback";
import { httpUrlSchema } from "./url";

export const feedbackCreateSchema = z.object({
  type: z.enum(FEEDBACK_TYPES),
  rating: z.number().int().min(1).max(5).optional(),
  message: z.string().trim().min(10, "conte um pouco mais (mínimo 10 caracteres)").max(2000),
  pageUrl: httpUrlSchema.optional(),
});
export type FeedbackCreateInput = z.infer<typeof feedbackCreateSchema>;

export const adminFeedbackUpdateSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  adminNote: z.string().trim().max(2000).nullable().optional(),
});
export type AdminFeedbackUpdateInput = z.infer<typeof adminFeedbackUpdateSchema>;

export type FeedbackRow = {
  id: string;
  type: FeedbackType;
  rating: number | null;
  message: string;
  pageUrl: string | null;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};
