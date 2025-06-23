"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Line } from "recharts"

const issuesErrorsData = [
  { month: "T7", issues: 45, errors: 28 },
  { month: "T8", issues: 52, errors: 35 },
  { month: "T9", issues: 38, errors: 22 },
  { month: "T10", issues: 61, errors: 41 },
  { month: "T11", issues: 48, errors: 29 },
  { month: "T12", issues: 55, errors: 33 },
]

export default function IssuesErrorsTrendChart() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle>Xu hướng lỗi & triệu chứng</CardTitle>
        <CardDescription>6 tháng gần đây nhất</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            issues: { label: "Issues", color: "hsl(var(--chart-4))" },
            errors: { label: "Errors", color: "hsl(var(--chart-5))" },
          }}
          className="h-[200px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={issuesErrorsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="issues" stroke="var(--color-issues)" strokeWidth={3} dot={{ r: 6 }} />
              <Line type="monotone" dataKey="errors" stroke="var(--color-errors)" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
