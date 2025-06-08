"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";

const errorTrendData = [
  { week: "T1", mechanical: 5, electrical: 3, software: 1, total: 9 },
  { week: "T2", mechanical: 7, electrical: 2, software: 2, total: 11 },
  { week: "T3", mechanical: 4, electrical: 4, software: 0, total: 8 },
  { week: "T4", mechanical: 6, electrical: 1, software: 3, total: 10 },
  { week: "T5", mechanical: 3, electrical: 5, software: 1, total: 9 },
  { week: "T6", mechanical: 8, electrical: 2, software: 2, total: 12 },
];

const ErrorTrendLineChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng lỗi máy theo tuần</CardTitle>
        <CardDescription>Phân loại lỗi cơ khí, điện và phần mềm</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            mechanical: { label: "Cơ khí", color: "hsl(var(--chart-1))" },
            electrical: { label: "Điện", color: "hsl(var(--chart-2))" },
            software: { label: "Phần mềm", color: "hsl(var(--chart-3))" },
            total: { label: "Tổng", color: "hsl(var(--chart-4))" },
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={errorTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="mechanical"
                stroke="var(--color-mechanical)"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8, stroke: "var(--color-mechanical)", strokeWidth: 2 }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="electrical"
                stroke="var(--color-electrical)"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8, stroke: "var(--color-electrical)", strokeWidth: 2 }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="software"
                stroke="var(--color-software)"
                strokeWidth={3}
                dot={{ r: 6 }}
                activeDot={{ r: 8, stroke: "var(--color-software)", strokeWidth: 2 }}
                animationDuration={1500}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--color-total)"
                strokeWidth={4}
                strokeDasharray="8 8"
                dot={{ r: 8 }}
                activeDot={{ r: 10, stroke: "var(--color-total)", strokeWidth: 3 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default ErrorTrendLineChart;