"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  FolderGit2,
  ClipboardList,
  CircleCheckBig,
  CircleEllipsis,
  Users,
} from "lucide-react";
import AnalysisCard, {
  ANALYSIS_TYPE,
} from "@/components/AnalysisCard/AnalysisCard";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  const { user, canAccessWorkspace } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceIdParams = params?.["workspace-id"];

  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);

  // Redirect if user can't access workspace
  useEffect(() => {
    if (!canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [canAccessWorkspace, router]);

  // Fetch dashboard statistics
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

    if (workspaceIdParams && canAccessWorkspace) {
      fetchDashboardStats();
    }
  }, [workspaceIdParams, canAccessWorkspace]);

  // Create analysis items based on API data
  const analysisItems: ANALYSIS_TYPE[] = useMemo(() => {
    if (!dashboardStats) return [];

    return [
      {
        id: "totalrequests",
        title: "Total Requests",
        count: dashboardStats.requestStats.total,
        analysis: 10,
        direction: "up",
        icon: (
          <FolderGit2 className="text-gray-500 dark:text-gray-300" size={20} />
        ),
      },
      {
        id: "totaltasks",
        title: "Total Tasks",
        count: dashboardStats.taskStats.total,
        analysis: 42,
        direction: "up",
        icon: (
          <ClipboardList
            className="text-gray-500 dark:text-gray-300"
            size={20}
          />
        ),
      },
      {
        id: "inprogresstasks",
        title: "In Progress Tasks",
        count: dashboardStats.taskStats.inProgress,
        analysis: 5,
        direction: "up",
        icon: (
          <CircleEllipsis
            className="text-gray-500 dark:text-gray-300"
            size={20}
          />
        ),
      },
      {
        id: "completedtasks",
        title: "Completed Tasks",
        count: dashboardStats.taskStats.completed,
        analysis: 5,
        direction: "up",
        icon: (
          <CircleCheckBig
            className="text-gray-500 dark:text-gray-300"
            size={20}
          />
        ),
      },
      {
        id: "availablemechanics",
        title: "Available Mechanics",
        count: dashboardStats.mechanicStats.available,
        analysis: 0,
        direction: "up",
        icon: <Users className="text-gray-500 dark:text-gray-300" size={20} />,
      },
    ];
  }, [dashboardStats]);

  // Prepare chart data with calculated percentages
  const chartData = useMemo(() => {
    if (!dashboardStats)
      return { requests: [], tasks: [], mechanics: [], combined: [] };

    // Calculate percentages for requests
    const requestTotal = dashboardStats.requestStats.total || 1; // Avoid division by zero
    const requestsWithPercentage = [
      {
        name: "Pending",
        value: dashboardStats.requestStats.pending,
        color: "#FFA726",
        percentage: Number(
          ((dashboardStats.requestStats.pending / requestTotal) * 100).toFixed(
            1
          )
        ),
      },
      {
        name: "In Progress",
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
        name: "Completed",
        value: dashboardStats.requestStats.completed,
        color: "#66BB6A",
        percentage: Number(
          (
            (dashboardStats.requestStats.completed / requestTotal) *
            100
          ).toFixed(1)
        ),
      },
    ].filter((item) => item.value > 0); // Only show items with values > 0

    // Calculate percentages for tasks
    const taskTotal = dashboardStats.taskStats.total || 1;
    const tasksWithPercentage = [
      {
        name: "Pending",
        value: dashboardStats.taskStats.pending,
        color: "#FF7043",
        percentage: Number(
          ((dashboardStats.taskStats.pending / taskTotal) * 100).toFixed(1)
        ),
      },
      {
        name: "In Progress",
        value: dashboardStats.taskStats.inProgress,
        color: "#29B6F6",
        percentage: Number(
          ((dashboardStats.taskStats.inProgress / taskTotal) * 100).toFixed(1)
        ),
      },
      {
        name: "Completed",
        value: dashboardStats.taskStats.completed,
        color: "#26A69A",
        percentage: Number(
          ((dashboardStats.taskStats.completed / taskTotal) * 100).toFixed(1)
        ),
      },
    ].filter((item) => item.value > 0);

    // Calculate percentages for mechanics
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

  // Custom label function for pie charts
  const renderCustomLabel = ({ name, value, percentage }: any) => {
    return `${name}: ${value} (${percentage}%)`;
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border">
          <p className="font-semibold">{`${data.name || label}`}</p>
          <p className="text-blue-600">{`Value: ${data.value}`}</p>
          <p className="text-green-600">{`Percentage: ${data.percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // Don't render if user can't access
  if (!canAccessWorkspace) {
    return null;
  }

  return (
    <>
      {loading ? (
        <SkeletonCard />
      ) : (
        <div>
          <PageTitle
            title="Dashboard"
            description="Monitor all of your requests, tasks and mechanics here"
          />

          <div className="my-10 w-full flex gap-3 flex-wrap lg:flex-nowrap">
            {analysisItems?.map((item: ANALYSIS_TYPE) => (
              <AnalysisCard key={item.id} item={item} />
            ))}
          </div>

          {/* Charts Section */}
          {dashboardStats && (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Request Status Pie Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Request Status Distribution (Total:{" "}
                  {dashboardStats.requestStats.total})
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.requests}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.requests.map((entry, index) => (
                        <Cell
                          key={`cell-requests-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {chartData.requests.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>
                        {item.name}: {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Task Status Pie Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Task Status Distribution (Total:{" "}
                  {dashboardStats.taskStats.total})
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.tasks}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.tasks.map((entry, index) => (
                        <Cell key={`cell-tasks-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  {chartData.tasks.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>
                        {item.name}: {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mechanic Status Pie Chart */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Mechanic Availability (Total:{" "}
                  {dashboardStats.mechanicStats.total})
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.mechanics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.mechanics.map((entry, index) => (
                        <Cell
                          key={`cell-mechanics-${index}`}
                          fill={entry.color}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {chartData.mechanics.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span>
                        {item.name}: {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Combined Bar Chart with Percentages */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">
                  Requests vs Tasks Comparison
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.combined}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip
                      formatter={(value, name, props) => [
                        `${value} (${(
                          (Number(value) / props.payload.total) *
                          100
                        ).toFixed(1)}%)`,
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="pending" fill="#FFA726" name="Pending" />
                    <Bar
                      dataKey="inProgress"
                      fill="#42A5F5"
                      name="In Progress"
                    />
                    <Bar dataKey="completed" fill="#66BB6A" name="Completed" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Statistics Cards with Percentages */}
          {dashboardStats && (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Request Statistics Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Request Status</h3>
                <div className="space-y-2">
                  {chartData.requests.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name}:</span>
                      <span className="font-medium">
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total:</span>
                    <span>{dashboardStats.requestStats.total}</span>
                  </div>
                </div>
              </div>

              {/* Task Statistics Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Task Status</h3>
                <div className="space-y-2">
                  {chartData.tasks.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{item.name}:</span>
                      <span className="font-medium">
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total:</span>
                    <span>{dashboardStats.taskStats.total}</span>
                  </div>
                </div>
              </div>

              {/* Mechanic Statistics Card */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Mechanic Status</h3>
                <div className="space-y-2">
                  {chartData.mechanics.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span
                        className={
                          item.name === "Available"
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {item.name}:
                      </span>
                      <span className="font-medium">
                        {item.value} ({item.percentage}%)
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t pt-2 font-semibold">
                    <span>Total:</span>
                    <span>{dashboardStats.mechanicStats.total}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default DetailWorkspacePage;
