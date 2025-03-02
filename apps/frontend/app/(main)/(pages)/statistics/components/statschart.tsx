"use client";

import { XAxis, YAxis, Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import React from "react";

interface ChartData {
  date: string;
  actual: number;
  goal: number;
}

interface CustomTooltipPayload {
  value: number;
  payload: {
    date: string;
  };
}

const StatsChart = ({ data, color }: { data: ChartData[]; color: string }) => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: "gray" }}
            tickLine={false}
            axisLine={false}
            padding={{ left: 10, right: 10 }}
          />
          <YAxis tick={{ fontSize: 12, fill: "gray" }} tickLine={false} axisLine={false} domain={[0, "dataMax + 1"]} />
          <Tooltip
            content={({ active, payload }) => {
              if (active === true && Array.isArray(payload) && payload.length > 0) {
                const safePayload = payload as CustomTooltipPayload[];
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Value</span>
                        <span className="font-bold text-muted-foreground">{safePayload[0].value}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                        <span className="font-bold">{safePayload[0].payload.date}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line type="monotone" dataKey="actual" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StatsChart;
