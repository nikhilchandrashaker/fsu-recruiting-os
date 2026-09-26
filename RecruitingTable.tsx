"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { Player } from "@/lib/types";

type SortKey = "overallFit" | "momentum" | "compositeRating" | "nationalRank";

export default function RecruitingTable({ players }: { players: Player[] }) {
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState("ALL");
  const [offerFilter, setOfferFilter] = useState<"ALL" | "OFFERED" | "UNOFFERED">("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("overallFit");

  const positions = useMemo(
    () => ["ALL", ...Array.from(new Set(players.map((p) => p.position)))],
    [players]
  );

  const filtered = useMemo(() => {
    return players
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .filter((p) => position === "ALL" || p.position === position)
      .filter((p) => {
        if (offerFilter === "OFFERED") return p.fsuOffered;
        if (offerFilter === "UNOFFERED") return !p.fsuOffered;
        return true;
      })
      .sort((a, b) => (sortKey === "nationalRank" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));
  }, [players, query, position, offerFilter, sortKey]);

  return (
    <div className="bg-panel border border-line rounded-lg overflow-hidden">
      <div className="flex flex-wrap gap-2 p-3 border-b border-line bg-panel2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name…"
          className="bg-bg border border-line rounded px-3 py-1.5 text-sm flex-1 min-w-[160px]"
        />
        <select
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="bg-bg border border-line rounded px-2 py-1.5 text-sm"
        >
          {positions.map((p) => (
            <option key={p} value={p}>{p === "ALL" ? "All positions" : p}</option>
          ))}
        </select>
        <select
          value={offerFilter}
          onChange={(e) => setOfferFilter(e.target.value as typeof offerFilter)}
          className="bg-bg border border-line rounded px-2 py-1.5 text-sm"
        >
          <option value="ALL">All offer status</option>
          <option value="OFFERED">FSU offered</option>
          <option value="UNOFFERED">Not yet offered</option>
        </select>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="bg-bg border border-line rounded px-2 py-1.5 text-sm"
        >
          <option value="overallFit">Sort: FSU Fit</option>
          <option value="momentum">Sort: Momentum</option>
          <option value="compositeRating">Sort: Rating</option>
          <option value="nationalRank">Sort: National Rank</option>
        </select>
      </div>

      <table className="w-full text-sm">
        <thead className="text-ink-dim text-xs uppercase tracking-wide">
          <tr className="border-b border-line">
            <th className="text-left font-medium px-4 py-2">Player</th>
            <th className="text-left font-medium px-4 py-2">Pos</th>
            <th className="text-left font-medium px-4 py-2">Rating</th>
            <th className="text-left font-medium px-4 py-2">FSU Fit</th>
            <th className="text-left font-medium px-4 py-2">Momentum</th>
            <th className="text-left font-medium px-4 py-2">FSU Offer</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-none hover:bg-panel2">
              <td className="px-4 py-2.5">
                <Link href={`/players/${p.id}`} className="font-semibold hover:text-gold">
                  {p.name}
                </Link>
                <div className="text-ink-dim text-xs">{p.highSchool}, {p.state}</div>
              </td>
              <td className="px-4 py-2.5">{p.position}</td>
              <td className="px-4 py-2.5">{p.compositeRating.toFixed(1)}</td>
              <td className="px-4 py-2.5 font-semibold text-gold">{p.overallFit}</td>
              <td className={`px-4 py-2.5 ${p.momentum >= 0 ? "text-up" : "text-down"}`}>
                {p.momentum >= 0 ? "▲" : "▼"} {Math.abs(p.momentum)}
              </td>
              <td className="px-4 py-2.5">
                {p.fsuOffered ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#2c4a35] text-up">Offered</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold text-garnet-dim">Fit</span>
                )}
              </td>
            </tr>
          ))}
          {filtered.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-ink-dim">
                No players match those filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
