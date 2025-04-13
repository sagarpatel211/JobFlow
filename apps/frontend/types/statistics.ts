// LeetCode types
export interface LeetCodeStats {
  submissionCalendar: Record<string, number>;
}

// Chart data types
export interface ChartData {
  date: string;
  actual: number;
  goal: number;
}

export interface CustomTooltipPayload {
  value: number;
  payload: {
    date: string;
  };
}

export interface StatsChartProps {
  data: ChartData[];
  color: string;
}
