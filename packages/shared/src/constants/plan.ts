import type { PlanKey } from "./category";
import { PLAN_LIMITS } from "./category";

export class PlanLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlanLimitError";
  }
}

/**
 * Central place every plan-gated action goes through. It exists from day one
 * (Fase 1) even though billing itself (Fase 5) isn't built yet — until then
 * every account is provisioned as FREE and this simply enforces the FREE
 * limits, so turning PRO on later is a data change, not a new code path.
 */
export function requireWithinGalleryLimit(plan: PlanKey, currentCount: number, limit: number): void {
  if (currentCount >= limit) {
    throw new PlanLimitError(
      `Limite de fotos do plano ${plan} atingido (${limit}). Faça upgrade para adicionar mais.`,
    );
  }
}

export function requireWithinTrackableLinkLimit(plan: PlanKey, currentCount: number): void {
  const limit = PLAN_LIMITS[plan].maxTrackableLinks;
  if (currentCount >= limit) {
    throw new PlanLimitError(
      `Limite de links rastreáveis do plano ${plan} atingido (${limit}). Faça upgrade para criar mais.`,
    );
  }
}
