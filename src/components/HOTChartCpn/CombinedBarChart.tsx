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
  // ✅ Filter out categories with all zero values to prevent gaps
  const filteredData = data.filter(item => 
    item.pending > 0 || item.inProgress > 0 || item.completed > 0
  );

  // ✅ Calculate proper Y-axis scale with integer-only ticks
  const calculateYAxisScale = (maxValue: number): { max: number; interval: number } => {
    if (maxValue <= 0) return { max: 4, interval: 1 };
    
    // Find the best scale that provides clean integer intervals
    const candidates = [
      Math.ceil(maxValue / 4) * 4,     // Round up to nearest multiple of 4
      Math.ceil(maxValue / 5) * 5,     // Round up to nearest multiple of 5
      Math.ceil(maxValue / 10) * 10,   // Round up to nearest multiple of 10
      Math.ceil(maxValue / 20) * 20,   // Round up to nearest multiple of 20
    ];
    
    // Choose the smallest candidate that's >= maxValue and provides nice intervals
    for (const candidate of candidates) {
      if (candidate >= maxValue) {
        const interval = candidate / 4;
        if (Number.isInteger(interval) && interval >= 1) {
          return {
            max: candidate,
            interval: interval
          };
        }
      }
    }
    
    // Fallback: round up to nearest integer and create intervals of 1
    const fallbackMax = Math.max(Math.ceil(maxValue), 4);
    return {
      max: fallbackMax,
      interval: Math.max(Math.ceil(fallbackMax / 4), 1)
    };
  };

  // Calculate the maximum value across all categories
  const maxValue = Math.max(...filteredData.map(item => 
    Math.max(item.pending, item.inProgress, item.completed)
  ), 0);

  const yAxisScale = calculateYAxisScale(maxValue);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const total = payload[0].payload.total;
      const categoryLabel = label === "Requests" ? "Yêu cầu" : "Công việc";
      
      // ✅ Only show tooltip entries that have values > 0
      const validPayload = payload.filter((item: any) => item.value > 0);
      
      if (validPayload.length === 0) return null;

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold mb-2">{categoryLabel}</p>
          {validPayload.map((item: any, index: number) => {
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
      
      {filteredData.length === 0 ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu để hiển thị</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={335}>
          <BarChart 
            data={filteredData} 
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
            barCategoryGap="15%"
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="category" 
              tick={{ fontSize: 16 }}
              tickFormatter={(value) => value === "Requests" ? "Yêu cầu" : "Công việc"}
              interval={0} 
            />
            <YAxis 
              tick={{ fontSize: 13 }}
              domain={[0, yAxisScale.max]}
              ticks={Array.from({ length: Math.floor(yAxisScale.max / yAxisScale.interval) + 1 }, (_, i) => i * yAxisScale.interval)}
              allowDecimals={false} // ✅ Ensure no decimal values
              type="number"
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
              allowEscapeViewBox={{ x: false, y: false }}
              position={{ x: undefined, y: undefined }}
            />
            <Legend content={<CustomLegend />} />
            <Bar 
              dataKey="pending" 
              fill="#FFA726" 
              name="pending" 
              radius={[2, 2, 0, 0]}
              maxBarSize={60} 
            />
            <Bar 
              dataKey="inProgress" 
              fill="#42A5F5" 
              name="inProgress" 
              radius={[2, 2, 0, 0]}
              maxBarSize={60} 
            />
            <Bar 
              dataKey="completed" 
              fill="#66BB6A" 
              name="completed" 
              radius={[2, 2, 0, 0]}
              maxBarSize={60} 
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}