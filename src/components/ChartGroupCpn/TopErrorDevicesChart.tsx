"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"

const topErrorDevicesData = [
  { device: "Máy 01", errors: 28 },
  { device: "Máy 15", errors: 24 },
  { device: "Máy 08", errors: 19 },
  { device: "Máy 23", errors: 16 },
  { device: "Máy 12", errors: 13 },
]

export default function TopErrorDevicesChart() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Top 5 thiết bị lỗi nhiều nhất</CardTitle>
        <CardDescription>Thống kê lỗi trong tháng hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            errors: { label: "Số lỗi", color: "hsl(var(--chart-1))" },
          }}
          className="h-[200px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topErrorDevicesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="device" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="errors" fill="var(--color-errors)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
