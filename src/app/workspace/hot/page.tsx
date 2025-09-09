"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import HOTNotificationArea from "@/components/HOTChartCpn/HOTNotificationArea";
import HOTQuickActions from "@/components/HOTChartCpn/HOTQuickActions";
import RequestStatusPieChart from "@/components/HOTChartCpn/RequestStatusPieChart";
import TaskStatusPieChart from "@/components/HOTChartCpn/TaskStatusPieChart";
import CombinedBarChart from "@/components/HOTChartCpn/CombinedBarChart";
import TaskBreakdownChart from "@/components/HOTChartCpn/TaskBreakdownChart";
import IncidentOverviewChart from "@/components/HOTChartCpn/IncidentOverviewChart"; // ✅ Import new component

// Define the dashboard data types
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
  requestChart: Array<{
    label: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  taskChart: Array<{
    label: string;
    value: number;
    color: string;
    percentage: number;
  }>;
  mechanicChart: Array<{
    label: string;
    value: number;
    color: string;
    percentage: number;
  }>;
}

const DetailWorkspacePage = () => {
  const { user, canAccessWorkspace, loading: authLoading } = useAuth();
  const router = useRouter();

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Redirect if user can't access workspace (but don't block render)
  useEffect(() => {
    if (!authLoading && !canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [authLoading, canAccessWorkspace, router]);

  // Fetch dashboard statistics - Remove workspace ID dependency
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        const response = await apiClient.dashboard.getTechnicalHeadStats();
        setDashboardStats(response);
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only check if user is authenticated and has access
    if (!authLoading && canAccessWorkspace) {
      fetchDashboardStats();
    }
  }, [authLoading, canAccessWorkspace]);

  // Prepare chart data with calculated percentages
  const chartData = useMemo(() => {
    if (!dashboardStats)
      return { requests: [], tasks: [], mechanics: [], combined: [] };

    // Calculate percentages for requests
    const requestTotal = dashboardStats.requestStats.total || 1;
    const requestsWithPercentage = [
      {
        name: "Chờ xử lý",
        value: dashboardStats.requestStats.pending,
        color: "#FFA726",
        percentage: Number(
          ((dashboardStats.requestStats.pending / requestTotal) * 100).toFixed(
            1
          )
        ),
      },
      {
        name: "Đang xử lý",
        value: dashboardStats.requestStats.inProgress,
        color: "#42A5F5",
        percentage: Number(
          (
            (dashboardStats.requestStats.inProgress / requestTotal) *
            100
          ).toFixed(1)
        ),
      },
      {
        name: "Hoàn thành",
        value: dashboardStats.requestStats.completed,
        color: "#66BB6A",
        percentage: Number(
          (
            (dashboardStats.requestStats.completed / requestTotal) *
            100
          ).toFixed(1)
        ),
      },
    ].filter((item) => item.value > 0);

    // Calculate percentages for tasks
    const taskTotal = dashboardStats.taskStats.total || 1;
    const tasksWithPercentage = [
      {
        name: "Chờ xử lý",
        value: dashboardStats.taskStats.pending,
        color: "#FF7043",
        percentage: Number(
          ((dashboardStats.taskStats.pending / taskTotal) * 100).toFixed(1)
        ),
      },
      {
        name: "Đang xử lý",
        value: dashboardStats.taskStats.inProgress,
        color: "#29B6F6",
        percentage: Number(
          ((dashboardStats.taskStats.inProgress / taskTotal) * 100).toFixed(1)
        ),
      },
      {
        name: "Hoàn thành",
        value: dashboardStats.taskStats.completed,
        color: "#26A69A",
        percentage: Number(
          ((dashboardStats.taskStats.completed / taskTotal) * 100).toFixed(1)
        ),
      },
    ].filter((item) => item.value > 0);


    const mechanicTotal = dashboardStats.mechanicStats.total || 1;
    const mechanicsWithPercentage = [
      {
        name: "Available",
        value: dashboardStats.mechanicStats.available,
        color: "#4CAF50",
        percentage: Number(
          (
            (dashboardStats.mechanicStats.available / mechanicTotal) *
            100
          ).toFixed(1)
        ),
      },
      {
        name: "In Task",
        value: dashboardStats.mechanicStats.inTask,
        color: "#F44336",
        percentage: Number(
          ((dashboardStats.mechanicStats.inTask / mechanicTotal) * 100).toFixed(
            1
          )
        ),
      },
    ].filter((item) => item.value > 0);

    return {
      requests: requestsWithPercentage,
      tasks: tasksWithPercentage,
      mechanics: mechanicsWithPercentage,
      combined: [
        {
          category: "Requests",
          pending: dashboardStats.requestStats.pending,
          inProgress: dashboardStats.requestStats.inProgress,
          completed: dashboardStats.requestStats.completed,
          total: dashboardStats.requestStats.total,
        },
        {
          category: "Tasks",
          pending: dashboardStats.taskStats.pending,
          inProgress: dashboardStats.taskStats.inProgress,
          completed: dashboardStats.taskStats.completed,
          total: dashboardStats.taskStats.total,
        },
      ],
    };
  }, [dashboardStats]);

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <SkeletonCard />
      </div>
    );
  }

  // Show access denied message instead of returning null
  if (!canAccessWorkspace) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loading ? (
        <SkeletonCard />
      ) : (
        <>
          {/* Page Title */}
          <PageTitle
            title="Head Of Technical Dashboard"
            description="Theo dõi tất cả yêu cầu, công việc và thợ máy của bạn tại đây"
          />

          {/* Top Section - Quick Actions */}
          <HOTQuickActions dashboardStats={dashboardStats} loading={loading} />

          {/* ✅ Updated Middle Section - Only 2 charts (removed MechanicStatusPieChart) */}
          {dashboardStats && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <RequestStatusPieChart
                data={chartData.requests}
                total={dashboardStats.requestStats.total}
              />
              <TaskStatusPieChart
                data={chartData.tasks}
                total={dashboardStats.taskStats.total}
              />
              <CombinedBarChart 
              data={chartData.combined} 
              />
            </div>
          )}

          {/* Task Breakdown and Incident Overview Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* <TaskBreakdownChart /> */}
            <div className="lg:col-span-3">
              <TaskBreakdownChart />
            </div>
            <div className="lg:col-span-2">
              <IncidentOverviewChart />
            </div>
          </div>

          {/* Bottom Section - Notification Area */}
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
            {/* <div className="lg:col-span-2"> */}
              <HOTNotificationArea />
            {/* </div> */}
            {/* <div className="lg:col-span-1">
              <CombinedBarChart data={chartData.combined} />
            </div> */}
          </div>
        </>
      )}
    </div>
  );
};

export default DetailWorkspacePage;
