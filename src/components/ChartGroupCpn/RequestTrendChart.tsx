"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
} from "recharts";
import { apiClient } from "@/lib/api-client";
import { MONTHLY_REQUEST_COUNT } from "@/types/dashboard.type";
import { toast } from "react-toastify";

// Fallback data in case API fails - already in chronological order
const fallbackData = [
  { month: "T7", monthYear: "T7 2023", requestCount: 45 },
  { month: "T8", monthYear: "T8 2023", requestCount: 52 },
  { month: "T9", monthYear: "T9 2023", requestCount: 38 },
  { month: "T10", monthYear: "T10 2023", requestCount: 61 },
  { month: "T11", monthYear: "T11 2023", requestCount: 48 },
  { month: "T12", monthYear: "T12 2023", requestCount: 55 },
];

export default function RequestTrendChart() {
  const [chartData, setChartData] = useState(fallbackData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const getMonthIndex = useCallback((monthAbbr: string): number => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const index = months.findIndex(
      (m) => m.toLowerCase() === monthAbbr.toLowerCase()
    );
    return index !== -1 ? index : 0;
  }, []);

  const parseDateString = useCallback(
    (dateStr: string): Date | null => {
      try {
        // Handle different possible formats
        if (dateStr.match(/^[A-Za-z]{3}\s\d{4}$/)) {
          const [month, year] = dateStr.split(" ");
          const monthIndex = getMonthIndex(month);
          return new Date(parseInt(year), monthIndex, 1);
        } else if (dateStr.match(/^T\d{1,2}\s\d{4}$/)) {
          // Format: "T7 2023" (Vietnamese format)
          const [monthPart, year] = dateStr.split(" ");
          const monthNum = parseInt(monthPart.substring(1)) - 1;
          return new Date(parseInt(year), monthNum, 1);
        }
        console.warn("⚠️ Unknown date format:", dateStr);
        return null;
      } catch (e) {
        console.warn("⚠️ Error parsing date:", dateStr, e);
        return null;
      }
    },
    [getMonthIndex]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Fetching monthly request count data...");

        const response = await apiClient.dashboard.getMonthlyRequestCount();
        console.log("✅ Monthly request count data received:", response);

        // Extract data from response with flexible handling
        let monthlyData: MONTHLY_REQUEST_COUNT[] = [];

        if (response?.data && Array.isArray(response.data)) {
          // Case 1: { data: [...] }
          monthlyData = response.data;
        } else if (Array.isArray(response)) {
          // Case 2: Direct array response
          monthlyData = response;
        } else {
          // Case 3: Unexpected response format
          console.warn("⚠️ Unexpected response format:", response);
          setUseFallback(true);
          return;
        }

        // Check if we actually have data
        if (monthlyData.length === 0) {
          console.warn("⚠️ Empty data array received");
          setUseFallback(true);
          return;
        }

        // Transform API data to match chart format
        const transformedData = monthlyData.map((item) => ({
          month: item.monthYear?.substring(0, 3) || "???",
          monthYear: item.monthYear || "Unknown",
          requestCount: item.requestCount || 0,
          // Add a sortableDate field for proper chronological sorting
          sortableDate: parseDateString(item.monthYear || ""),
        }));

        // Sort data chronologically (oldest to newest)
        const sortedData = transformedData
          .sort((a, b) => {
            // If we have valid dates, sort by date
            if (a.sortableDate && b.sortableDate) {
              return a.sortableDate.getTime() - b.sortableDate.getTime();
            }
            // Fallback to original order if dates can't be parsed
            return 0;
          })
          .map(({ sortableDate, ...rest }) => rest); // Remove the sortableDate field before setting chart data

        console.log(
          "📊 Transformed trend data (chronological order):",
          sortedData
        );
        setChartData(sortedData);
        setUseFallback(false);
      } catch (error) {
        console.error("❌ Error fetching monthly request count:", error);
        setError("Failed to load monthly report trend data");
        toast.error("Failed to load monthly report trend data");
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [parseDateString]);

  const getYAxisDomain = () => {
    if (!chartData || chartData.length === 0) return [0, 10];

    const maxValue = Math.max(...chartData.map((item) => item.requestCount));
    const minValue = Math.min(...chartData.map((item) => item.requestCount));

    const maxDomain = Math.max(maxValue, 3);
    const minDomain = Math.max(0, Math.floor(minValue * 0.9));

    const roundedMax = Math.ceil(maxDomain);

    return [minDomain, roundedMax];
  };

  const getYAxisTicks = () => {
    const [min, max] = getYAxisDomain();
    const ticks = [];

    const range = max - min;
    let step = 1;

    if (range > 100) step = 20;
    else if (range > 50) step = 10;
    else if (range > 20) step = 5;
    else if (range > 10) step = 2;
    else step = 1;

    for (let i = min; i <= max; i += step) {
      ticks.push(i);
    }

    if (!ticks.includes(max)) {
      ticks.push(max);
    }

    return ticks;
  };

  const yAxisDomain = getYAxisDomain();
  const yAxisTicks = getYAxisTicks();

  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Báo cáo sự cố hàng tháng</CardTitle>
        <CardDescription className="flex items-center justify-between">
          <span>6 tháng gần đây nhất</span>
          {useFallback && (
            <span className="text-xs text-amber-500">(using sample data)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] w-full flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">
              Loading chart data...
            </div>
          </div>
        ) : error ? (
          <div className="h-[200px] w-full flex flex-col items-center justify-center text-red-400">
            <div>{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-blue-500 hover:text-blue-700"
            >
              Refresh
            </button>
          </div>
        ) : (
          <ChartContainer
            config={{
              requestCount: {
                label: "Số báo cáo",
                color: "hsl(var(--chart-4))",
              },
            }}
            className="h-[200px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis
                  domain={yAxisDomain}
                  ticks={yAxisTicks}
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  type="number"
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      return payload[0].payload.monthYear || label;
                    }
                    return label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requestCount"
                  stroke="var(--color-requestCount)"
                  strokeWidth={3}
                  dot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
