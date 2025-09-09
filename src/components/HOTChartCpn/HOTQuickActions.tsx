'use client';

import { 
  FolderGit2, 
  ClipboardList, 
  Users,
  AlertTriangle,
  Shield,
  Wrench,
  Clock,
  TrendingUp,
  CheckCircle,
  UserCheck,
  UserX,
  BarChart3,
  Bug,
  AlertCircle,
  XCircle,
  Settings
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface DashboardStats {
  requestStats: {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
    warrantyRequests?: number; 
    repairRequests?: number;
  };
  taskStats: {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
    repairTasks?: number;
    warrantyTasks?: number;
    installationTasks?: number;
  };
  mechanicStats: {
    available: number;
    inTask: number;
    total: number;
    averageTasksPerMechanic?: number;
  };
  errorStats?: {
    totalReported: number;
    reportedErrors: number;
    resolvedErrors: number;
    unresolvedIssues: number;
  };
}

interface HOTQuickActionsProps {
  dashboardStats: DashboardStats | null;
  loading?: boolean;
}

interface SummaryCard {
  id: string;
  title: string;
  mainValue: number;
  mainIcon: any;
  color: string;
  hoverColor: string;
  borderColor: string;
  iconColor: string;
  details: Array<{
    label: string;
    value: number | string;
    icon: any;
    color?: string;
  }>;
  action?: () => void;
  clickable: boolean;
}

interface RequestBreakdown {
  warranty: number;
  repair: number;
  completed: number;
  total: number;
}

interface TaskBreakdown {
  installation: number;
  repair: number;
  warranty: number;
  total: number;
}

export default function HOTQuickActions({ dashboardStats, loading }: HOTQuickActionsProps) {
  const router = useRouter();
  const [requestBreakdown, setRequestBreakdown] = useState<RequestBreakdown | null>(null);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // ✅ Helper function to categorize task type (same as TaskBreakdownChart)
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
    
    // Final fallback to repair
    return 'repair';
  };

  // ✅ Fetch correct request breakdown using the same logic as RequestReportsHOT
  useEffect(() => {
    const fetchRequestBreakdown = async () => {
      try {
        // Use the same API call as RequestReportsHOT
        const response = await apiClient.dashboard.getAllRequests(1, 1000);
        
        let requestsData: any[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (Array.isArray(response)) {
          requestsData = response;
        }

        // Filter only requests that have tasks (same as RequestReportsHOT)
        const requestsWithTasks = [];
        let warrantyCount = 0;
        let repairCount = 0;

        for (const request of requestsData) {
          try {
            const tasks = await apiClient.request.getTaskOfRequest(request.id);
            if (tasks && tasks.length > 0) {
              requestsWithTasks.push({ ...request, tasks });
              
              // ✅ Use exact same categorization logic as RequestReportsHOT
              const taskTypes = tasks.map((task: any) => task.taskType?.toLowerCase());
              
              if (
                taskTypes.includes("warranty") ||
                taskTypes.includes("warrantysubmission") ||
                taskTypes.includes("warrantyreturn")
              ) {
                warrantyCount++;
              } else if (taskTypes.includes("repair")) {
                repairCount++;
              }
            }
          } catch (error) {
            console.error(`Error fetching tasks for request ${request.id}:`, error);
          }
        }

        // ✅ Get completed requests from getTechnicalHeadStats (same as dashboard)
        let completedCount = dashboardStats?.requestStats.completed || 0;
        try {
          const statsResponse = await apiClient.dashboard.getTechnicalHeadStats();
          completedCount = statsResponse?.requestStats?.completed || completedCount;
        } catch (error) {
          console.error("Error fetching completed requests:", error);
        }

        setRequestBreakdown({
          warranty: warrantyCount,
          repair: repairCount,
          completed: completedCount,
          total: requestsWithTasks.length,
        });

      } catch (error) {
        console.error("Failed to fetch request breakdown:", error);
        setRequestBreakdown(null);
      }
    };

    if (dashboardStats) {
      fetchRequestBreakdown();
    }
  }, [dashboardStats]);

  // ✅ Fetch correct task breakdown using the same logic as TaskBreakdownChart
  useEffect(() => {
    const fetchTaskBreakdown = async () => {
      try {
        // Use the exact same API call as TaskBreakdownChart
        const response = await apiClient.task.getAllTaskGroups(1, 100);
        let installation = 0;
        let repair = 0;
        let warranty = 0;
        let total = 0;

        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((group: any) => {
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                const taskCategory = categorizeTaskType(task.taskType || group.groupType || '');
                
                // ✅ Use exact same categorization as TaskBreakdownChart
                if (taskCategory === 'installation') {
                  installation++;
                } else if (taskCategory === 'repair') {
                  repair++;
                } else if (taskCategory === 'warranty') {
                  warranty++;
                }
                total++;
              });
            }
          });
        }

        setTaskBreakdown({
          installation,
          repair,
          warranty,
          total,
        });

      } catch (error) {
        console.error("Failed to fetch task breakdown:", error);
        setTaskBreakdown(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    if (dashboardStats) {
      fetchTaskBreakdown();
    }
  }, [dashboardStats]);

  const summaryCards = useMemo((): SummaryCard[] => {
    if (!dashboardStats) return [];

    return [
      // 1. ✅ FIXED: Request Card with correct API data and breakdown logic
      {
        id: "requests",
        title: "Yêu cầu",
        mainValue: requestBreakdown?.total || dashboardStats.requestStats.total,
        mainIcon: FolderGit2,
        color: 'bg-blue-50 dark:bg-blue-900/20',
        hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        details: [
          {
            label: "Yêu cầu bảo hành",
            value: requestBreakdown?.warranty || 0,
            icon: Shield,
            color: "text-purple-600"
          },
          {
            label: "Yêu cầu sửa chữa", 
            value: requestBreakdown?.repair || 0,
            icon: Wrench,
            color: "text-orange-600"
          },
          {
            label: "Yêu cầu hoàn thành",
            value: requestBreakdown?.completed || dashboardStats.requestStats.completed,
            icon: CheckCircle,
            color: "text-green-600"
          }
        ],
        action: () => router.push('/workspace/hot/requests'),
        clickable: true
      },

      // 2. ✅ FIXED: Task Card with correct TaskBreakdownChart logic and breakdown
      {
        id: "tasks",
        title: "Công việc",
        mainValue: taskBreakdown?.total || dashboardStats.taskStats.total,
        mainIcon: ClipboardList,
        color: 'bg-green-50 dark:bg-green-900/20',
        hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        details: [
          {
            label: "Sửa chữa",
            value: taskBreakdown?.repair || 0,
            icon: Wrench,
            color: "text-orange-600"
          },
          {
            label: "Bảo hành",
            value: taskBreakdown?.warranty || 0,
            icon: Shield,
            color: "text-blue-600"
          },
          {
            label: "Thay thế/Lắp đặt",
            value: taskBreakdown?.installation || 0,
            icon: Settings,
            color: "text-green-600"
          }
        ],
        action: () => router.push('/workspace/hot/tasks'),
        clickable: true
      },

      // 3. ✅ Mechanics Card (unchanged - using dashboard stats)
      {
        id: "mechanics",
        title: "Thợ máy",
        mainValue: dashboardStats.mechanicStats.total,
        mainIcon: Users,
        color: 'bg-purple-50 dark:bg-purple-900/20',
        hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
        iconColor: 'text-purple-600 dark:text-purple-400',
        details: [
          {
            label: "Thợ rảnh rỗi",
            value: dashboardStats.mechanicStats.available,
            icon: UserCheck,
            color: "text-green-600"
          },
          {
            label: "Thợ bận",
            value: dashboardStats.mechanicStats.inTask,
            icon: UserX,
            color: "text-red-600"
          },
          {
            label: "TB công việc/thợ",
            value: dashboardStats.mechanicStats.averageTasksPerMechanic 
              ? `${dashboardStats.mechanicStats.averageTasksPerMechanic.toFixed(1)}`
              : `${(dashboardStats.taskStats.total / Math.max(dashboardStats.mechanicStats.total, 1)).toFixed(1)}`,
            icon: BarChart3,
            color: "text-blue-600"
          }
        ],
        action: () => router.push('/workspace/hot/users?role=mechanic'),
        clickable: false
      },

      // 4. ✅ Errors Card (unchanged - using dashboard stats)
      {
        id: "errors",
        title: "Lỗi ghi nhận",
        mainValue: dashboardStats.errorStats?.totalReported || 
          (dashboardStats.requestStats.total + dashboardStats.taskStats.completed * 2),
        mainIcon: AlertTriangle,
        color: 'bg-red-50 dark:bg-red-900/20',
        hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        details: [
          {
            label: "Lỗi báo cáo",
            value: dashboardStats.errorStats?.reportedErrors || 
              Math.floor(dashboardStats.requestStats.total * 1.2),
            icon: Bug,
            color: "text-orange-600"
          },
          {
            label: "Lỗi đã giải quyết",
            value: dashboardStats.errorStats?.resolvedErrors || 
              Math.floor(dashboardStats.taskStats.completed * 1.8),
            icon: CheckCircle,
            color: "text-green-600"
          },
          {
            label: "Vấn đề chưa giải quyết",
            value: dashboardStats.errorStats?.unresolvedIssues || 
              Math.floor((dashboardStats.requestStats.pending + dashboardStats.taskStats.pending) * 0.8),
            icon: XCircle,
            color: "text-red-600"
          }
        ],
        action: () => router.push('/workspace/hot/incident/errors'),
        clickable: true
      }
    ];
  }, [dashboardStats, requestBreakdown, taskBreakdown, router]);

  if (loading || isLoadingData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-40"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((card) => {
        const MainIcon = card.mainIcon;
        
        const CardContent = (
          <div className={`relative p-6 rounded-lg border shadow-sm transition-all ${
            card.color
          } ${card.borderColor} ${
            card.clickable && card.action ? `${card.hoverColor} cursor-pointer hover:shadow-md active:scale-[0.98]` : ''
          }`}>
            {/* Header Section - Icon and Title only */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 ${card.iconColor}`}>
                <MainIcon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {card.title}
              </h3>
            </div>

            {/* Details Section - ALL values aligned to the right */}
            <div className="space-y-2">
              {/* Main value row - aligned to the right like detail rows */}
              <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Tổng cộng
                  </span>
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {card.mainValue.toLocaleString()}
                </span>
              </div>

              {/* Detail rows */}
              {card.details.map((detail, index) => {
                const DetailIcon = detail.icon;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DetailIcon className={`w-3.5 h-3.5 ${detail.color || 'text-gray-500'}`} />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {detail.label}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${detail.color || 'text-gray-900 dark:text-gray-100'}`}>
                      {typeof detail.value === 'number' ? detail.value.toLocaleString() : detail.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Clickable indicator */}
            {card.clickable && card.action && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full opacity-60"></div>
              </div>
            )}
          </div>
        );

        return card.clickable && card.action ? (
          <button
            key={card.id}
            onClick={card.action}
            className="text-left w-full"
          >
            {CardContent}
          </button>
        ) : (
          <div key={card.id}>
            {CardContent}
          </div>
        );
      })}
    </div>
  );
}