"use client";

import { 
  UsersRound, 
  Settings, 
  Shield, 
  LayoutDashboard, 
  WashingMachine, 
  ClipboardList, 
  Smartphone, 
  AlertCircle, 
  Bug, 
  Wrench,
  FileText,
  Package,
  Users,
  History
} from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";

export function NavAdmin() {
  const pathname = usePathname();
  const params = useParams();
  const workspaceId = params?.["workspace-id"];

  const ADMIN_ITEMS = [
    {
      title: "DashBoard",
      url: `/workspace/${workspaceId}/admin/dashboard`,
      icon: LayoutDashboard,
      items: []
    },
    {
      title: "User",
      url: `/workspace/${workspaceId}/admin/userList`,
      icon: UsersRound,
      items: []
    },
    {
      title: "Machine",
      url: `/workspace/${workspaceId}/admin/machineList`,
      icon: WashingMachine,
      items: []
    },
    {
      title: "Device",
      url: `/workspace/${workspaceId}/admin/deviceList`,
      icon: Smartphone,
      items: []
    },
    {
      title: "Request", 
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "HOD Requests",
          url: `/workspace/${workspaceId}/admin/requestList`,
          icon: AlertCircle,
        },
        {
          title: "HOT Reports",
          url: `/workspace/${workspaceId}/admin/requests/hot`,
          icon: Wrench,
        },
        {
          title: "Stock Keeper Requests",
          url: `/workspace/${workspaceId}/admin/requests/stock_keeper`,
          icon: Package,
        },
        {
          title: "Staff Tasks",
          url: `/workspace/${workspaceId}/admin/requests/staff`,
          icon: Users,
        },
        {
          title: "Request History",
          url: `/workspace/${workspaceId}/admin/requests/history`,
          icon: History,
        },
      ],
    },
  ];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {ADMIN_ITEMS.map((item) => {
          if (item?.items?.length === 0) {
            return (
              <SidebarMenuItem key={uuidv4()}>
                <SidebarMenuButton
                  asChild
                  className={`${
                    pathname === item?.url &&
                    "text-white bg-primary hover:text-white hover:bg-primary/90"
                  }`}
                >
                  <Link href={`${item?.url ?? "#"}`}>
                    {item.icon && <item.icon />}
                    <span>{item?.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          } else {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultClosed={item.title === "Request"}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton 
                            asChild
                            className={`${
                              pathname === subItem.url &&
                              "text-white bg-primary hover:text-white hover:bg-primary/90"
                            }`}
                          >
                            <Link href={subItem.url}>
                              {subItem.icon && <subItem.icon className="mr-2 h-4 w-4" />}
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}