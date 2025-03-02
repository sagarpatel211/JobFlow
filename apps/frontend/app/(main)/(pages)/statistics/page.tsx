"use client";

import { XAxis, YAxis, Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface LeetCodeStats {
  submissionCalendar: Record<string, number>;
}

const fetchLeetCodeStats = async (): Promise<Record<string, number>> => {
  const response = await fetch(`https://leetcode-stats-api.herokuapp.com/funy7rjCsA`);
  const data = (await response.json()) as LeetCodeStats;
  return data.submissionCalendar ?? {};
};

interface ChartData {
  date: string;
  actual: number;
  goal: number;
}

const generateData = (days: number, actual: number[], goal: number[]): ChartData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      actual: actual[i] || 0,
      goal: goal[i] || 4,
    };
  });
};

const generateFakeData = (days: number): ChartData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    return {
      date: date.toISOString().split("T")[0],
      actual: Math.floor(Math.random() * 5),
      goal: 4,
    };
  });
};

interface CustomTooltipPayload {
  value: number;
  payload: {
    date: string;
  };
}

function StatsChart({ data, color }: { data: ChartData[]; color: string }) {
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
}

const StatisticsPage = () => {
  const [leetcodeData, setLeetcodeData] = useState<ChartData[]>([]);
  const [jobsData, setJobsData] = useState<ChartData[]>([]);
  const [behavioralData, setBehavioralData] = useState<ChartData[]>([]);
  const [systemDesignData, setSystemDesignData] = useState<ChartData[]>([]);
  const [timeRange, setTimeRange] = useState<number>(30);

  useEffect(() => {
    const fetchStats = async () => {
      const lcSubmissions = await fetchLeetCodeStats();
      const days = timeRange;
      const actual: number[] = new Array<number>(days).fill(0);
      Object.keys(lcSubmissions).forEach((timestamp) => {
        const ts = Number(timestamp);
        const date = new Date(ts * 1000);
        const index = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
        if (index >= 0 && index < days) {
          actual[days - 1 - index] = lcSubmissions[timestamp];
        }
      });
      setLeetcodeData(generateData(days, actual, new Array<number>(days).fill(4)));
      setJobsData(generateFakeData(days));
      setBehavioralData(generateFakeData(days));
      setSystemDesignData(generateFakeData(days));
    };
    void fetchStats();
  }, [timeRange]);

  return (
    <div className="flex flex-col gap-4 relative p-6">
      <h1 className="text-4xl sticky top-0 z-[10] bg-background/50 backdrop-blur-lg border-b p-6">Statistics</h1>
      <div className="flex gap-2 my-4">
        <Button
          size="sm"
          variant="ghost"
          className={timeRange === 1 ? "bg-primary text-white text-zinc-900" : ""}
          onClick={() => {
            setTimeRange(1);
          }}
        >
          Today
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={timeRange === 7 ? "bg-primary text-white text-zinc-900" : ""}
          onClick={() => {
            setTimeRange(7);
          }}
        >
          Last week
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={timeRange === 30 ? "bg-primary text-white text-zinc-900" : ""}
          onClick={() => {
            setTimeRange(30);
          }}
        >
          Last month
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={timeRange === 180 ? "bg-primary text-white text-zinc-900" : ""}
          onClick={() => {
            setTimeRange(180);
          }}
        >
          Last 6 months
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className={timeRange === 365 ? "bg-primary text-white text-zinc-900" : ""}
          onClick={() => {
            setTimeRange(365);
          }}
        >
          Year
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 bg-background/50 backdrop-blur">
          <h2 className="text-xl mb-2">LeetCode Done</h2>
          <StatsChart data={leetcodeData} color="#ec4899" />
        </Card>
        <Card className="p-4 bg-background/50 backdrop-blur">
          <h2 className="text-xl mb-2">Jobs Applied</h2>
          <StatsChart data={jobsData} color="#60a5fa" />
        </Card>
        <Card className="p-4 bg-background/50 backdrop-blur">
          <h2 className="text-xl mb-2">Behavioral Practice</h2>
          <StatsChart data={behavioralData} color="#a78bfa" />
        </Card>
        <Card className="p-4 bg-background/50 backdrop-blur">
          <h2 className="text-xl mb-2">System Design</h2>
          <StatsChart data={systemDesignData} color="#f97316" />
        </Card>
      </div>
    </div>
  );
};

export default StatisticsPage;
