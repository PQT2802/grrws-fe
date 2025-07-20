'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataItem {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

interface RequestStatusPieChartProps {
  data: ChartDataItem[];
  total: number;
}

export default function RequestStatusPieChart({ data, total }: RequestStatusPieChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{data.name}</p>
          <p className="text-blue-600">{`Số lượng: ${data.value}`}</p>
          <p className="text-green-600">{`Phần trăm: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-background border rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">
        Phân bổ trạng thái yêu cầu (Tổng: {total})
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={1000}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-requests-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Fixed Legend - Proper Grid Layout */}
      <div className="mt-4">
        <div className={`grid gap-2 ${data.length === 2 ? 'grid-cols-2' : data.length === 3 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-3 h-3 rounded-full shadow-sm flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-sm truncate">{item.name}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-lg font-bold">{item.value}</span>
                <div className="text-xs text-muted-foreground">
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}