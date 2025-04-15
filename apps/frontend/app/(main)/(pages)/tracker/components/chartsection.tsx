"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import { statuses, statusFillColors } from "@/lib/constants";
import { ChartsSectionProps, CustomTooltipProps } from "@/types/trackerComponents";

const STATUS_KEY_MAP: Record<string, string> = {
  "Nothing Done": "nothing_done",
  Applying: "applying",
  Applied: "applied",
  OA: "OA",
  Interview: "interview",
  Offer: "offer",
  Rejected: "rejected",
};

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-sm p-2 rounded shadow-md">
        <p className="font-semibold">{label}</p>
        {payload.map((entry, index) => (
          <p key={index}>{(entry.name ?? entry.dataKey ?? "") + ": " + String(entry.value)}</p>
        ))}
      </div>
    );
  }
  return null;
};

export const ChartsSection: React.FC<ChartsSectionProps> = ({ statusCounts }) => {
  const statusData = useMemo(
    () =>
      statuses.map((status) => ({
        status,
        count: statusCounts[STATUS_KEY_MAP[status] || ""] || 0,
      })),
    [statusCounts],
  );

  const gradients = useMemo(() => {
    return (
      <>
        {statusData.map((_, index) => (
          <linearGradient key={`gradient-${String(index)}`} id={`gradient-${String(index)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.9} />
            <stop offset="100%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.6} />
          </linearGradient>
        ))}
        {statusData.map((_, index) => (
          <linearGradient
            key={`shimmer-${String(index)}`}
            id={`shimmer-gradient-${String(index)}`}
            x1="0"
            y1="0"
            x2="1"
            y2="0"
            gradientTransform="rotate(45)"
          >
            <stop offset="0%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.6} />
            <stop offset="25%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.8} />
            <stop offset="50%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={1} />
            <stop offset="75%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.8} />
            <stop offset="100%" stopColor={statusFillColors[index] ?? "#000"} stopOpacity={0.6} />
          </linearGradient>
        ))}
      </>
    );
  }, [statusData]);

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
              <span>{statusCounts[STATUS_KEY_MAP[status] || ""] || 0}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-1/2 h-64 border p-2">
        <style jsx global>{`
          @keyframes shimmer {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
          .shimmer-bar {
            background-size: 200% 100%;
            animation: shimmer 2s infinite linear;
          }
        `}</style>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={statusData}>
            <defs>{gradients}</defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="status" />
            <YAxis allowDecimals={false} domain={[0, "auto"]} tickFormatter={(value: number) => String(Math.round(value))} />
            <Tooltip
              content={<CustomTooltip />}
              wrapperStyle={{ backgroundColor: "transparent" }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#fff" }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {statusData.map((_, index) => (
                <Cell key={`cell-${String(index)}`} fill={`url(#shimmer-gradient-${String(index)})`} className="shimmer-bar" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
