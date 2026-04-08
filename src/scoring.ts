import { ProviderState, RoutingPreference } from "./types.js";

export function getProviderErrorRate(state: ProviderState): number {
  const total = state.successCount + state.errorCount + state.timeoutCount;

  if (total === 0) {
    return 0;
  }

  return (state.errorCount + state.timeoutCount) / total;
}

function toLatencyPenalty(state: ProviderState, weight: number): number {
  if (state.avgLatencyMs === null) {
    return weight * 2;
  }

  return Math.max(1, state.avgLatencyMs / 100) * weight;
}

export function computeProviderScore(
  state: ProviderState,
  preference: RoutingPreference,
): number | null {
  if (state.lastKnownSlot === null || state.slotLag === null) {
    return null;
  }

  const errorPenalty = getProviderErrorRate(state) * 55;
  const timeoutPenalty = state.timeoutCount * 2;
  const failurePenalty = state.consecutiveFailures * 7;
  const healthPenalty = state.healthy ? 0 : 70;
  const biasBonus = state.priorityBias;

  switch (preference) {
    case "fastest":
      return (
        state.slotLag * 8 +
        toLatencyPenalty(state, 3.2) +
        errorPenalty +
        timeoutPenalty +
        failurePenalty +
        healthPenalty +
        state.costScore * 1.2 -
        biasBonus
      );
    case "cheapest":
      return (
        state.slotLag * 10 +
        toLatencyPenalty(state, 1.5) +
        errorPenalty +
        timeoutPenalty +
        failurePenalty +
        healthPenalty +
        state.costScore * 14 -
        biasBonus
      );
    case "freshest":
    default:
      return (
        state.slotLag * 18 +
        toLatencyPenalty(state, 1.2) +
        errorPenalty +
        timeoutPenalty +
        failurePenalty +
        healthPenalty +
        state.costScore * 0.8 -
        biasBonus
      );
  }
}
