"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { RatingPoint } from "@/lib/types";

export default function RankingChart({ history }: { history: RatingPoint[] }) {
  const data = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rank: h.nationalRank,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#3A2D2D" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="#B8A9A2" fontSize={11} tickLine={false} axisLine={false} />
          {/* Reversed: lower national rank (better) renders higher on the chart */}
          <YAxis stroke="#B8A9A2" fontSize={11} tickLine={false} axisLine={false} reversed />
          <Tooltip
            contentStyle={{ background: "#1D1717", border: "1px solid #3A2D2D", borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: "#B8A9A2" }}
            formatter={(value: number) => [`#${value}`, "National Rank"]}
          />
          <Line type="monotone" dataKey="rank" stroke="#5FA876" strokeWidth={2} dot={{ r: 3, fill: "#5FA876" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
