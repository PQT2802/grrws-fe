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

          <div className="mt-3 w-full h-[420px] flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <AssignedTask />
            <div className="basis-full hidden h-full lg:flex flex-col gap-3">
              <WorkspaceJoinForm />
              <ProjectCpn />
            </div>
          </div>

          <div className="mt-3 flex lg:hidden flex-col gap-3">
            <WorkspaceJoinForm />
            <ProjectCpn />
          </div>

          <div className="mt-3 w-full flex items-center gap-3 flex-wrap lg:flex-nowrap">
            <PeopleCpn />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
