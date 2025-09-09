"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as echarts from "echarts";
import { apiClient } from "@/lib/api-client";
import { AlertTriangle, Loader2 } from "lucide-react";

interface IncidentData {
  issues: number;
  technicalIssues: number;
  errors: number;
  total: number;
}

interface IncidentOverviewChartProps {
  className?: string;
}

const INCIDENT_COLORS = {
  issues: "#EF4444",        // Red
  technicalIssues: "#3B82F6", // Blue  
  errors: "#F97316",        // Orange
};

const INCIDENT_LABELS = {
  issues: "Triệu chứng",
  technicalIssues: "Triệu chứng kỹ thuật", 
  errors: "Lỗi",
};

export default function IncidentOverviewChart({ className }: IncidentOverviewChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const [incidentData, setIncidentData] = useState<IncidentData>({
    issues: 0,
    technicalIssues: 0,
    errors: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const extractCount = (response: any, apiName: string): number => {
    console.log(`🔍 ${apiName} Full Response:`, response);
    
    const possiblePaths = [
      response?.extensions?.data?.totalCount,
      response?.data?.extensions?.data?.totalCount,
      response?.data?.totalCount,
      response?.data?.total,
      response?.totalCount,
      response?.total,
      response?.count,
      response?.data?.count,
      response?.data?.length,
      response?.length,
      Array.isArray(response?.data?.data) ? response.data.data.length : 0,
      Array.isArray(response?.data) ? response.data.length : 0,
      Array.isArray(response) ? response.length : 0
    ];

    for (let i = 0; i < possiblePaths.length; i++) {
      const value = possiblePaths[i];
      if (typeof value === 'number' && value >= 0) {
        console.log(`✅ ${apiName} count found at path ${i}: ${value}`);
        return value;
      }
    }

    console.warn(`⚠️ ${apiName} count not found, defaulting to 0`);
    return 0;
  };

  const initializeChart = useCallback(() => {
    if (!chartRef.current) {
      console.error("❌ Chart ref not found");
      return null;
    }

    try {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }

      const chart = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
        useDirtyRect: false,
        width: chartRef.current.offsetWidth,
        height: chartRef.current.offsetHeight
      });
      
      chartInstance.current = chart;
      console.log("✅ Chart initialized successfully", {
        width: chartRef.current.offsetWidth,
        height: chartRef.current.offsetHeight
      });
      return chart;
    } catch (error) {
      console.error("❌ Error initializing chart:", error);
      return null;
    }
  }, []);

  const updateChart = useCallback((data: IncidentData) => {
    console.log("🎨 Updating chart with data:", data);

    if (!chartInstance.current) {
      console.log("🔄 Chart not initialized, initializing now...");
      const chart = initializeChart();
      if (!chart) return;
    }

    // ✅ Get current theme colors from CSS custom properties
    const isDarkMode = document.documentElement.classList.contains('dark');
    const legendColor = isDarkMode ? '#FFFFFF' : '#000000'; // White in dark, black in light
    const labelColor = isDarkMode ? '#FFFFFF' : '#000000';  // White in dark, black in light

    if (data.total === 0) {
      const emptyOption: echarts.EChartsOption = {
        title: {
          text: 'Không có dữ liệu sự cố',
          left: 'center',
          top: 'middle',
          textStyle: {
            color: '#9CA3AF',
            fontSize: 16,
            fontWeight: 'normal',
            fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
          }
        },
        backgroundColor: 'transparent'
      };
      chartInstance.current!.setOption(emptyOption, true);
      return;
    }

    const chartData = [
      {
        value: data.issues,
        name: INCIDENT_LABELS.issues,
        itemStyle: { color: INCIDENT_COLORS.issues }
      },
      {
        value: data.technicalIssues,
        name: INCIDENT_LABELS.technicalIssues,
        itemStyle: { color: INCIDENT_COLORS.technicalIssues }
      },
      {
        value: data.errors,
        name: INCIDENT_LABELS.errors,
        itemStyle: { color: INCIDENT_COLORS.errors }
      }
    ];

    console.log("📈 Chart data prepared:", chartData);

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
        data: [
          INCIDENT_LABELS.issues,
          INCIDENT_LABELS.technicalIssues,
          INCIDENT_LABELS.errors
        ],
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
          name: 'Incident Overview',
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

    console.log("🎯 Setting chart option");

    try {
      chartInstance.current!.setOption(option, true);
      setTimeout(() => {
        if (chartInstance.current) {
          chartInstance.current.resize();
        }
      }, 100);
      console.log("✅ Chart option set successfully");
    } catch (error) {
      console.error("❌ Error setting chart option:", error);
    }
  }, [initializeChart]);

  // Fetch incident data from APIs
  useEffect(() => {
    const fetchIncidentData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🚀 Starting API calls...");

        const [issuesResponse, technicalIssuesResponse, errorsResponse] = await Promise.all([
          apiClient.incident.getIssues(1, 1000).catch(err => {
            console.error("Issues API failed:", err);
            return null;
          }),
          apiClient.incident.getTechnicalIssues(1, 1000).catch(err => {
            console.error("Technical Issues API failed:", err);
            return null;
          }),
          apiClient.incident.getErrors(1, 1000).catch(err => {
            console.error("Errors API failed:", err);
            return null;
          }),
        ]);

        console.log("🔍 API Call Results:", {
          issuesSuccess: !!issuesResponse,
          technicalIssuesSuccess: !!technicalIssuesResponse,
          errorsSuccess: !!errorsResponse
        });

        const issueCount = extractCount(issuesResponse, "Issues");
        const technicalIssueCount = extractCount(technicalIssuesResponse, "Technical Issues");
        const errorCount = extractCount(errorsResponse, "Errors");

        console.log("📊 Final extracted counts:", {
          issueCount,
          technicalIssueCount,
          errorCount
        });

        const total = issueCount + technicalIssueCount + errorCount;

        const newData = {
          issues: issueCount,
          technicalIssues: technicalIssueCount,
          errors: errorCount,
          total,
        };

        setIncidentData(newData);

        if (total === 0) {
          console.warn("⚠️ All incident counts are 0 - this might indicate API issues");
        }

      } catch (err) {
        console.error("❌ Failed to fetch incident data:", err);
        setError("Không thể tải dữ liệu sự cố. Hiển thị dữ liệu mẫu.");
        
        const mockData = {
          issues: 50,
          technicalIssues: 37,
          errors: 60,
          total: 147,
        };
        setIncidentData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidentData();
  }, []);

  useEffect(() => {
    if (chartRef.current && !loading) {
      console.log("🚀 Component ready, initializing chart...");
      const timer = setTimeout(() => {
        initializeChart();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [loading, initializeChart]);

  useEffect(() => {
    if (!loading && chartRef.current) {
      console.log("📊 Data or chart ready, updating chart...");
      const timer = setTimeout(() => {
        updateChart(incidentData);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [incidentData, loading, updateChart]);

  // ✅ Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Re-render chart when theme changes
      if (!loading) {
        setTimeout(() => {
          updateChart(incidentData);
        }, 100);
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [updateChart, incidentData, loading]);

  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current && chartRef.current) {
        console.log("🔄 Resizing chart...");
        chartInstance.current.resize({
          width: chartRef.current.offsetWidth,
          height: chartRef.current.offsetHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        console.log("🧹 Cleaning up chart instance");
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (loading) {
    return (
      <div className={`rounded-lg border shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Tổng quan sự cố
            </h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-orange-500" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Tổng quan sự cố
          </h3>
          {error && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
              Dữ liệu mẫu
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {incidentData.total.toLocaleString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng sự cố</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <div 
        ref={chartRef} 
        className="w-full h-80 rounded-lg"
        style={{ minHeight: '375px' }}
      />
    </div>
  );
}