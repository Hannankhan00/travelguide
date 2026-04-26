"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
  name:  string;
  value: number;
}

const COLORS: Record<string, string> = {
  Pending:   "#F59E0B",
  Confirmed: "#15803D",
  Completed: "#1B6FA8",
  Cancelled: "#DC2626",
  "No Show": "#A8A29E",
};

const FALLBACK_COLORS = ["#C41230", "#1B2847", "#D4AF37", "#7A746D", "#E4E0D9"];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white border border-[#E4E0D9] rounded-xl shadow-lg px-4 py-2.5 text-sm">
      <p className="font-semibold text-[#111]">{name}</p>
      <p className="text-xs text-[#7A746D]">{value} booking{value !== 1 ? "s" : ""}</p>
    </div>
  );
}

export function BookingStatusChart({ data }: { data: DataPoint[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-52 text-sm text-[#A8A29E]">
        No bookings yet.
      </div>
    );
  }

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-2 space-y-2">
        {data.map((entry, i) => {
          const color = COLORS[entry.name] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length];
          const pct   = ((entry.value / total) * 100).toFixed(0);
          return (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                <span className="text-[#545454]">{entry.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#111]">{entry.value}</span>
                <span className="text-[#A8A29E] w-8 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
