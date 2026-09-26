import type { NeedResult, RosterPlayer } from "@/lib/scoring";

const DEPARTURE_LABEL: Record<string, string> = {
  graduation: "Graduating",
  nfl_draft: "NFL Draft risk",
  eligibility_exhausted: "Eligibility exhausted",
  transfer_out: "Transfer risk",
};

function slotLabel(n: number) {
  if (n === 1) return "Starter";
  if (n === 2) return "Backup";
  return `${n}-deep`;
}

export default function DepthChart({
  position,
  players,
  need,
}: {
  position: string;
  players: RosterPlayer[];
  need: NeedResult;
}) {
  const sorted = [...players].sort((a, b) => a.depthChartPosition - b.depthChartPosition);
  const barColor = need.needScore >= 80 ? "bg-down" : need.needScore >= 55 ? "bg-gold" : "bg-up";

  return (
    <div className="bg-panel border border-line rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <h3 className="font-display text-lg font-semibold">{position}</h3>
        <div className="flex items-center gap-2">
          <div className="needbar w-24">
            <i className={barColor} style={{ width: `${need.needScore}%`, display: "block", height: "100%" }} />
          </div>
          <span className="text-sm font-semibold text-gold">{need.needScore}</span>
        </div>
      </div>

      <div>
        {sorted.map((p) => (
          <div key={p.playerId} className="flex items-center justify-between px-4 py-2 border-b border-line last:border-none text-sm">
            <div>
              <span className="font-medium">{p.name}</span>
              <span className="text-ink-dim text-xs ml-2">{slotLabel(p.depthChartPosition)} · {p.classYear}</span>
            </div>
            {p.projectedDepartureYear && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#4a2c2c] text-down">
                {DEPARTURE_LABEL[p.departureReason ?? "graduation"]} · {p.projectedDepartureYear}
              </span>
            )}
          </div>
        ))}
        {sorted.length === 0 && <p className="px-4 py-3 text-ink-dim text-sm">No roster data for this position.</p>}
      </div>

      <div className="px-4 py-2.5 bg-panel2 text-xs text-ink-dim flex flex-wrap gap-x-4 gap-y-1">
        <span>Healthy starters: <b className="text-ink">{need.healthyStarters}</b></span>
        <span>Quality backups: <b className="text-ink">{need.qualityBackups}</b></span>
        <span>Projected departures: <b className="text-ink">{need.projectedDepartures}</b></span>
      </div>
    </div>
  );
}
