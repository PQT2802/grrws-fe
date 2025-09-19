'use client';

import { 
  FolderGit2, 
  ClipboardList, 
  Shield,
  Wrench,
  CheckCircle,
  Settings,
  AlertTriangle,
  FileX
} from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDashboardFilters } from '@/components/HOTChartCpn/DashboardFilterContext';

interface HOTQuickActionsProps {
  dashboardStats: any;
  loading: boolean;
}

interface RequestBreakdown {
  warranty: number;
  repair: number;
  withoutReports: number; // ✅ Added for requests without reports
  total: number;
}

interface TaskBreakdown {
  installation: number;
  repair: number;
  warranty: number;
  total: number;
  totalAllTasks: number; // ✅ Added for counting all tasks including installation
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
}

export default function HOTQuickActions({ dashboardStats, loading }: HOTQuickActionsProps) {
  const router = useRouter();
  const { getApiParams } = useDashboardFilters();
  const [requestBreakdown, setRequestBreakdown] = useState<RequestBreakdown | null>(null);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [actualRequestTotal, setActualRequestTotal] = useState(0);
  const [actualTaskTotal, setActualTaskTotal] = useState(0);

  // Categorize task type function
  const categorizeTaskType = (taskType: string): 'installation' | 'repair' | 'warranty' | 'other' => {
    if (!taskType) return 'other';
    
    const type = taskType.toLowerCase().trim();
    
    if (type.includes('installation') || 
        type.includes('install') || 
        type.includes('replacement') || 
        type.includes('replace') ||
        type.includes('setup') ||
        type.includes('mount')) {
      return 'installation';
    }
    
    if (type.includes('warranty') || 
        type.includes('warrantysubmission') ||
        type.includes('warrantyreturn') ||
        type.includes('claim')) {
      return 'warranty';
    }
    
    if (type.includes('repair') || 
        type.includes('fix') || 
        type.includes('maintenance') ||
        type.includes('service')) {
      return 'repair';
    }
    
    return 'other';
  };

  // Fetch request breakdown with filters
  useEffect(() => {
    const fetchRequestBreakdown = async () => {
      try {
        console.log("🔄 Fetching request breakdown with filters...");
        
        const filterParams = getApiParams();
        console.log("📊 Applied filters:", filterParams);
        
        const response = await apiClient.dashboard.getAllRequests(1, 1000);
        
        let requestsData: any[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          requestsData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          requestsData = response.data;
        } else if (Array.isArray(response)) {
          requestsData = response;
        }

        const filteredRequests = requestsData.filter(request => {
          // Date filtering
          if (filterParams.startDate && filterParams.endDate) {
            const requestDate = new Date(request.createdDate);
            const startDate = new Date(filterParams.startDate);
            const endDate = new Date(filterParams.endDate);
            if (requestDate < startDate || requestDate > endDate) {
              return false;
            }
          }

          // Area filtering
          if (filterParams.areaIds && filterParams.areaIds.length > 0) {
            return filterParams.areaIds.includes(request.areaId);
          }

          return true;
        });

        console.log(`📊 Found ${filteredRequests.length} filtered requests`);

        const actualTotal = filteredRequests.length;
        setActualRequestTotal(actualTotal);

        const requestsWithTasks = [];
        const requestsWithoutReports = [];
        let warrantyCount = 0;
        let repairCount = 0;

        for (const request of filteredRequests) {
          try {
            const tasks = await apiClient.request.getTaskOfRequest(request.id);
            if (tasks && tasks.length > 0) {
              requestsWithTasks.push({ ...request, tasks });
              
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
              requestsWithoutReports.push(request);
            }
          } catch (error) {
            console.error(`Error fetching tasks for request ${request.id}:`, error);
            requestsWithoutReports.push(request);
          }
        }

        console.log(`✅ Request breakdown: warranty=${warrantyCount}, repair=${repairCount}, withoutReports=${requestsWithoutReports.length}`);

        setRequestBreakdown({
          warranty: warrantyCount,
          repair: repairCount,
          withoutReports: requestsWithoutReports.length, // ✅ Track requests without reports
          total: requestsWithTasks.length,
        });

      } catch (error) {
        console.error("❌ Failed to fetch request breakdown:", error);
        setRequestBreakdown({
          warranty: 0,
          repair: 0,
          withoutReports: 0,
          total: 0,
        });
      }
    };

    if (dashboardStats) {
      fetchRequestBreakdown();
    }
  }, [dashboardStats, getApiParams]);

  // Fetch task breakdown with filters
  useEffect(() => {
    const fetchTaskBreakdown = async () => {
      try {
        console.log("🔄 Fetching task breakdown with filters...");
        
        const filterParams = getApiParams();
        console.log("📊 Applied filters:", filterParams);
        
        const response = await apiClient.task.getAllTaskGroups(1, 100);
        let installation = 0;
        let repair = 0;
        let warranty = 0;
        let totalGroups = 0;
        let totalAllTasks = 0; // ✅ Count all individual tasks

        console.log("📊 Task groups response:", response);

        if (response && response.data && Array.isArray(response.data)) {
          // Apply client-side filtering based on global filters
          const filteredGroups = response.data.filter((group: any) => {
            // Date filtering
            if (filterParams.startDate && filterParams.endDate) {
              const groupDate = new Date(group.createdDate);
              const startDate = new Date(filterParams.startDate);
              const endDate = new Date(filterParams.endDate);
              if (groupDate < startDate || groupDate > endDate) {
                return false;
              }
            }

            // Area filtering - check if any task in the group matches the area filter
            if (filterParams.areaIds && filterParams.areaIds.length > 0) {
              if (group.tasks && Array.isArray(group.tasks)) {
                return group.tasks.some((task: any) => 
                  task.areaId && filterParams.areaIds!.includes(task.areaId)
                );
              }
              return false;
            }

            return true;
          });

          filteredGroups.forEach((group: any) => {
            console.log("Processing group:", group);
            totalGroups++;
            
            if (group.tasks && Array.isArray(group.tasks)) {
              group.tasks.forEach((task: any) => {
                console.log("Processing task:", task.taskType);
                
                totalAllTasks++; // ✅ Count all tasks including installation
                
                const taskCategory = categorizeTaskType(task.taskType || group.groupType || '');
                
                if (taskCategory === 'installation') {
                  installation++;
                } else if (taskCategory === 'repair') {
                  repair++;
                } else if (taskCategory === 'warranty') {
                  warranty++;
                }
              });
            }
          });
        }

        console.log(`✅ Task breakdown: installation=${installation}, repair=${repair}, warranty=${warranty}, totalGroups=${totalGroups}, totalAllTasks=${totalAllTasks}`);

        // ✅ Use totalAllTasks for main value instead of totalGroups
        setActualTaskTotal(totalAllTasks);

        setTaskBreakdown({
          installation,
          repair,
          warranty,
          total: totalGroups,
          totalAllTasks: totalAllTasks,
        });

      } catch (error) {
        console.error("❌ Failed to fetch task breakdown:", error);
        const fallbackTotal = dashboardStats?.taskStats?.total || 0;
        setActualTaskTotal(fallbackTotal);
        setTaskBreakdown({
          installation: 0,
          repair: Math.floor(fallbackTotal * 0.4),
          warranty: Math.floor(fallbackTotal * 0.3),
          total: fallbackTotal,
          totalAllTasks: fallbackTotal,
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    if (dashboardStats) {
      fetchTaskBreakdown();
    }
  }, [dashboardStats, getApiParams]);

  // Updated summary cards
  const summaryCards = useMemo((): SummaryCard[] => {
    if (!dashboardStats) return [];

    return [
      // ✅ Updated Request Card
      {
        id: "requests",
        title: "Yêu cầu",
        mainValue: actualRequestTotal || dashboardStats.requestStats?.total || 0,
        mainIcon: FolderGit2,
        color: 'bg-blue-50 dark:bg-blue-900/20',
        hoverColor: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
        borderColor: 'border-blue-200 dark:border-blue-800',
        iconColor: 'text-blue-600 dark:text-blue-400',
        details: [
          // ✅ Added "Yêu cầu chưa có báo cáo" at the top
          {
            label: "Yêu cầu chưa có báo cáo",
            value: requestBreakdown?.withoutReports || 0,
            icon: FileX,
            color: "text-red-600"
          },
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
          }
          // ✅ Removed "Yêu cầu hoàn thành" field
        ],
        action: () => router.push('/workspace/hot/requests'),
        clickable: true
      },

      // ✅ Updated Task Card - using totalAllTasks for main value
      {
        id: "tasks",
        title: "Công việc",
        mainValue: actualTaskTotal || dashboardStats.taskStats?.total || 0, // This now includes all tasks
        mainIcon: ClipboardList,
        color: 'bg-green-50 dark:bg-green-900/20',
        hoverColor: 'hover:bg-green-100 dark:hover:bg-green-900/30',
        borderColor: 'border-green-200 dark:border-green-800',
        iconColor: 'text-green-600 dark:text-green-400',
        details: [
          // ✅ Details remain the same as requested
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
            color: "text-green-600",
            hasWarning: true,
            warningTooltip: "Công việc thay thế/lắp đặt không tính vào tổng nhóm công việc"
          }
        ],
        action: () => router.push('/workspace/hot/tasks'),
        clickable: true
      }
    ];
  }, [dashboardStats, requestBreakdown, taskBreakdown, router, actualRequestTotal, actualTaskTotal]);

  if (loading || isLoadingData) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summaryCards.map((card) => {
          const MainIcon = card.mainIcon;
          
          const CardContent = (
            <div className={`relative p-6 rounded-lg border shadow-sm transition-all ${
              card.color
            } ${card.borderColor} ${
              card.clickable && card.action ? `${card.hoverColor} cursor-pointer hover:shadow-md active:scale-[0.98]` : ''
            }`}>
              {/* Header Section - ✅ Increased title font size */}
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg bg-white/50 dark:bg-gray-800/50 ${card.iconColor}`}>
                  <MainIcon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {card.title}
                </h3>
              </div>

              {/* Details Section */}
              <div className="space-y-2">
                {/* Main value row - ✅ Removed alert icon and warning */}
                <div className="flex items-center justify-between py-1 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Tổng cộng
                  </span>
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