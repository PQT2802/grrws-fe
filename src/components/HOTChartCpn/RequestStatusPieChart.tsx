"use client";

import { useEffect, useRef, useCallback } from "react";
import * as echarts from "echarts";
import { FolderGit2 } from "lucide-react";

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
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  const initializeChart = useCallback(() => {
    if (!chartRef.current) return null;

    try {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }

      const chart = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
        useDirtyRect: false,
      });
      
      chartInstance.current = chart;
      return chart;
    } catch (error) {
      console.error("Error initializing RequestStatusPieChart:", error);
      return null;
    }
  }, []);

  const updateChart = useCallback(() => {
    if (!chartInstance.current) {
      const chart = initializeChart();
      if (!chart) return;
    }

    // ✅ Get current theme colors from CSS custom properties
    const isDarkMode = document.documentElement.classList.contains('dark');
    const legendColor = isDarkMode ? '#FFFFFF' : '#000000'; // White in dark, black in light
    const labelColor = isDarkMode ? '#FFFFFF' : '#000000';  // White in dark, black in light

    // ✅ Show empty state if no data - same as TaskBreakdownChart
    if (total === 0 || data.length === 0 || data.every(item => item.value === 0)) {
      // Clear the chart and don't show anything - just empty space
      chartInstance.current!.clear();
      return;
    }

    // Prepare chart data
    const chartData = data.map(item => ({
      value: item.value,
      name: item.name,
      itemStyle: { color: item.color }
    }));

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const percentage = params.percent || 0;
          return `${params.name}<br/>${params.value} (${percentage.toFixed(1)}%)`;
        },
        backgroundColor: 'rgba(50, 50, 50, 0.8)',
        borderWidth: 0,
        borderRadius: 8,
        textStyle: { 
          color: '#fff',
          fontSize: 14, 
          fontWeight: 'normal',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
        },
        extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: all 0.3s ease;'
      },
      legend: {
        orient: 'horizontal',
        bottom: 15,
        left: 'center',
        data: data.map(item => item.name),
        textStyle: {
          color: legendColor, // ✅ Dynamic color based on theme
          fontSize: 15,
          fontWeight: 'normal',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
        },
        itemGap: 20,
        icon: 'circle',
        itemWidth: 10,
        itemHeight: 10
      },
      series: [
        {
          name: 'Request Status',
          type: 'pie',
          radius: '65%', 
          center: ['50%', '40%'], 
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'outside',
            formatter: '{d}%',
            fontSize: 15,
            fontWeight: 'bold',
            color: labelColor, // ✅ Dynamic color based on theme
            fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10,
            smooth: true,
            lineStyle: {
              color: labelColor // ✅ Make label lines also follow theme
            }
          },
          data: chartData,
          emphasis: {
            itemStyle: {
              shadowBlur: 15,
              shadowOffsetX: 0,
              shadowOffsetY: 5,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            scaleSize: 10
          },
          animationType: 'scale',
          animationEasing: 'elasticOut',
          animationDelay: (idx: number) => idx * 100
        }
      ],
      animation: true,
      animationDuration: 1000,
      animationEasing: 'cubicOut'
    };

    chartInstance.current!.setOption(option, true);

    // Force resize after setting option
    setTimeout(() => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    }, 100);
  }, [data, total, initializeChart]);

  // Initialize chart when component mounts
  useEffect(() => {
    if (chartRef.current) {
      const timer = setTimeout(() => {
        initializeChart();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initializeChart]);

  // Update chart when data changes
  useEffect(() => {
    if (chartRef.current) {
      const timer = setTimeout(() => {
        updateChart();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [updateChart]);

  // ✅ Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Re-render chart when theme changes
      setTimeout(() => {
        updateChart();
      }, 100);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [updateChart]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        chartInstance.current.resize({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cleanup chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-background border rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FolderGit2 className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Trạng thái yêu cầu
          </h3>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng yêu cầu</p>
        </div>
      </div>
      
      {/* ✅ Empty State - same as TaskBreakdownChart */}
      {total === 0 || data.length === 0 || data.every(item => item.value === 0) ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Không có dữ liệu yêu cầu
          </p>
        </div>
      ) : (
        <div 
          ref={chartRef} 
          className="w-full h-80"
          style={{ minHeight: '320px' }}
        />
      )}
    </div>
  );
}