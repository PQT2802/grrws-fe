"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { apiClient } from "@/lib/api-client";
import { CalendarDays, Loader2 } from "lucide-react";
import { translateTaskType } from "@/utils/textTypeTask";
import { useDashboardFilters } from "@/components/HOTChartCpn/DashboardFilterContext";

interface TaskData {
  taskId: string;
  taskName: string;
  status: string;
  createdDate: string;
  taskType: string;
  expectedTime?: string;
  assigneeName?: string;
  priority?: string;
  areaId?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  installation: number;
  repair: number;
  warranty: number;
  totalTasks: number;
  fullDate: string;
  hourSlot?: number;
}

interface TaskBreakdownChartProps {
  className?: string;
}

const TASK_TYPE_COLORS = {
  installation: "#22C55E", // Green
  repair: "#F97316",       // Orange
  warranty: "#3B82F6",     // Blue
};

const TASK_TYPE_LABELS = {
  installation: "Thay thế",
  repair: "Sửa chữa", 
  warranty: "Bảo hành",
};

export default function TaskBreakdownChart({ className }: TaskBreakdownChartProps) {
  const { getApiParams } = useDashboardFilters(); // ✅ Use global filters
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper function to categorize task type
  const categorizeTaskType = (taskType: string): 'installation' | 'repair' | 'warranty' => {
    const type = taskType.toLowerCase();
    
    if (type.includes('installation') || type.includes('replace') || type.includes('replacement') || type.includes('uninstall')) {
      return 'installation';
    }
    
    if (type.includes('repair')) {
      return 'repair';
    }
    
    if (type.includes('warranty') || type.includes('warrantysubmission') || type.includes('warrantyreturn')) {
      return 'warranty';
    }
    
    // Default fallback - categorize by translated text
    const translatedType = translateTaskType(taskType).toLowerCase();
    if (translatedType.includes('thay thế') || translatedType.includes('lắp đặt') || translatedType.includes('tháo dỡ')) {
      return 'installation';
    }
    if (translatedType.includes('sửa chữa')) {
      return 'repair';
    }
    if (translatedType.includes('bảo hành')) {
      return 'warranty';
    }
    
    // Final fallback to repair
    return 'repair';
  };

  // ✅ Apply global filters to tasks
  const filterTasks = (tasks: TaskData[]): TaskData[] => {
    const filterParams = getApiParams();
    
    return tasks.filter(task => {
      // Date filtering
      if (filterParams.startDate && filterParams.endDate) {
        const taskDate = new Date(task.createdDate);
        const startDate = new Date(filterParams.startDate);
        const endDate = new Date(filterParams.endDate);
        if (taskDate < startDate || taskDate > endDate) {
          return false;
        }
      }

      // Area filtering
      if (filterParams.areaIds && filterParams.areaIds.length > 0) {
        return task.areaId && filterParams.areaIds.includes(task.areaId);
      }

      return true;
    });
  };

  // Dynamic Y-axis scale calculation
  const calculateYAxisScale = (maxValue: number): { max: number; tickCount: number; interval: number } => {
    if (maxValue <= 0) return { max: 4, tickCount: 5, interval: 1 };
    
    const candidates = [
      Math.ceil(maxValue / 4) * 4,     // Round up to nearest multiple of 4
      Math.ceil(maxValue / 5) * 5,     // Round up to nearest multiple of 5
      Math.ceil(maxValue / 8) * 8,     // Round up to nearest multiple of 8
      Math.ceil(maxValue / 10) * 10,   // Round up to nearest multiple of 10
      Math.ceil(maxValue / 20) * 20,   // Round up to nearest multiple of 20
    ];
    
    for (const candidate of candidates) {
      if (candidate >= maxValue) {
        const interval = candidate / 4;
        if (Number.isInteger(interval)) {
          return {
            max: candidate,
            tickCount: 5,
            interval: interval
          };
        }
      }
    }
    
    const fallbackMax = Math.ceil(maxValue / 4) * 4;
    return {
      max: fallbackMax,
      tickCount: 5,
      interval: fallbackMax / 4
    };
  };

  // ✅ Fetch tasks from getAllTaskGroups API with global filters
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log("📊 Fetching tasks for TaskBreakdownChart with global filters...");
        
        const response = await apiClient.task.getAllTaskGroups(1, 100);
        let tasksData: TaskData[] = [];
        
        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((group: any) => {
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                tasksData.push({
                  taskId: task.taskId || task.id,
                  taskName: task.taskName || task.name || `${group.groupName} - Task`,
                  status: task.status || 'Unknown',
                  createdDate: task.createdDate || group.createdDate || new Date().toISOString(),
                  taskType: task.taskType || group.groupType || 'General',
                  assigneeName: task.assigneeName || task.assignee?.name,
                  areaId: task.areaId || group.areaId // ✅ Include areaId for filtering
                });
              });
            }
          });
        }
        
        console.log(`📊 Fetched ${tasksData.length} total tasks`);
        
        // ✅ Apply global filters
        const filteredTasks = filterTasks(tasksData);
        console.log(`📊 After filtering: ${filteredTasks.length} tasks`);
        
        setTasks(filteredTasks);
        
        if (filteredTasks.length === 0) {
          setError("Không có dữ liệu nhiệm vụ");
        }
        
      } catch (error) {
        console.error("Error fetching task data:", error);
        setError("Không thể tải dữ liệu nhiệm vụ");
        setTasks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [getApiParams]); // ✅ Re-fetch when filters change

  // ✅ Generate chart data based on filtered tasks (show last 7 days)
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!tasks.length) {
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000); // Last 7 days
    const endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
    const periods = 7;

    const groupedData = new Map<string, ChartDataPoint>();

    // Create 7 day periods
    for (let i = 0; i < periods; i++) {
      const periodDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = `${periodDate.getFullYear()}-${(periodDate.getMonth() + 1).toString().padStart(2, '0')}-${periodDate.getDate().toString().padStart(2, '0')}`;
      
      const displayDate = periodDate.toLocaleDateString('vi-VN', {
        month: 'short',
        day: '2-digit',
      });
      
      groupedData.set(key, {
        date: key,
        displayDate,
        installation: 0,
        repair: 0,
        warranty: 0,
        totalTasks: 0,
        fullDate: periodDate.toISOString(),
      });
    }

    // Count tasks by day
    tasks.forEach(task => {
      const taskDate = new Date(task.createdDate);
      const key = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
      
      const period = groupedData.get(key);
      if (period) {
        const taskCategory = categorizeTaskType(task.taskType);
        period[taskCategory]++;
        period.totalTasks++;
      }
    });

    const result = Array.from(groupedData.values()).sort((a, b) => {
      return new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime();
    });
    
    console.log(`📊 Generated ${result.length} chart data points for TaskBreakdownChart`);
    
    return result;
  }, [tasks]);

  // Calculate dynamic Y-axis scale
  const yAxisScale = useMemo(() => {
    const maxTasksInAnyPeriod = Math.max(...chartData.map(item => item.totalTasks), 0);
    return calculateYAxisScale(maxTasksInAnyPeriod);
  }, [chartData]);

  // Enhanced tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      if (data.totalTasks === 0) return null;

      const validEntries = [
        { label: TASK_TYPE_LABELS.installation, value: data.installation, color: "#22C55E" },
        { label: TASK_TYPE_LABELS.repair, value: data.repair, color: "#F97316" },
        { label: TASK_TYPE_LABELS.warranty, value: data.warranty, color: "#3B82F6" }
      ].filter(entry => entry.value > 0);

      if (validEntries.length === 0) return null;
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <div className="space-y-1">
            {validEntries.map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.label}: <span className="font-bold">{entry.value}</span>
              </p>
            ))}
            <p className="font-medium text-gray-900 dark:text-gray-100 border-t pt-1">
              Tổng cộng: <span className="font-bold">{data.totalTasks}</span>
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {new Date(data.fullDate).toLocaleDateString('vi-VN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend component
  const CustomLegend = (props: any) => {
    return (
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TASK_TYPE_COLORS.installation }} />
          <span className="text-sm text-gray-600 dark:text-gray-300">{TASK_TYPE_LABELS.installation}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TASK_TYPE_COLORS.repair }} />
          <span className="text-sm text-gray-600 dark:text-gray-300">{TASK_TYPE_LABELS.repair}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: TASK_TYPE_COLORS.warranty }} />
          <span className="text-sm text-gray-600 dark:text-gray-300">{TASK_TYPE_LABELS.warranty}</span>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-background border rounded-lg shadow-sm p-6 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Thống kê công việc theo loại (7 ngày qua)</h3>
          </div>
        </div>
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background border rounded-lg shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Thống kê công việc theo loại (7 ngày qua)</h3>
        </div>
      </div>

      {/* Empty State */}
      {chartData.length === 0 || chartData.every(item => item.totalTasks === 0) ? (
        <div className="flex items-center justify-center h-80">
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            Không có dữ liệu công việc
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <ResponsiveContainer width="100%" height={380}>
            <BarChart 
              data={chartData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval={0}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[0, yAxisScale.max]}
                tickCount={yAxisScale.tickCount}
                allowDecimals={false}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                allowEscapeViewBox={{ x: false, y: false }}
                position={{ x: undefined, y: undefined }}
              />
              <Legend content={<CustomLegend />} />
              
              {/* Stacked bars */}
              <Bar 
                dataKey="installation" 
                fill={TASK_TYPE_COLORS.installation}
                name="installation"
                stackId="tasks"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="repair" 
                fill={TASK_TYPE_COLORS.repair}
                name="repair"
                stackId="tasks"
                radius={[0, 0, 0, 0]}
              />
              <Bar 
                dataKey="warranty" 
                fill={TASK_TYPE_COLORS.warranty}
                name="warranty"
                stackId="tasks"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>

          {/* Summary */}
          <div className="space-y-2">
            <div className="flex justify-center gap-6 text-sm text-muted-foreground">
              <span>
                Tổng nhiệm vụ: <span className="font-semibold text-foreground">
                  {chartData.reduce((sum, item) => sum + item.totalTasks, 0)}
                </span>
              </span>
              <span>
                Trung bình/ngày: <span className="font-semibold text-foreground">
                  {chartData.length > 0 ? 
                    Math.round(chartData.reduce((sum, item) => sum + item.totalTasks, 0) / chartData.length) : 0
                  }
                </span>
              </span>
              <span>
                Cao nhất: <span className="font-semibold text-foreground">
                  {Math.max(...chartData.map(item => item.totalTasks), 0)}
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}