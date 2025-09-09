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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { CalendarDays, Loader2, AlertCircle } from "lucide-react";
import { translateTaskType } from "@/utils/textTypeTask";

interface TaskData {
  taskId: string;
  taskName: string;
  status: string;
  createdDate: string;
  taskType: string;
  expectedTime?: string;
  assigneeName?: string;
  priority?: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  installation: number;
  repair: number;
  warranty: number;
  totalTasks: number;
  fullDate: string;
}

interface TaskBreakdownChartProps {
  className?: string;
}

const TIME_RANGES = [
  { value: "24h", label: "24 giờ qua" },
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "12m", label: "12 tháng qua" },
];

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
  const [timeRange, setTimeRange] = useState("7d");
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

  // Dynamic Y-axis scale calculation
  const calculateYAxisScale = (maxValue: number): { max: number; tickCount: number; interval: number } => {
    if (maxValue <= 0) return { max: 4, tickCount: 5, interval: 1 };
    
    // Find the best scale that divides evenly into 4 intervals
    const candidates = [
      Math.ceil(maxValue / 4) * 4,     // Round up to nearest multiple of 4
      Math.ceil(maxValue / 5) * 5,     // Round up to nearest multiple of 5
      Math.ceil(maxValue / 8) * 8,     // Round up to nearest multiple of 8
      Math.ceil(maxValue / 10) * 10,   // Round up to nearest multiple of 10
      Math.ceil(maxValue / 20) * 20,   // Round up to nearest multiple of 20
    ];
    
    // Choose the smallest candidate that's >= maxValue and provides nice intervals
    for (const candidate of candidates) {
      if (candidate >= maxValue) {
        const interval = candidate / 4;
        if (Number.isInteger(interval)) {
          return {
            max: candidate,
            tickCount: 5, // 0, interval, 2*interval, 3*interval, max
            interval: interval
          };
        }
      }
    }
    
    // Fallback: round up to nearest 4 and create 4 intervals
    const fallbackMax = Math.ceil(maxValue / 4) * 4;
    return {
      max: fallbackMax,
      tickCount: 5,
      interval: fallbackMax / 4
    };
  };

  // Fetch tasks from getAllTaskGroups API
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        
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
                  assigneeName: task.assigneeName || task.assignee?.name
                });
              });
            }
          });
        }
        
        if (tasksData.length > 0) {
          setTasks(tasksData);
          setError(null);
        } else {
          setError("Không có dữ liệu nhiệm vụ từ API. Hiển thị dữ liệu mẫu.");
          setTasks(generateMockTaskData());
        }
        
      } catch (error) {
        setError(`Lỗi khi tải dữ liệu: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
        setTasks(generateMockTaskData());
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Generate realistic mock data with proper task types
  const generateMockTaskData = (): TaskData[] => {
    const mockTasks: TaskData[] = [];
    const now = new Date();
    const statuses = ['Pending', 'InProgress', 'Completed'];
    const taskTypes = ['Installation', 'Repair', 'Warranty', 'WarrantySubmission', 'WarrantyReturn', 'Replacement', 'Uninstallation'];
    const priorities = ['High', 'Medium', 'Low'];
    
    // Generate tasks for the past 30 days with realistic patterns
    for (let i = 0; i < 120; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      
      // Create date in local timezone to avoid offset issues
      const taskDate = new Date();
      taskDate.setDate(taskDate.getDate() - daysAgo);
      taskDate.setHours(taskDate.getHours() - hoursAgo);
      
      mockTasks.push({
        taskId: `mock-task-${i + 1}`,
        taskName: `Công việc mẫu ${i + 1}`,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdDate: taskDate.toISOString(),
        taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
        expectedTime: new Date(taskDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        assigneeName: `Thợ máy ${Math.floor(Math.random() * 10) + 1}`,
        priority: priorities[Math.floor(Math.random() * priorities.length)]
      });
    }
    
    return mockTasks;
  };

  // ✅ FIXED: Process data with correct date range logic (counting from today backward)
  const chartData = useMemo((): ChartDataPoint[] => {
    if (!tasks.length) {
      return [];
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let startDate: Date;
    let endDate: Date;
    let periods: number;

    // ✅ Fixed date range calculations - always count from today backward
    switch (timeRange) {
      case "24h":
        // Last 24 hours: from 24 hours ago to now
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        endDate = now;
        periods = 24;
        break;
      case "7d":
        // Last 7 days: from 6 days ago to today (inclusive = 7 days total)
        // Aug 21 - 7 days = Aug 15 to Aug 21 (7 days)
        startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1); // End of today
        periods = 7;
        break;
      case "30d":
        // Last 30 days: from 29 days ago to today (inclusive = 30 days total)
        startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1); // End of today
        periods = 30;
        break;
      case "12m":
        // Last 12 months: from 11 months ago to current month (inclusive = 12 months total)
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // End of current month
        periods = 12;
        break;
      default:
        startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1);
        periods = 7;
    }

    // Filter tasks within date range using local timezone comparison
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.createdDate);
      return taskDate >= startDate && taskDate <= endDate;
    });

    console.log(`📊 Filtered ${filteredTasks.length} tasks within ${timeRange} range`);

    // ✅ Initialize periods with zero counts for all task types
    const groupedData = new Map<string, ChartDataPoint>();

    if (timeRange === "24h") {
      // Group by hour - last 24 hours
      for (let i = 0; i < periods; i++) {
        const periodDate = new Date(startDate.getTime() + i * 60 * 60 * 1000);
        const key = `${periodDate.getFullYear()}-${(periodDate.getMonth() + 1).toString().padStart(2, '0')}-${periodDate.getDate().toString().padStart(2, '0')}T${periodDate.getHours().toString().padStart(2, '0')}`;
        const displayDate = periodDate.getHours().toString().padStart(2, '0') + ':00';
        
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
    } else if (timeRange === "12m") {
      // Group by month - last 12 months
      for (let i = 0; i < periods; i++) {
        const periodDate = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
        const key = `${periodDate.getFullYear()}-${(periodDate.getMonth() + 1).toString().padStart(2, '0')}`;
        const displayDate = periodDate.toLocaleDateString('vi-VN', {
          month: 'short',
          year: '2-digit',
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
    } else {
      // ✅ FIXED: Group by day - properly handle date ranges starting from correct date
      for (let i = 0; i < periods; i++) {
        // For 7d: start from 6 days ago and count forward to today
        // For 30d: start from 29 days ago and count forward to today
        const periodDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        
        // Use local timezone date components for consistent grouping
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
    }

    // Count tasks by period and task type
    filteredTasks.forEach(task => {
      const taskDate = new Date(task.createdDate);
      let key: string;

      if (timeRange === "24h") {
        key = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}T${taskDate.getHours().toString().padStart(2, '0')}`;
      } else if (timeRange === "12m") {
        key = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}`;
      } else {
        key = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
      }

      const period = groupedData.get(key);
      if (period) {
        const taskCategory = categorizeTaskType(task.taskType);
        period[taskCategory]++;
        period.totalTasks++;
      }
    });

    const result = Array.from(groupedData.values()).sort((a, b) => 
      new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime()
    );
    
    return result;
  }, [tasks, timeRange]);

  // Calculate dynamic Y-axis scale
  const yAxisScale = useMemo(() => {
    const maxTasksInAnyPeriod = Math.max(...chartData.map(item => item.totalTasks), 0);
    return calculateYAxisScale(maxTasksInAnyPeriod);
  }, [chartData]);

  // ✅ Enhanced Vietnamese tooltip with task type breakdown and smart zero handling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // ✅ Only show tooltip if there's actual data
      if (data.totalTasks === 0) return null;

      // ✅ Filter out zero values from display
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
            <h3 className="text-lg font-semibold">Thống kê công việc theo loại và thời gian</h3>
          </div>
          <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded w-32 h-8"></div>
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
      {/* Header with Time Range Filter */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold">Thống kê công việc theo loại và thời gian</h3>
          {error && (
            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs ml-2">
              Dữ liệu mẫu
            </span>
          )}
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIME_RANGES.map((range) => (
              <SelectItem key={range.value} value={range.value}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Chart with stacked bars and dynamic Y-axis */}
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
            angle={timeRange === "12m" ? -45 : 0}
            textAnchor={timeRange === "12m" ? "end" : "middle"}
            height={timeRange === "12m" ? 80 : 60}
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
            // ✅ Enhanced tooltip behavior - only show when hovering over bars with data
            allowEscapeViewBox={{ x: false, y: false }}
            position={{ x: undefined, y: undefined }}
          />
          <Legend content={<CustomLegend />} />
          
          {/* Stacked bars for each task type */}
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

      {/* Enhanced Summary with task type breakdown */}
      <div className="space-y-2">
        <div className="flex justify-center gap-6 text-sm text-muted-foreground">
          <span>
            Tổng nhiệm vụ: <span className="font-semibold text-foreground">
              {chartData.reduce((sum, item) => sum + item.totalTasks, 0)}
            </span>
          </span>
          <span>
            Trung bình/{timeRange === "24h" ? "giờ" : timeRange === "12m" ? "tháng" : "ngày"}: <span className="font-semibold text-foreground">
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
    </div>
  );
}