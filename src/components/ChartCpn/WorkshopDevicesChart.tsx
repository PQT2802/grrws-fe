"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, CartesianGrid, XAxis, YAxis, Bar } from "recharts"

const machineStatusData = [
  { name: "Trong kho", value: 25, color: "#6b7280" },
  { name: "Hoạt động", value: 156, color: "#22c55e" },
  { name: "Ngừng hoạt động", value: 8, color: "#ef4444" },
  { name: "Sửa chữa", value: 12, color: "#f59e0b" },
  { name: "Bảo hành", value: 15, color: "#8b5cf6" },
]

const warrantyStatusData = [
  { status: "Còn bảo hành", count: 142 },
  { status: "Hết bảo hành", count: 74 },
]

export default function WorkshopDevicesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Thiết bị trong xưởng may</CardTitle>
        <CardDescription>Tổng quan về tình trạng và bảo hành thiết bị</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Machine Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Trạng thái máy may</h3>
            <ChartContainer
              config={{
                inStock: { label: "Trong kho", color: "#6b7280" },
                active: { label: "Hoạt động", color: "#22c55e" },
                inactive: { label: "Ngừng hoạt động", color: "#ef4444" },
                repair: { label: "Sửa chữa", color: "#f59e0b" },
                warranty: { label: "Bảo hành", color: "#8b5cf6" },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={machineStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    animationBegin={0}
                    animationDuration={1500}
                  >
                    {machineStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-1 gap-2">
              {machineStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold">{item.value}</span>
                    <div className="text-xs text-muted-foreground">{((item.value / 216) * 100).toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Warranty Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-center">Tình trạng bảo hành</h3>
            <ChartContainer
              config={{
                count: { label: "Số lượng", color: "hsl(var(--chart-1))" },
              }}
              className="h-[250px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warrantyStatusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
            <div className="grid grid-cols-1 gap-2">
              {warrantyStatusData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full shadow-sm ${
                        item.status === "Còn bảo hành" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="font-medium text-sm">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold">{item.count}</span>
                    <div className="text-xs text-muted-foreground">máy</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
