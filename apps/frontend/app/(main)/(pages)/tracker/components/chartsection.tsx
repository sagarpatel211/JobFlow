"use client";
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { statuses, statusFillColors } from "@/lib/constants";

interface ChartsSectionProps {
  statusCounts: Record<string, number>;
}

interface CustomTooltipPayload {
  name?: string;
  dataKey?: string;
  value?: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayload[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-sm p-2 rounded shadow-md">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index}>
            {`${entry.name ?? entry.dataKey ?? ""}: ${String(entry.value)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ statusCounts }) => {
  const statusKeyMap: Record<string, string> = {
    "Nothing Done": "nothingDone",
    "Applying": "applying",
    "Applied": "applied",
    "OA": "OA",
    "Interview": "interview",
    "Offer": "offer",
    "Rejected": "rejected",
  };

  const statusData = statuses.map((status) => ({
    status,
    count: statusCounts[statusKeyMap[status]] || 0,
  }));

  return (
    <div className="flex gap-4 mt-8 px-4">
      <div className="w-1/2">
        <div className="flex flex-wrap gap-3">
          {statuses.map((status, index) => (
            <div
              key={status}
              className="flex items-center justify-between px-4 py-3 rounded-md text-lg font-semibold text-white"
              style={{
                background: `linear-gradient(to right, #000, ${statusFillColors[index] ?? "#000"})`,
                minWidth: "40%",
                flex: "1 1 45%",
              }}
            >
              <span>{status}</span>
              <span>{statusCounts[statusKeyMap[status]] || 0}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/2 h-64 border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <defs>
              {statusData.map((_, index) => (
                <linearGradient
                  key={String(index)}
                  id={`gradient-${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={statusFillColors[index] ?? "#000"}
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="100%"
                    stopColor={statusFillColors[index] ?? "#000"}
                    stopOpacity={0.6}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis
              allowDecimals={false}
              domain={[0, "auto"]}
              tickFormatter={(value: number) => String(Math.round(value))}
            />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ backgroundColor: "transparent" }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {statusData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`url(#gradient-${index})`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
