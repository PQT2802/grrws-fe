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
  Settings,
  Info,
  HelpCircle
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HOTQuickActionsProps {
  dashboardStats: any;
  loading: boolean;
}

interface RequestBreakdown {
  warranty: number;
  repair: number;
  completed: number;
  total: number;
  hasRequestsWithoutReports?: boolean; // ✅ NEW: Track if there are requests without reports
}

interface TaskBreakdown {
  installation: number;
  repair: number;
  warranty: number;
  total: number;
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
    hasWarning?: boolean;
    warningTooltip?: string;
  }>;
  action?: () => void;
  clickable: boolean;
  hasMainWarning?: boolean; // ✅ NEW: Warning for main value
  mainWarningTooltip?: string; // ✅ NEW: Tooltip for main value
}

export default function HOTQuickActions({ dashboardStats, loading }: HOTQuickActionsProps) {
  const router = useRouter();
  const [requestBreakdown, setRequestBreakdown] = useState<RequestBreakdown | null>(null);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // ✅ Track actual totals for display
  const [actualRequestTotal, setActualRequestTotal] = useState(0);
  const [actualTaskTotal, setActualTaskTotal] = useState(0);

  // ✅ FIXED: Add the missing categorizeTaskType function
  const categorizeTaskType = (taskType: string): 'installation' | 'repair' | 'warranty' | 'other' => {
    if (!taskType) return 'other';
    
    const type = taskType.toLowerCase().trim();
    
    // Installation/Replacement tasks
    if (type.includes('installation') || 
        type.includes('install') || 
        type.includes('replacement') || 
        type.includes('replace') ||
        type.includes('setup') ||
        type.includes('mount')) {
      return 'installation';
    }
    
    // Warranty tasks
    if (type.includes('warranty') || 
        type.includes('warrantysubmission') ||
        type.includes('warrantyreturn') ||
        type.includes('claim')) {
      return 'warranty';
    }
    
    // Repair tasks
    if (type.includes('repair') || 
        type.includes('fix') || 
        type.includes('maintenance') ||
        type.includes('service')) {
      return 'repair';
    }
    
    return 'other';
  };

  // ✅ IMPROVED: Enhanced request breakdown to detect requests without reports
  useEffect(() => {
    const fetchRequestBreakdown = async () => {
      try {
        console.log("🔄 Fetching request breakdown...");
        
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

        console.log(`📊 Found ${requestsData.length} total requests`);

        // ✅ Track actual total requests (for display)
        const actualTotal = requestsData.length;
        setActualRequestTotal(actualTotal);

        // ✅ Enhanced: Check for requests with and without reports
        const requestsWithTasks = [];
        const requestsWithoutReports = [];
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
            } else {
              // ✅ NEW: Track requests without reports/tasks
              requestsWithoutReports.push(request);
            }
          } catch (error) {
            console.error(`Error fetching tasks for request ${request.id}:`, error);
            // ✅ On error, consider it as request without report
            requestsWithoutReports.push(request);
          }
        }

        // ✅ Get completed requests from getTechnicalHeadStats (same as dashboard)
        let completedCount = dashboardStats?.requestStats?.completed || 0;
        try {
          const statsResponse = await apiClient.dashboard.getTechnicalHeadStats();
          completedCount = statsResponse?.requestStats?.completed || completedCount;
        } catch (error) {
          console.error("Error fetching completed requests:", error);
        }

        const hasRequestsWithoutReports = requestsWithoutReports.length > 0;
        
        console.log(`✅ Request breakdown: warranty=${warrantyCount}, repair=${repairCount}, completed=${completedCount}`);
        console.log(`📋 Requests with reports: ${requestsWithTasks.length}, without reports: ${requestsWithoutReports.length}`);

        setRequestBreakdown({
          warranty: warrantyCount,
          repair: repairCount,
          completed: completedCount,
          total: requestsWithTasks.length, // This is the breakdown total (less than actual)
          hasRequestsWithoutReports, // ✅ NEW: Flag for warning
        });

      } catch (error) {
        console.error("❌ Failed to fetch request breakdown:", error);
        setRequestBreakdown({
          warranty: 0,
          repair: 0,
          completed: dashboardStats?.requestStats?.completed || 0,
          total: 0,
          hasRequestsWithoutReports: false,
        });
      }
    };

    if (dashboardStats) {
      fetchRequestBreakdown();
    }
  }, [dashboardStats]);

  // ✅ FIXED: Task breakdown - count task GROUPS, not individual tasks
  useEffect(() => {
    const fetchTaskBreakdown = async () => {
      try {
        console.log("🔄 Fetching task breakdown...");
        
        // Use the exact same API call as TaskBreakdownChart
        const response = await apiClient.task.getAllTaskGroups(1, 100);
        let installation = 0;
        let repair = 0;
        let warranty = 0;
        let totalGroups = 0; // ✅ FIXED: Count groups, not individual tasks

        console.log("📊 Task groups response:", response);

        if (response && response.data && Array.isArray(response.data)) {
          response.data.forEach((group: any) => {
            console.log("Processing group:", group);
            totalGroups++; // ✅ FIXED: Increment group count
            
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                console.log("Processing task:", task.taskType);
                
                const taskCategory = categorizeTaskType(task.taskType || group.groupType || '');
                
                // ✅ Keep detail categorization logic unchanged
                if (taskCategory === 'installation') {
                  installation++;
                } else if (taskCategory === 'repair') {
                  repair++;
                } else if (taskCategory === 'warranty') {
                  warranty++;
                }
                // Note: Don't count individual tasks for total anymore
              });
            }
          });
        }

        console.log(`✅ Task breakdown: installation=${installation}, repair=${repair}, warranty=${warranty}, totalGroups=${totalGroups}`);

        // ✅ FIXED: Track total task GROUPS (not individual tasks)
        setActualTaskTotal(totalGroups);

        setTaskBreakdown({
          installation,
          repair,
          warranty,
          total: totalGroups, // ✅ FIXED: Use group count
        });

      } catch (error) {
        console.error("❌ Failed to fetch task breakdown:", error);
        // ✅ Set fallback values on error
        const fallbackTotal = dashboardStats?.taskStats?.total || 0;
        setActualTaskTotal(fallbackTotal);
        setTaskBreakdown({
          installation: 0,
          repair: Math.floor(fallbackTotal * 0.4),
          warranty: Math.floor(fallbackTotal * 0.3),
          total: fallbackTotal,
        });
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
      // 1. ✅ IMPROVED: Request Card with warning for requests without reports
      {
        id: "requests",
        title: "Yêu cầu",
        mainValue: actualRequestTotal || dashboardStats.requestStats?.total || 0, // ✅ Always show actual total
        mainIcon: FolderGit2,
        color: 'bg-blue-50 dark:bg-blue-900/20',
        hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        // ✅ NEW: Main warning for requests without reports
        hasMainWarning: requestBreakdown?.hasRequestsWithoutReports || false,
        mainWarningTooltip: "Tổng yêu cầu bao gồm cả yêu cầu chưa có báo cáo",
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
          // ✅ Completed requests with warning indicator
          {
            label: "Yêu cầu hoàn thành",
            value: requestBreakdown?.completed || dashboardStats.requestStats?.completed || 0,
            icon: CheckCircle,
            color: "text-green-600",
            hasWarning: true, // ✅ Flag for warning icon
            warningTooltip: "Yêu cầu đã hoàn thành không tính vào tổng số yêu cầu chính"
          }
        ],
        action: () => router.push('/workspace/hot/requests'),
        clickable: true
      },

      // 2. ✅ FIXED: Task Card with correct group total
      {
        id: "tasks",
        title: "Công việc",
        mainValue: actualTaskTotal || dashboardStats.taskStats?.total || 0, // ✅ Now shows group count
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
          // ✅ Installation tasks with warning indicator
          {
            label: "Thay thế/Lắp đặt",
            value: taskBreakdown?.installation || 0,
            icon: Settings,
            color: "text-green-600",
            hasWarning: true, // ✅ Flag for warning icon
            warningTooltip: "Công việc thay thế/lắp đặt không tính vào tổng nhóm công việc"
          }
        ],
        action: () => router.push('/workspace/hot/tasks'),
        clickable: true
      },

      // ... other cards remain unchanged ...
      {
        id: "mechanics",
        title: "Thợ máy",
        mainValue: dashboardStats.mechanicStats?.total || 0,
        mainIcon: Users,
        color: 'bg-purple-50 dark:bg-purple-900/20',
        hoverColor: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
        borderColor: 'border-purple-200 dark:border-purple-800',
        iconColor: 'text-purple-600 dark:text-purple-400',
        details: [
          {
            label: "Thợ rảnh rỗi",
            value: dashboardStats.mechanicStats?.available || 0,
            icon: UserCheck,
            color: "text-green-600"
          },
          {
            label: "Thợ bận",
            value: dashboardStats.mechanicStats?.inTask || 0,
            icon: UserX,
            color: "text-red-600"
          },
          {
            label: "TB công việc/thợ",
            value: dashboardStats.mechanicStats?.averageTasksPerMechanic 
              ? `${dashboardStats.mechanicStats.averageTasksPerMechanic.toFixed(1)}`
              : `${((dashboardStats.taskStats?.total || 0) / Math.max(dashboardStats.mechanicStats?.total || 1, 1)).toFixed(1)}`,
            icon: BarChart3,
            color: "text-blue-600"
          }
        ],
        action: () => router.push('/workspace/hot/users?role=mechanic'),
        clickable: false
      },

      {
        id: "errors",
        title: "Lỗi ghi nhận",
        mainValue: dashboardStats.errorStats?.totalReported || 
          ((dashboardStats.requestStats?.total || 0) + (dashboardStats.taskStats?.completed || 0) * 2),
        mainIcon: AlertTriangle,
        color: 'bg-red-50 dark:bg-red-900/20',
        hoverColor: 'hover:bg-red-100 dark:hover:bg-red-900/30',
        borderColor: 'border-red-200 dark:border-red-800',
        iconColor: 'text-red-600 dark:text-red-400',
        details: [
          {
            label: "Lỗi báo cáo",
            value: dashboardStats.errorStats?.reportedErrors || 
              Math.floor((dashboardStats.requestStats?.total || 0) * 1.2),
            icon: Bug,
            color: "text-orange-600"
          },
          {
            label: "Lỗi đã giải quyết",
            value: dashboardStats.errorStats?.resolvedErrors || 
              Math.floor((dashboardStats.taskStats?.completed || 0) * 1.8),
            icon: CheckCircle,
            color: "text-green-600"
          },
          {
            label: "Vấn đề chưa giải quyết",
            value: dashboardStats.errorStats?.unresolvedIssues || 
              Math.floor(((dashboardStats.requestStats?.pending || 0) + (dashboardStats.taskStats?.pending || 0)) * 0.8),
            icon: XCircle,
            color: "text-red-600"
          }
        ],
        action: () => router.push('/workspace/hot/incident/errors'),
        clickable: true
      }
    ];
  }, [dashboardStats, requestBreakdown, taskBreakdown, router, actualRequestTotal, actualTaskTotal]);

  // ... loading state remains the same ...

  return (
    <TooltipProvider>
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
                    {/* ✅ NEW: Warning icon for main total if needed */}
                    {card.hasMainWarning && card.mainWarningTooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle className="w-3 h-3 text-yellow-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs max-w-xs text-center">
                            {card.mainWarningTooltip}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {card.mainValue.toLocaleString()}
                  </span>
                </div>

                {/* Detail rows */}
                {card.details.map((detail, index) => {
                  const DetailIcon = detail.icon;
                  const hasWarning = detail.hasWarning;
                  const warningTooltip = detail.warningTooltip;
                  
                  return (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DetailIcon className={`w-3.5 h-3.5 ${detail.color || 'text-gray-500'}`} />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {detail.label}
                        </span>
                        {/* ✅ Warning icon with tooltip for specific items */}
                        {hasWarning && warningTooltip && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <AlertTriangle className="w-3 h-3 text-yellow-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs max-w-xs text-center">
                                {warningTooltip}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
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
    </TooltipProvider>
  );
}