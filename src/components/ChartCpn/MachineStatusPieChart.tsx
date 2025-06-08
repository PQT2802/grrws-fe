"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const machineStatusData = [
  { name: "Hoạt động", value: 156, color: "#22c55e" },
  { name: "Bảo trì", value: 12, color: "#f59e0b" },
  { name: "Sửa chữa", value: 8, color: "#ef4444" },
  { name: "Ngừng hoạt động", value: 4, color: "#6b7280" },
];

const MachineStatusPieChart = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái máy may</CardTitle>
        <CardDescription>Phân bổ 180 máy theo trạng thái hiện tại</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            active: { label: "Hoạt động", color: "#22c55e" },
            maintenance: { label: "Bảo trì", color: "#f59e0b" },
            repair: { label: "Sửa chữa", color: "#ef4444" },
            inactive: { label: "Ngừng hoạt động", color: "#6b7280" },
          }}
          className="h-[300px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={machineStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
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
        <div className="mt-6 grid grid-cols-2 gap-4">
          {machineStatusData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="font-medium">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{item.value}</span>
                <div className="text-xs text-muted-foreground">{((item.value / 180) * 100).toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MachineStatusPieChart;