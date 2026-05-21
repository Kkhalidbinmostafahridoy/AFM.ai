import type { ProductivityScores } from "./types";

export interface ProductivityInput {
  activeMs: number;
  idleMs: number;
  aiInteractionMs: number;
  creativeMs: number;
  researchMs: number;
  workflowCompleted: number;
  workflowStarted: number;
  aiRequests: number;
  aiFailures: number;
  automationRuns: number;
}

/**
 * AI Productivity Engine — scores focus, creativity, and automation ROI.
 * All scores normalized 0–100 unless noted.
 */
export function computeProductivityScores(
  input: ProductivityInput
): ProductivityScores {
  const total = Math.max(1, input.activeMs + input.idleMs);
  const focusRatio = input.activeMs / total;
  const aiSuccess =
    input.aiRequests > 0
      ? 1 - input.aiFailures / input.aiRequests
      : 1;
  const workflowRate =
    input.workflowStarted > 0
      ? input.workflowCompleted / input.workflowStarted
      : 0;

  const productivityScore = Math.round(
    Math.min(
      100,
      focusRatio * 40 +
        aiSuccess * 30 +
        workflowRate * 20 +
        Math.min(10, input.automationRuns)
    )
  );

  const aiEfficiencyScore = Math.round(
    Math.min(100, aiSuccess * 70 + (input.aiInteractionMs / total) * 30)
  );

  const automationSavingsHours =
    (input.automationRuns * 12 + workflowRate * 8) / 60;
  const estimatedHoursSaved =
    automationSavingsHours + (input.aiInteractionMs / 3_600_000) * 0.15;

  return {
    focusTimeMs: Math.round(input.activeMs * focusRatio),
    creativeTimeMs: input.creativeMs,
    researchTimeMs: input.researchMs,
    productivityScore,
    aiEfficiencyScore,
    workflowCompletionRate: Math.round(workflowRate * 100),
    automationSavingsHours: Math.round(automationSavingsHours * 100) / 100,
    estimatedHoursSaved: Math.round(estimatedHoursSaved * 100) / 100,
  };
}
