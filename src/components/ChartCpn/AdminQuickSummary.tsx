'use client';

import { useEffect, useState } from 'react';
import { Users, HardDrive, CheckSquare, FileText } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { USER_COUNT_BY_ROLE, DEVICE_STATISTICS, TASK_REQUEST_REPORT_TOTAL } from '@/types/dashboard.type';

interface AdminSummaryData {
  totalUsers: number;
  totalDevices: number;
  totalTasks: number;
  totalRequests: number;
}

export default function AdminQuickSummary() {
  const [summaryData, setSummaryData] = useState<AdminSummaryData>({
    totalUsers: 0,
    totalDevices: 0,
    totalTasks: 0,
    totalRequests: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAdminSummaryData();
  }, []);

  const fetchAdminSummaryData = async () => {
    try {
      setIsLoading(true);
      
      console.log("🔍 Fetching admin dashboard summary data...");
      
      const [userCountResponse, deviceStatsResponse, taskRequestReportResponse] = await Promise.all([
        apiClient.dashboard.getUserCountByRole(),
        apiClient.dashboard.getDeviceStatistics(),
        apiClient.dashboard.getTaskRequestReportTotal()
      ]);

      console.log("🔍 Raw responses:", {
        userCount: userCountResponse,
        deviceStats: deviceStatsResponse,
        taskRequestReport: taskRequestReportResponse
      });

      // Extract data from responses
      const userCountData: USER_COUNT_BY_ROLE = userCountResponse.data || userCountResponse;
      const deviceStatsData: DEVICE_STATISTICS = deviceStatsResponse.data || deviceStatsResponse;
      const taskRequestReportData: TASK_REQUEST_REPORT_TOTAL = taskRequestReportResponse.data || taskRequestReportResponse;

      console.log('🔍 Processed data:', {
        userCountData,
        deviceStatsData,
        taskRequestReportData
      });

      setSummaryData({
        totalUsers: userCountData.totalUsers || 0,
        totalDevices: deviceStatsData.totalDevices || 0,
        totalTasks: taskRequestReportData.totalTasks || 0,
        totalRequests: taskRequestReportData.totalRequests || 0
      });

      console.log('✅ Admin summary data updated:', {
        totalUsers: userCountData.totalUsers,
        totalDevices: deviceStatsData.totalDevices,
        totalTasks: taskRequestReportData.totalTasks,
        totalRequests: taskRequestReportData.totalRequests
      });
    } catch (error) {
      console.error('❌ Error fetching admin summary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summaryCards = [
    {
      label: "Người dùng (Tất cả)",
      value: summaryData.totalUsers,
      icon: Users,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    },
    {
      label: "Thiết bị (Toàn bộ)",
      value: summaryData.totalDevices,
      icon: HardDrive,
      color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800",
    },
    {
      label: "Công việc (Tất cả)",
      value: summaryData.totalTasks,
      icon: CheckSquare,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    },
    {
      label: "Yêu cầu (Toàn bộ)",
      value: summaryData.totalRequests,
      icon: FileText,
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((item) => {
        const IconComponent = item.icon;
        return (
          <div
            key={item.label}
            className={`p-4 rounded-lg border transition-colors ${item.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
              <IconComponent className="w-8 h-8" />
            </div>
          </div>
        );
      })}
    </div>
  );
}