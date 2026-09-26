import Link from "next/link";
import type { Player } from "@/lib/types";

function TrendArrow({ momentum }: { momentum: number }) {
  const positive = momentum >= 0;
  return (
    <span className={positive ? "text-up" : "text-down"}>
      {positive ? "▲" : "▼"} {Math.abs(momentum)}
    </span>
  );
}

export default function PlayerCard({
  player,
  rightSlot,
}: {
  player: Player;
  /** Optional override for the right-hand badge (fit score, need tag, etc). Defaults to momentum. */
  rightSlot?: React.ReactNode;
}) {
  return (
    <Link
      href={`/players/${player.id}`}
      className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-line last:border-none hover:bg-panel2 transition-colors"
    >
      <div>
        <div className="font-display text-sm font-semibold">{player.name}</div>
        <div className="text-ink-dim text-xs">
          {player.position} · {player.gradClass} · {player.highSchool} ({player.state})
        </div>
      </div>
      {rightSlot ?? <TrendArrow momentum={player.momentum} />}
    </Link>
  );
}
