"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const userRolesData = [
  { name: "Admin", value: 5, color: "#ef4444" },
  { name: "Head Department", value: 12, color: "#f59e0b" },
  { name: "Head of Technical", value: 8, color: "#22c55e" },
  { name: "Mechanic", value: 45, color: "#3b82f6" },
  { name: "Stock Keeper", value: 18, color: "#8b5cf6" },
]

export default function UserRolesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Phân bổ người dùng theo vai trò</CardTitle>
        <CardDescription>Tổng số 88 người dùng trong hệ thống</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            admin: { label: "Admin", color: "#ef4444" },
            headDepartment: { label: "Head Department", color: "#f59e0b" },
            headTechnical: { label: "Head of Technical", color: "#22c55e" },
            mechanic: { label: "Mechanic", color: "#3b82f6" },
            stockKeeper: { label: "Stock Keeper", color: "#8b5cf6" },
          }}
          className="h-[400px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={userRolesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={1500}
              >
                {userRolesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
        <div className="mt-6 grid grid-cols-2 gap-4">
          {userRolesData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{item.value}</span>
                <div className="text-xs text-muted-foreground">{((item.value / 88) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
