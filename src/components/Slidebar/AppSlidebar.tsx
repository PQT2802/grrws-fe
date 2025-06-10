"use client";

import {
  Frame,
  Map,
  PieChart,
  Settings,
  House,
  CircleCheckBig
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

  // const PROJECT_ITEMS: SLIDEBAR_ITEM_TYPE[] = useMemo(() => {
  //   return (
  //     projects?.map((p: PROJECT_TYPE) => {
  //       return {
  //         title: p.name,
  //         url: `/workspace/${workspaceId ?? "#"}/project/${p?.id}`, // ✅ Use workspaceId from URL
  //         icon: p?.avatarUrl ?? "",
  //       } as SLIDEBAR_ITEM_TYPE;
  //     }) ?? []
  //   );
  // }, [workspaceId, projects]); // ✅ Updated dependency

  // // Define sidebar items for the stock_keeper role
  // const STOCK_KEEPER_ITEMS = [
  //   {
  //     title: "Dashboard",
  //     url: `/workspace/${workspaceId}/stock_keeper/dashboard`,
  //     icon: Home,
  //     items: [],
  //   },
  //   {
  //     title: "Spare Part Requests",
  //     url: `/workspace/${workspaceId}/stock_keeper/requests`,
  //     icon: ClipboardList,
  //     items: [],
  //   },
  //   {
  //     title: "Parts Inventory",
  //     url: `/workspace/${workspaceId}/stock_keeper/inventory`,
  //     icon: Box,
  //     items: [],
  //   },
  //   {
  //     title: "Stock In/Out Logs",
  //     url: `/workspace/${workspaceId}/stock_keeper/logs`,
  //     icon: FileText,
  //     items: [],
  //   },
  //   {
  //     title: "Settings",
  //     url: "#",
  //     icon: Settings,
  //     items: [
  //       {
  //         title: "General",
  //         url: "#",
  //       },
  //       {
  //         title: "Workspace",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ];

  // // Define sidebar items for the head of technical role
  // const HEAD_OF_TECHNICAL_ITEMS = [
  //   {
  //     title: "Dashboard",
  //     url: `/workspace/${workspaceId}/head_of_technical/dashboard`,
  //     icon: Home,
  //     items: [],
  //   },
  //   {
  //     title: "Manage Requests",
  //     url: `/workspace/${workspaceId}/head_of_technical/requests`,
  //     icon: ClipboardList,
  //     items: [],
  //   },
  //   {
  //     title: "Reports",
  //     url: `/workspace/${workspaceId}/head_of_technical/reports`,
  //     icon: PieChart,
  //     items: [],
  //   },
  //   {
  //     title: "Settings",
  //     url: "#",
  //     icon: Settings,
  //     items: [
  //       {
  //         title: "General",
  //         url: "#",
  //       },
  //       {
  //         title: "Workspace",
  //         url: "#",
  //       },
  //     ],
  //   },
  // ];

  // Dynamically select sidebar items based on the user's role
  // const MAIN_ITEMS =
  //   user?.role === 4
  //     ? STOCK_KEEPER_ITEMS // Role 4: Stock Keeper
  //     : user?.role === 5
  //     ? HEAD_OF_TECHNICAL_ITEMS // Role 5: Head of Technical
  //     : []; // Default: No items for other roles

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {isAdmin && ( <NavAdmin />)}
        {isStockKeeper && (<NavSKeeper />)}
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