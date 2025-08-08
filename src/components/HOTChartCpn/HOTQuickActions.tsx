'use client';

import { 
  FolderGit2, 
  ClipboardList, 
  CircleCheckBig, 
  CircleEllipsis, 
  Users 
} from 'lucide-react';
import { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';

interface DashboardStats {
  requestStats: {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
  };
  taskStats: {
    pending: number;
    inProgress: number;
    completed: number;
    total: number;
  };
  mechanicStats: {
    available: number;
    inTask: number;
    total: number;
  };
}

interface HOTQuickActionsProps {
  dashboardStats: DashboardStats | null;
  loading?: boolean;
}

export default function HOTQuickActions({ dashboardStats, loading }: HOTQuickActionsProps) {
  const router = useRouter();

  const quickActionItems = useMemo(() => {
    if (!dashboardStats) return [];

    return [
      {
        id: "totalrequests",
        label: "Tổng yêu cầu",
        count: dashboardStats.requestStats.total,
        icon: FolderGit2,
        color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
        action: () => router.push(`/workspace/hot/requests`),
        clickable: true
      },
      {
        id: "totaltasks",
        label: "Tổng công việc",
        count: dashboardStats.taskStats.total,
        icon: ClipboardList,
        color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800',
        action: () => router.push(`/workspace/hot/tasks`),
        clickable: true
      },
      {
        id: "inprogresstasks",
        label: "Công việc đang xử lý",
        count: dashboardStats.taskStats.inProgress,
        icon: CircleEllipsis,
        color: 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
        action: () => router.push(`/workspace/hot/tasks?status=inProgress`),
        clickable: true
      },
      {
        id: "completedtasks",
        label: "Công việc hoàn thành",
        count: dashboardStats.taskStats.completed,
        icon: CircleCheckBig,
        color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800',
        action: () => router.push(`/workspace/hot/tasks?status=completed`),
        clickable: true
      },
      {
        id: "availablemechanics",
        label: "Thợ máy đang có sẵn",
        count: dashboardStats.mechanicStats.available,
        icon: Users,
        color: 'bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/20 dark:hover:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800',
        // Note: You may want to create a mechanics page or redirect to users with filter
        action: () => router.push(`/workspace/hot/users?role=mechanic&status=available`),
        clickable: false // Set to true when the mechanics page is available
      }
    ];
  }, [dashboardStats, router]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {quickActionItems.map((item) => {
        const IconComponent = item.icon;
        
        if (item.clickable && item.action) {
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`p-4 rounded-lg border shadow-sm transition-all cursor-pointer hover:shadow-md active:scale-95 ${item.color}`}
            >
              <div className="flex flex-col items-center gap-2.5">
                <IconComponent className="w-7 h-7" />
                <span className="text-sm font-medium text-center">{item.label}</span>
                <span className="text-2xl font-bold">{item.count}</span>
              </div>
            </button>
          );
        }

        return (
          <div
            key={item.id}
            className={`p-4 rounded-lg border shadow-sm transition-colors ${item.color.replace(/hover:bg-\w+-\d+/g, '').trim()}`}
          >
            <div className="flex flex-col items-center gap-2.5">
              <IconComponent className="w-7 h-7" />
              <span className="text-sm font-medium text-center">{item.label}</span>
              <span className="text-2xl font-bold">{item.count}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}