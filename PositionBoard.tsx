import type { PositionNeed } from "@/lib/types";

export default function PositionBoard({ needs }: { needs: PositionNeed[] }) {
  return (
    <div className="bg-panel border border-line rounded-lg overflow-hidden">
      <h2 className="px-4 py-3 border-b border-line text-sm flex justify-between font-display">
        🚨 Positions of Need
        <em className="not-italic text-ink-dim text-xs font-sans">2028 class</em>
      </h2>
      {needs.map((n) => (
        <div
          key={n.position}
          className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line last:border-none"
          title={n.rationale}
        >
          <div className="font-display text-sm font-semibold w-14">{n.position}</div>
          <div className="flex items-center gap-2 flex-1">
            <div className="needbar">
              <i style={{ width: `${n.score}%` }} />
            </div>
            <span className="text-ink-dim text-xs w-8 text-right">{n.score}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
