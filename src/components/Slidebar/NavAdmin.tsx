"use client";

import { UsersRound, Settings, Shield, LayoutDashboard, WashingMachine, ClipboardList, Smartphone } from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavAdmin() {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params?.["workspace-id"];

  const ADMIN_ITEMS = [
    {
      title: "DashBoard",
      url: `/workspace/${workspaceId}/admin/dashboard`,
      icon: LayoutDashboard
    },
    {
      title: "User Management",
      url: `/workspace/${workspaceId}/admin/userList`,
      icon: UsersRound
    },
    {
      title: "Machine Management",
      url: `/workspace/${workspaceId}/admin/machineList`,
      icon: WashingMachine
    },
    {
      title: "Device Management",
      url: `/workspace/${workspaceId}/admin/deviceList`,
      icon: Smartphone
    },
    {
      title: "Request Management",
      url: `/workspace/${workspaceId}/admin/requestList`,
      icon: ClipboardList
    },
  ];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {ADMIN_ITEMS.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              className={`${
                pathname === item.url &&
                "text-white bg-primary hover:text-white hover:bg-primary/90"
              }`}
            >
              <Link href={item.url}>
                <item.icon />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}