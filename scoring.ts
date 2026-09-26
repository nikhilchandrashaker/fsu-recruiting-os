// FSU Fit Score + explain-this breakdown. Mirrors scoring_engine.py exactly
// so the web app and any backend job produce the same numbers.

export const FOOTBALL_WEIGHTS = {
  talent: 0.25,
  positionNeed: 0.2,
  rosterOpportunity: 0.15,
  schemeFit: 0.15,
  geographicFit: 0.1,
  accessibility: 0.1,
  momentum: 0.05,
} as const;

export type FitInputs = {
  talent: number;
  positionNeed: number;
  rosterOpportunity: number;
  schemeFit: number;
  geographicFit: number;
  accessibility: number;
  momentum: number; // rescaled 0-100
};

export type Recommendation =
  | "priority_target"
  | "offer_candidate"
  | "monitor"
  | "re_evaluate";

export function fsuFitScore(inputs: FitInputs, weights = FOOTBALL_WEIGHTS) {
  const contributions: Record<string, number> = {};
  let overall = 0;
  (Object.keys(weights) as (keyof typeof weights)[]).forEach((key) => {
    const value = Math.round(inputs[key] * weights[key] * 100) / 100;
    contributions[key] = value;
    overall += value;
  });
  overall = Math.round(overall * 100) / 100;

  let recommendation: Recommendation = "re_evaluate";
  if (overall >= 88) recommendation = "priority_target";
  else if (overall >= 78) recommendation = "offer_candidate";
  else if (overall >= 60) recommendation = "monitor";

  return { overall, contributions, recommendation };
}

const FACTOR_LABELS: Record<string, string> = {
  talent: "Talent",
  positionNeed: "Position Need",
  rosterOpportunity: "Roster Opportunity",
  schemeFit: "Scheme Fit",
  geographicFit: "Geographic Fit",
  accessibility: "Accessibility",
  momentum: "Momentum",
};

export function explainScore(result: ReturnType<typeof fsuFitScore>) {
  return Object.entries(result.contributions)
    .sort((a, b) => b[1] - a[1])
    .map(([factor, value]) => ({ label: FACTOR_LABELS[factor] ?? factor, value }));
}

// ---- Momentum action bucketing (mirrors momentum_score() thresholds) ----
export function momentumAction(total: number) {
  if (total <= -15) return "re_evaluate";
  if (total < 0) return "monitor_decline";
  if (total >= 15) return "escalate";
  return "steady";
}

// ----------------------------------------------------------------
// ROSTER NEED MATRIX — depth chart -> Position Need Score
// Mirrors calculate_need_score() in scoring_engine.py exactly.
// ----------------------------------------------------------------
export type RosterPlayer = {
  playerId: string;
  name: string;
  position: string;
  depthChartPosition: number; // 1 = starter, 2 = backup, 3+ = deep bench
  classYear: "Freshman" | "Sophomore" | "Junior" | "Senior" | "5th-Year";
  projectedDepartureYear: number | null; // recruiting cycle expected gone by, or null
  departureProbability: number; // 1.0 = certain, lower = a guess
  departureReason?: "graduation" | "nfl_draft" | "eligibility_exhausted" | "transfer_out";
};

export type NeedResult = {
  position: string;
  targetClass: number;
  healthyStarters: number;
  qualityBackups: number;
  projectedDepartures: number;
  needScore: number;
};

export function calculateNeedScore(roster: RosterPlayer[], position: string, targetClass: number): NeedResult {
  const group = roster.filter((p) => p.position === position);
  const stillHere = (p: RosterPlayer) => p.projectedDepartureYear === null || p.projectedDepartureYear > targetClass;
  const departing = (p: RosterPlayer) => p.projectedDepartureYear !== null && p.projectedDepartureYear <= targetClass;

  const healthyStarters = group.filter((p) => p.depthChartPosition === 1 && stillHere(p)).length;
  const qualityBackups = group.filter((p) => p.depthChartPosition === 2 && stillHere(p)).length;
  const projectedDepartures =
    Math.round(group.filter(departing).reduce((sum, p) => sum + p.departureProbability, 0) * 100) / 100;

  const raw = 100 - (healthyStarters * 20 + qualityBackups * 15 - projectedDepartures * 25);
  const needScore = Math.max(0, Math.min(100, Math.round(raw)));

  return { position, targetClass, healthyStarters, qualityBackups, projectedDepartures, needScore };
}

/** Call whenever a player's status changes (graduates, declares for the draft, enters the
 * portal, etc.) — recompute every affected position x target-class pair. Cheap enough to
 * just recompute all of them rather than diffing what changed. */
export function recalcNeedsOnRosterChange(
  roster: RosterPlayer[],
  positions: string[],
  targetClasses: number[]
): NeedResult[] {
  return positions.flatMap((pos) => targetClasses.map((cls) => calculateNeedScore(roster, pos, cls)));
}
