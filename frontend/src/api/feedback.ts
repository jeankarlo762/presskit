import { api } from "./axios";
import type { FeedbackCreateInput, FeedbackRow } from "@presskit/shared";

export async function sendFeedback(input: FeedbackCreateInput) {
  const { data } = await api.post<{ feedback: FeedbackRow }>("/feedback", input);
  return data.feedback;
}

export async function fetchMyFeedback() {
  const { data } = await api.get<{ feedback: FeedbackRow[] }>("/feedback/mine");
  return data.feedback;
}
