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

  // Check if we have an odd number of items to center the last row
  const isOddNumber = data.length % 2 !== 0;

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
      
      {/* Updated Legend - 2 Column Grid with Centered Last Row for Odd Numbers */}
      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2">
          {data.slice(0, -1).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 rounded-lg border bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-sm">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{item.value}</span>
                <div className="text-xs text-muted-foreground">
                  {total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Last item - centered if odd number of total items */}
        {data.length > 0 && (
          <div className={`mt-2 ${isOddNumber ? 'flex justify-center' : 'grid grid-cols-2 gap-2'}`}>
            <div className={`flex items-center justify-between p-2 rounded-lg border bg-muted/20 ${isOddNumber ? 'w-1/2' : ''}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: data[data.length - 1].color }} />
                <span className="font-medium text-sm">{data[data.length - 1].name}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold">{data[data.length - 1].value}</span>
                <div className="text-xs text-muted-foreground">
                  {total > 0 ? ((data[data.length - 1].value / total) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}