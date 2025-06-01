"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { v4 as uuidv4 } from "uuid";
import {
  FolderGit2,
  FolderPen,
  ClipboardList,
  CircleCheckBig,
  CircleEllipsis,
} from "lucide-react";
import useWorkspaceStore, { WorkspaceStoreState } from "@/store/workspace";
import useTaskStore, { TaskStoreState } from "@/store/task";
import AnalysisCard, {
  ANALYSIS_TYPE,
} from "@/components/AnalysisCard/AnalysisCard";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import AssignedTask from "@/components/AssignedTask/AssignedTask";
import ProjectCpn from "@/components/ProjectsCpn/ProjectCpn";
import PeopleCpn from "@/components/PeopleCpn/PeopleCpn";
import { TASK_TYPE } from "@/types";
import { calculateDaysLeft } from "@/lib/utils";
import { useParams, useRouter } from "next/navigation";
import WorkspaceJoinForm from "@/components/WorkspaceJoinForm/WorkspaceJoinForm";
import TasksLineChart from "@/components/TasksLineChart/TaskLineChart";
import TasksBarChart from "@/components/TasksBarChart/TasksBarChart";
import TasksAreaChart from "@/components/TasksAreaChart/TasksAreaChart";

const ANALYSIS_ITEMS: ANALYSIS_TYPE[] = [
  {
    id: "totalprojects",
    title: "Total Projects",
    count: 0,
    analysis: 10,
    direction: "up",
    icon: <FolderGit2 className="text-gray-500 dark:text-gray-300" size={20} />,
  },
  {
    id: "totaltasks",
    title: "Total Tasks",
    count: 0,
    analysis: 42,
    direction: "up",
    icon: <FolderPen className="text-gray-500 dark:text-gray-300" size={20} />,
  },
  {
    id: "assignedtasks",
    title: "Assigned Tasks",
    count: 0,
    analysis: 5,
    direction: "up",
    icon: (
      <ClipboardList className="text-gray-500 dark:text-gray-300" size={20} />
    ),
  },
  {
    id: "completedtasks",
    title: "Completed Tasks",
    count: 0,
    analysis: 5,
    direction: "up",
    icon: (
      <CircleCheckBig className="text-gray-500 dark:text-gray-300" size={20} />
    ),
  },
  {
    id: "overduetasks",
    title: "Overdue Tasks",
    count: 0,
    analysis: 0,
    direction: "down",
    icon: (
      <CircleEllipsis className="text-gray-500 dark:text-gray-300" size={20} />
    ),
  },
];

const DetailWorkspacePage = () => {
  const { user, canAccessWorkspace } = useAuth(); // ✅ Use new auth context
  const router = useRouter();

  const params = useParams();
  const workspaceIdParams = params?.["workspace-id"];

  const { workspace, loading }: WorkspaceStoreState = useWorkspaceStore();
  const { projects, tasks, getProjectsByWorkspaceId }: TaskStoreState =
    useTaskStore();

  // ✅ Redirect if user can't access workspace
  useEffect(() => {
    if (!canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [canAccessWorkspace, router]);

  const analysisItems = useMemo(() => {
    return ANALYSIS_ITEMS?.map((item) => {
      if (item.id === "totalprojects") {
        return { ...item, count: projects?.length || 0 };
      }

      if (item.id === "totaltasks") {
        return { ...item, count: tasks?.length || 0 };
      }

      if (item.id === "assignedtasks") {
        const filterAssignedTasks = tasks?.filter((task: TASK_TYPE) => {
          return task?.assigneeId === user?.id; // ✅ Use user.id instead of user.uid
        });

        return {
          ...item,
          count: filterAssignedTasks?.length || 0,
        };
      }

      if (item.id === "completedtasks") {
        const filterCompletedTasks = tasks?.filter((task: TASK_TYPE) => {
          return task?.assigneeId === user?.id && task?.status === "done"; // ✅ Use user.id
        });

        return {
          ...item,
          count: filterCompletedTasks?.length || 0,
        };
      }

      if (item.id === "overduetasks") {
        const filterOverdueTasks = tasks?.filter((task: TASK_TYPE) => {
          // ✅ Remove Firebase Timestamp usage, use ISO string
          const daysLeft = task?.dueAt
            ? calculateDaysLeft(task.dueAt as string)
            : "";
          return (
            task?.assigneeId === user?.id &&
            task?.status !== "done" &&
            daysLeft.includes("overdue")
          );
        });

        return {
          ...item,
          count: filterOverdueTasks?.length || 0,
        };
      }

      return item;
    });
  }, [projects, tasks, user?.id]); // ✅ Use user.id instead of user.uid

  useEffect(() => {
    if (workspaceIdParams && canAccessWorkspace) {
      getProjectsByWorkspaceId(workspaceIdParams as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceIdParams, canAccessWorkspace]);

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
            title="Home"
            description="Monitor all of your projects and tasks here"
          />

          <div className="my-10 w-full flex gap-3 flex-wrap lg:flex-nowrap">
            {analysisItems?.map((item: ANALYSIS_TYPE) => {
              return <AnalysisCard key={uuidv4()} item={item} />;
            })}
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
            <div className="basis:auto lg:basis-full"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default DetailWorkspacePage;
