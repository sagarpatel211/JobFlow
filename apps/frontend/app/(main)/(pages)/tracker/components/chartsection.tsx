"use client";
import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { scaleLog } from "d3-scale";
import { statuses, statusFillColors } from "@/lib/constants";

interface ChartsSectionProps {
  statusCounts: Record<string, number>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-sm p-2 rounded shadow-md">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index}>{`${entry.name || entry.dataKey}: ${entry.value}`}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ statusCounts }) => {
  const statusData = statuses.map((status, index) => ({
    status,
    count: Math.max(statusCounts[status] || 0, 1),
  }));

  return (
    <div className="flex gap-4 mt-8 px-4">
      {/* Text Summary Section with gradient background */}
      <div className="w-1/2">
        <div className="flex flex-wrap gap-3">
          {statuses.map((status, index) => (
            <div
              key={status}
              className="flex items-center justify-between px-4 py-3 rounded-md text-lg font-semibold text-white"
              style={{
                background: `linear-gradient(to right, #000, ${statusFillColors[index]})`,
                minWidth: "40%",
                flex: "1 1 45%",
              }}
            >
              <span>{status}</span>
              <span>{statusCounts[status] || 0}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Bar Chart Section remains unchanged */}
      <div className="w-1/2 h-64 border p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <defs>
              {statusData.map((_, index) => (
                <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={statusFillColors[index]} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={statusFillColors[index]} stopOpacity={0.6} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis
              allowDecimals={false}
              scale={scaleLog()}
              domain={[1, "auto"]}
              tickFormatter={(value) => Math.round(value)}
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
