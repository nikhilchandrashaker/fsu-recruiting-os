"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { RatingPoint } from "@/lib/types";

export default function TrendChart({ history }: { history: RatingPoint[] }) {
  const data = history.map((h) => ({
    date: new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    rating: h.rating,
  }));

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#3A2D2D" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" stroke="#B8A9A2" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#B8A9A2" fontSize={11} tickLine={false} axisLine={false} domain={["dataMin - 3", "dataMax + 3"]} />
          <Tooltip
            contentStyle={{ background: "#1D1717", border: "1px solid #3A2D2D", borderRadius: 6, fontSize: 12 }}
            labelStyle={{ color: "#B8A9A2" }}
          />
          <Line type="monotone" dataKey="rating" stroke="#C9A66B" strokeWidth={2} dot={{ r: 3, fill: "#C9A66B" }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
