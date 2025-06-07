"use client";

import {
  Frame,
  Map,
  PieChart,
  Settings,
  House,
  CircleCheckBig,
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

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isAdmin, isHOT }: any = useAuth();
  const params = useParams();
  const workspaceId = params?.["workspace-id"] as string; // ✅ Get workspace ID from URL

  const { workspace }: WorkspaceStoreState = useWorkspaceStore();
  const { projects }: TaskStoreState = useTaskStore();

  const PROJECT_ITEMS: SLIDEBAR_ITEM_TYPE[] = useMemo(() => {
    return (
      projects?.map((p: PROJECT_TYPE) => {
        return {
          title: p.name,
          url: `/workspace/${workspaceId ?? "#"}/project/${p?.id}`, // ✅ Use workspaceId from URL
          icon: p?.avatarUrl ?? "",
        } as SLIDEBAR_ITEM_TYPE;
      }) ?? []
    );
  }, [workspaceId, projects]); // ✅ Updated dependency

  const MAIN_ITEMS: SLIDEBAR_ITEM_TYPE[] = [
    {
      title: "Home",
      url: `/workspace/${workspaceId ?? "#"}`, // ✅ Use workspaceId from URL
      icon: House,
      items: [],
    },
    {
      title: "My Tasks",
      url: `/workspace/${workspaceId ?? "#"}/tasks`, // ✅ Use workspaceId from URL
      icon: CircleCheckBig,
      items: [],
    },
    {
      title: "Requests",
      url: `/workspace/${workspaceId ?? "#"}/requests`, // ✅ Use workspaceId from URL
      icon: Frame,
      items: [],
    },
    {
      title: "Projects",
      url: `/workspace/${workspaceId ?? "#"}/projects`, // ✅ Use workspaceId from URL
      icon: Map,
      items: PROJECT_ITEMS,
    },
    {
      title: "Reports",
      url: `/workspace/${workspaceId ?? "#"}/reports`, // ✅ Use workspaceId from URL
      icon: PieChart,
      items: [],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Workspace",
          url: "#",
        },
        {
          title: "Project",
          url: "#",
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
        {isAdmin && (
            <NavAdmin />
        )}

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
