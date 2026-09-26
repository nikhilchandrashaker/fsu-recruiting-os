"""
FSU Recruiting Intelligence — Scoring Engine (Football, Phase 1)

Two engines:
  1. fsu_fit_score()   -> "should we be recruiting this guy, and how hard"
  2. momentum_score()  -> "is he trending toward FSU or away from us"

Both return a breakdown dict so every number is explainable (see explain_score()).
Weights are per-sport constants at the top — copy this file and retune weights
for basketball / baseball rather than branching inside the functions.
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Optional

# ----------------------------------------------------------------
# 1. FSU FIT SCORE — weights (football). Must sum to 1.0.
# ----------------------------------------------------------------
FOOTBALL_WEIGHTS = {
    "talent": 0.25,
    "position_need": 0.20,
    "roster_opportunity": 0.15,
    "scheme_fit": 0.15,
    "geographic_fit": 0.10,
    "accessibility": 0.10,
    "momentum": 0.05,
}
assert abs(sum(FOOTBALL_WEIGHTS.values()) - 1.0) < 1e-6


@dataclass
class PlayerInputs:
    """Raw 0-100 sub-scores you (or an upstream model) assign per player.
    These come from rating_snapshots + fsu_positional_need + fsu_roster,
    not from a magic black box — each has a documented source below.
    """
    talent: int                 # from composite_rating percentile within position/class
    position_need: int          # from fsu_positional_need.need_score for his grad_class
    roster_opportunity: int     # from fsu_roster projected departures at his position
    scheme_fit: int             # manual coach/analyst input, or archetype match
    geographic_fit: int         # pipeline state/region weighting
    accessibility: int          # inverse of # blue-blood competing offers, distance, etc.
    momentum: float             # output of momentum_score() below, rescaled to 0-100


def fsu_fit_score(p: PlayerInputs, weights: dict = FOOTBALL_WEIGHTS) -> dict:
    """Returns overall score (0-100) plus a per-factor contribution breakdown
    so the UI's 'Explain this' button has real numbers to show."""
    contributions = {
        factor: round(getattr(p, factor) * w, 2)
        for factor, w in weights.items()
    }
    overall = round(sum(contributions.values()), 2)

    if overall >= 88:
        recommendation = "priority_target"
    elif overall >= 78:
        recommendation = "offer_candidate"
    elif overall >= 60:
        recommendation = "monitor"
    else:
        recommendation = "re_evaluate"

    return {
        "overall_score": overall,
        "contributions": contributions,
        "recommendation": recommendation,
    }


# ----------------------------------------------------------------
# 2. MOMENTUM ENGINE — signal-based, not just "rank went up/down"
# ----------------------------------------------------------------
POSITIVE_SIGNALS = {
    "new_major_offer": 4,
    "fsu_visit_scheduled": 5,
    "fsu_visit_completed": 7,
    "fsu_enters_top_schools": 6,
    "positive_fsu_mention": 2,
    "ranking_increase": 3,
    "rating_increase": 3,
    "increased_fsu_interaction": 3,
    "fewer_competing_schools": 2,
    "commitment_flip_toward_fsu": 15,
}
NEGATIVE_SIGNALS = {
    "ranking_decline": -3,
    "fsu_removed_from_top_schools": -8,
    "new_competing_offer": -2,
    "competing_visit_scheduled": -4,
    "fsu_interest_disappears": -10,
    "committed_elsewhere": -25,
    "went_quiet": -2,   # stopped appearing in recruiting reports for 14+ days
}
ALL_SIGNALS = {**POSITIVE_SIGNALS, **NEGATIVE_SIGNALS}


@dataclass
class Signal:
    signal_type: str
    occurred_at: datetime


def momentum_score(signals: list[Signal], as_of: Optional[datetime] = None,
                    window_days: int = 30) -> dict:
    """Sums weighted signals inside the window, with linear recency decay
    (a signal from day 1 of a 30-day window counts ~50%, day 30 counts 100%)."""
    as_of = as_of or datetime.utcnow()
    window_start = as_of - timedelta(days=window_days)

    breakdown = []
    total = 0.0
    for s in signals:
        if s.occurred_at < window_start or s.occurred_at > as_of:
            continue
        base_weight = ALL_SIGNALS.get(s.signal_type, 0)
        age_days = (as_of - s.occurred_at).days
        recency = 0.5 + 0.5 * (1 - age_days / window_days)  # 0.5 .. 1.0
        weighted = round(base_weight * recency, 2)
        total += weighted
        breakdown.append({"signal": s.signal_type, "raw": base_weight,
                           "recency_multiplier": round(recency, 2), "weighted": weighted})

    if total <= -15:
        action = "re_evaluate"
    elif total < 0:
        action = "monitor_decline"
    elif total >= 15:
        action = "escalate"
    else:
        action = "steady"

    return {"window_days": window_days, "total_momentum": round(total, 2),
            "suggested_action": action, "breakdown": breakdown}


# ----------------------------------------------------------------
# 3. ROSTER NEED MATRIX — depth chart -> Position Need Score
# ----------------------------------------------------------------
@dataclass
class RosterPlayer:
    player_id: str
    position: str
    depth_chart_position: int          # 1 = starter, 2 = backup, 3+ = deep bench
    projected_departure_year: Optional[int]   # recruiting cycle they're expected gone by, or None
    departure_probability: float = 1.0        # 1.0 = certain (graduation/eligibility), lower = a guess


def calculate_need_score(roster: list[RosterPlayer], position: str, target_class: int) -> dict:
    """100 - (healthy_starters*20 + quality_backups*15 - projected_departures*25), clamped 0-100.

    'Healthy' / 'quality' means: still expected on the roster for target_class (not departing
    before or during it). 'Projected departures' counts anyone at this position leaving at or
    before target_class, weighted by how certain that departure is.
    """
    group = [p for p in roster if p.position == position]

    def still_here(p: RosterPlayer) -> bool:
        return p.projected_departure_year is None or p.projected_departure_year > target_class

    def departing(p: RosterPlayer) -> bool:
        return p.projected_departure_year is not None and p.projected_departure_year <= target_class

    healthy_starters = sum(1 for p in group if p.depth_chart_position == 1 and still_here(p))
    quality_backups = sum(1 for p in group if p.depth_chart_position == 2 and still_here(p))
    projected_departures = round(sum(p.departure_probability for p in group if departing(p)), 2)

    raw = 100 - (healthy_starters * 20 + quality_backups * 15 - projected_departures * 25)
    need_score = max(0, min(100, round(raw)))

    return {
        "position": position,
        "target_class": target_class,
        "healthy_starters": healthy_starters,
        "quality_backups": quality_backups,
        "projected_departures": projected_departures,
        "need_score": need_score,
    }


def recalc_needs_on_roster_change(roster: list[RosterPlayer], positions: list[str],
                                   target_classes: list[int]) -> list[dict]:
    """Call this whenever a player's status changes (graduates, declares for the draft,
    enters the portal, etc.) — recompute every affected position x target_class pair.
    Cheap enough to just recompute all of them rather than diffing what changed."""
    return [calculate_need_score(roster, pos, cls) for pos in positions for cls in target_classes]


# ----------------------------------------------------------------
# 4. EXPLAIN — human-readable version of a score breakdown
# ----------------------------------------------------------------
def explain_score(fit_result: dict) -> str:
    lines = [f"Overall FSU Fit: {fit_result['overall_score']}  "
             f"({fit_result['recommendation'].replace('_', ' ')})"]
    for factor, val in sorted(fit_result["contributions"].items(), key=lambda x: -x[1]):
        lines.append(f"  {val:+.2f}  {factor.replace('_', ' ')}")
    return "\n".join(lines)


# ----------------------------------------------------------------
# WORKED EXAMPLE
# ----------------------------------------------------------------
if __name__ == "__main__":
    player = PlayerInputs(
        talent=88, position_need=97, roster_opportunity=90,
        scheme_fit=82, geographic_fit=75, accessibility=70, momentum=92,
    )
    fit = fsu_fit_score(player)
    print(explain_score(fit))

    signals = [
        Signal("rating_increase", datetime.utcnow() - timedelta(days=3)),
        Signal("fsu_visit_completed", datetime.utcnow() - timedelta(days=8)),
        Signal("new_competing_offer", datetime.utcnow() - timedelta(days=20)),
    ]
    print(momentum_score(signals))

    print()
    ot_roster = [
        RosterPlayer("p1", "OT", depth_chart_position=1, projected_departure_year=2027, departure_probability=1.0),  # graduating senior starter
        RosterPlayer("p2", "OT", depth_chart_position=1, projected_departure_year=2028, departure_probability=0.6),  # junior, draft-risk starter
        RosterPlayer("p3", "OT", depth_chart_position=2, projected_departure_year=None),                             # underclassman backup, staying
    ]
    print("OT need for 2028 class:", calculate_need_score(ot_roster, "OT", 2028))
