"use client";

import {
  Frame,
  Map,
  PieChart,
  Settings,
  House,
  CircleCheckBig,
  AlertTriangle,
  Bug,
  Wrench,
  AlertCircle,
} from "lucide-react";
import { NavMain } from "@/components/Slidebar/NavMain";
import { NavProjects } from "@/components/Slidebar/NavProjects";
import { NavUser } from "@/components/Slidebar/NavUser";
import { NavAdmin } from "@/components/Slidebar/NavAdmin";
import { WorkspaceSwitcher } from "@/components/Slidebar/NavWorkspace";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useAuth } from "../providers/AuthProvider";
import { PROJECT_TYPE, SLIDEBAR_ITEM_TYPE } from "@/types";
import useWorkspaceStore, { WorkspaceStoreState } from "@/store/workspace";
import useTaskStore, { TaskStoreState } from "@/store/task";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { NavSKeeper } from "./NavSKeeper";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin, isHOT, isStockKeeper }: any = useAuth();
  const params = useParams();
  const workspaceId = params?.["workspace-id"] as string;

  const { workspace }: WorkspaceStoreState = useWorkspaceStore();
  const { projects }: TaskStoreState = useTaskStore();

  const PROJECT_ITEMS: SLIDEBAR_ITEM_TYPE[] = useMemo(() => {
    return (
      projects?.map((p: PROJECT_TYPE) => {
        return {
          title: p.name,
          url: `/workspace/${workspaceId ?? "#"}/project/${p?.id}`,
          icon: p?.avatarUrl ?? "",
        } as SLIDEBAR_ITEM_TYPE;
      }) ?? []
    );
  }, [workspaceId, projects]);

  const MAIN_ITEMS: SLIDEBAR_ITEM_TYPE[] = [
    {
      title: "Home",
      url: `/workspace/hot`,
      icon: House,
      items: [],
    },
    {
      title: "Tasks",
      url: `/workspace/hot/tasks`,
      icon: CircleCheckBig,
      items: [],
    },
    {
      title: "Devices",
      url: `/workspace/hot/devices`,
      icon: Wrench,
      items: [],
    },
    {
      title: "Requests",
      url: `/workspace/hot/requests`,
      icon: Frame,
      items: [],
    }, 
    {
      title: "Reports",
      url: `/workspace/hot/reports`,
      icon: PieChart,
      items: [],
    },
    {
      title: "Calendar",
      url: `/workspace/calendar`,
      icon: Map,
      items: PROJECT_ITEMS,
    },
    {
      title: "Incident Tracking",
      url: "#",
      icon: AlertTriangle,
      items: [
        {
          title: "Issues",
          url: `/workspace/hot/incident/issues`,
          icon: AlertCircle,
        },
        {
          title: "Technical Issues",
          url: `/workspace/hot/incident/technicalIssues`,
          icon: Wrench,
        },
        {
          title: "Errors",
          url: `/workspace/hot/incident/errors`,
          icon: Bug,
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {isAdmin && <NavAdmin />}
        {isStockKeeper && <NavSKeeper />}
        {isHOT && (
          <>
            <NavMain items={MAIN_ITEMS} />
            <NavProjects items={PROJECT_ITEMS} />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
