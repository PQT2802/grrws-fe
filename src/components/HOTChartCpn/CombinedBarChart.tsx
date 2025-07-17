'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CombinedData {
  category: string;
  pending: number;
  inProgress: number;
  completed: number;
  total: number;
}

interface CombinedBarChartProps {
  data: CombinedData[];
}

export default function CombinedBarChart({ data }: CombinedBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total;
      const categoryLabel = label === "Requests" ? "Yêu cầu" : "Công việc";
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold mb-2">{categoryLabel}</p>
          {payload.map((item: any, index: number) => {
            const statusLabels: { [key: string]: string } = {
              'pending': 'Chờ xử lý',
              'inProgress': 'Đang xử lý',
              'completed': 'Hoàn thành'
            };
            const statusLabel = statusLabels[item.dataKey] || item.dataKey;
            
            return (
              <p key={index} style={{ color: item.color }}>
                {`${statusLabel}: ${item.value} (${((item.value / total) * 100).toFixed(1)}%)`}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  const CustomLegend = (props: any) => {
    const { payload } = props;
    const translations: { [key: string]: string } = {
      'pending': 'Chờ xử lý',
      'inProgress': 'Đang xử lý',
      'completed': 'Hoàn thành'
    };

    return (
      <div className="flex justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {translations[entry.dataKey] || entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-background border rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4">
        So sánh yêu cầu và công việc
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="category" 
            tick={{ fontSize: 16 }}
            tickFormatter={(value) => value === "Requests" ? "Yêu cầu" : "Công việc"}
          />
          <YAxis tick={{ fontSize: 13 }} />
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
          <Bar dataKey="pending" fill="#FFA726" name="pending" radius={[2, 2, 0, 0]} />
          <Bar dataKey="inProgress" fill="#42A5F5" name="inProgress" radius={[2, 2, 0, 0]} />
          <Bar dataKey="completed" fill="#66BB6A" name="completed" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}