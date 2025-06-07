"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import useWorkspaceStore, { WorkspaceStoreState } from "@/store/workspace";
import useTaskStore, { TaskStoreState } from "@/store/task";
import { TASK_TYPE } from "@/types";
import { calculateDaysLeft } from "@/lib/utils";

import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import AnalysisCard, { ANALYSIS_TYPE } from "@/components/AnalysisCard/AnalysisCard";
import TasksBarChart from "@/components/TasksBarChart/TasksBarChart";
import TasksAreaChart from "@/components/TasksAreaChart/TasksAreaChart";
import TasksLineChart from "@/components/TasksLineChart/TaskLineChart";
import AssignedTask from "@/components/AssignedTask/AssignedTask";
import WorkspaceJoinForm from "@/components/WorkspaceJoinForm/WorkspaceJoinForm";
import ProjectCpn from "@/components/ProjectsCpn/ProjectCpn";
import PeopleCpn from "@/components/PeopleCpn/PeopleCpn";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { USER_ROLES } from "@/types/auth.type";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Wrench, CheckCircle, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { ResponsiveContainer, CartesianGrid, LineChart, XAxis, YAxis, Line, PieChart, Cell, Pie } from "recharts";

const ANALYSIS_ITEMS: ANALYSIS_TYPE[] = [
  {
    id: "totalprojects",
    title: "Total Projects",
    count: 0,
    analysis: 10,
    direction: "up",
    icon: <></>, // Thêm icon nếu cần
  },
  {
    id: "totaltasks",
    title: "Total Tasks",
    count: 0,
    analysis: 42,
    direction: "up",
    icon: <></>,
  },
  {
    id: "assignedtasks",
    title: "Assigned Tasks",
    count: 0,
    analysis: 5,
    direction: "up",
    icon: <></>,
  },
  {
    id: "completedtasks",
    title: "Completed Tasks",
    count: 0,
    analysis: 5,
    direction: "up",
    icon: <></>,
  },
  {
    id: "overduetasks",
    title: "Overdue Tasks",
    count: 0,
    analysis: 0,
    direction: "down",
    icon: <></>,
  },
];

const errorTrendData = [
  { week: "T1", mechanical: 5, electrical: 3, software: 1, total: 9 },
  { week: "T2", mechanical: 7, electrical: 2, software: 2, total: 11 },
  { week: "T3", mechanical: 4, electrical: 4, software: 0, total: 8 },
  { week: "T4", mechanical: 6, electrical: 1, software: 3, total: 10 },
  { week: "T5", mechanical: 3, electrical: 5, software: 1, total: 9 },
  { week: "T6", mechanical: 8, electrical: 2, software: 2, total: 12 },
]

const machineStatusData = [
  { name: "Hoạt động", value: 156, color: "#22c55e" },
  { name: "Bảo trì", value: 12, color: "#f59e0b" },
  { name: "Sửa chữa", value: 8, color: "#ef4444" },
  { name: "Ngừng hoạt động", value: 4, color: "#6b7280" },
]

const AdminDashboardPage = () => {
  const { user, canAccessWorkspace } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.["workspace-id"] as string;

  const { workspace, loading }: WorkspaceStoreState = useWorkspaceStore();
  const { projects, tasks, getProjectsByWorkspaceId }: TaskStoreState = useTaskStore();

  //   useEffect(() => {
  //     // Only Admin (role 5) can access this dashboard
  //     if (user?.role !== 5) {
  //       router.push("/access-denied");
  //     }
  //   }, [user?.role, router]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== USER_ROLES.ADMIN) {
        console.log("🚫 Non-admin access attempted");
        router.push('/access-denied');
        toast.error("Admin access required");
        return;
      }
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (workspaceId && canAccessWorkspace) {
      getProjectsByWorkspaceId(workspaceId);
    }
  }, [workspaceId, canAccessWorkspace, getProjectsByWorkspaceId]);

  const analysisItems = useMemo(() => {
    return ANALYSIS_ITEMS.map((item) => {
      if (item.id === "totalprojects") return { ...item, count: projects?.length || 0 };
      if (item.id === "totaltasks") return { ...item, count: tasks?.length || 0 };
      if (item.id === "assignedtasks") {
        const assigned = tasks?.filter((t: TASK_TYPE) => t.assigneeId === user?.id);
        return { ...item, count: assigned?.length || 0 };
      }
      if (item.id === "completedtasks") {
        const completed = tasks?.filter((t: TASK_TYPE) => t.assigneeId === user?.id && t.status === "done");
        return { ...item, count: completed?.length || 0 };
      }
      if (item.id === "overduetasks") {
        const overdue = tasks?.filter((t: TASK_TYPE) => {
          const daysLeft = calculateDaysLeft(t.dueAt as string);
          return t.assigneeId === user?.id && t.status !== "done" && daysLeft.includes("overdue");
        });
        return { ...item, count: overdue?.length || 0 };
      }
      return item;
    });
  }, [projects, tasks, user?.id]);

  if (!canAccessWorkspace || user?.role !== 5) {
    return null;
  }

  return (
    <div>
      {loading ? (
        <SkeletonCard />
      ) : (
        <>
          <PageTitle
            title="Admin Dashboard"
            description="Monitor and manage your workspace overview as Admin"
          />

          <div className="my-10 w-full flex gap-3 flex-wrap lg:flex-nowrap">
            {analysisItems.map((item) => (
              <AnalysisCard key={uuidv4()} item={item} />
            ))}
          </div>

          <div className="w-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <TasksBarChart />
            <TasksAreaChart />
            <TasksLineChart />
          </div>

          {/* Machine Status Chart - Half Width */}
          <div className="mt-3 w-full h-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            {/* <AssignedTask /> */}
            <div className="w-1/2">
              <Card>
                <CardHeader>
                  <CardTitle>Trạng thái máy may</CardTitle>
                  <CardDescription>Phân bổ 180 máy theo trạng thái hiện tại</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      active: { label: "Hoạt động", color: "#22c55e" },
                      maintenance: { label: "Bảo trì", color: "#f59e0b" },
                      repair: { label: "Sửa chữa", color: "#ef4444" },
                      inactive: { label: "Ngừng hoạt động", color: "#6b7280" },
                    }}
                    className="h-[300px] w-full"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={machineStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={1500}
                        >
                          {machineStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} animationDuration={300} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {machineStatusData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: item.color }} />
                          <span className="font-medium">{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold">{item.value}</span>
                          <div className="text-xs text-muted-foreground">{((item.value / 180) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="basis-full hidden h-full lg:flex flex-col gap-3">
              <WorkspaceJoinForm />
              <ProjectCpn />
              <PeopleCpn/>
            </div>
          </div>
        </>
      )}


      {/* Section 3: Biểu đồ công việc */}
      <div className="mt-3 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Xu hướng lỗi máy theo tuần</CardTitle>
            <CardDescription>Phân loại lỗi cơ khí, điện và phần mềm</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                mechanical: { label: "Cơ khí", color: "hsl(var(--chart-1))" },
                electrical: { label: "Điện", color: "hsl(var(--chart-2))" },
                software: { label: "Phần mềm", color: "hsl(var(--chart-3))" },
                total: { label: "Tổng", color: "hsl(var(--chart-4))" },
              }}
              className="h-[300px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={errorTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="mechanical"
                    stroke="var(--color-mechanical)"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8, stroke: "var(--color-mechanical)", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="electrical"
                    stroke="var(--color-electrical)"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8, stroke: "var(--color-electrical)", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="software"
                    stroke="var(--color-software)"
                    strokeWidth={3}
                    dot={{ r: 6 }}
                    activeDot={{ r: 8, stroke: "var(--color-software)", strokeWidth: 2 }}
                    animationDuration={1500}
                  />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="var(--color-total)"
                    strokeWidth={4}
                    strokeDasharray="8 8"
                    dot={{ r: 8 }}
                    activeDot={{ r: 10, stroke: "var(--color-total)", strokeWidth: 3 }}
                    animationDuration={1500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 4: Thống kê nhanh */}
      <div className="my-4 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Thống kê vận hành hôm nay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Máy hoạt động</span>
                </div>
                <div className="text-xl font-bold">156/180</div>
                <div className="text-xs text-muted-foreground">86.7%</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Hiệu suất TB</span>
                </div>
                <div className="text-xl font-bold">94.2%</div>
                <div className="text-xs text-green-600">+2.1%</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Cảnh báo</span>
                </div>
                <div className="text-xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">Linh kiện</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Thời gian chờ</span>
                </div>
                <div className="text-xl font-bold">2.4h</div>
                <div className="text-xs text-red-600">-0.3h</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm font-medium">Sản lượng</span>
                </div>
                <div className="text-xl font-bold">3,050</div>
                <div className="text-xs text-green-600">+150</div>
              </div>
              <div className="space-y-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Bảo trì</span>
                </div>
                <div className="text-xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Máy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>

  );
};

export default AdminDashboardPage;
