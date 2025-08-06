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
  History,
  MapPin,
  PackageSearch, // New icon for spare parts
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
      url: `/workspace/admin/dashboard`,
      icon: LayoutDashboard,
      items: [],
    },
    {
      title: "User",
      url: `/workspace/admin/userList`,
      icon: UsersRound,
      items: [],
    },
    {
      title: "Machine",
      url: `/workspace/admin/machineList`,
      icon: WashingMachine,
      items: [],
    },
    {
      title: "Device",
      url: `/workspace/admin/deviceList`,
      icon: Smartphone,
      items: [],
    },
    {
      title: "Spare Part",
      url: `/workspace/admin/spare-parts`,
      icon: PackageSearch,
      items: [],
    },
    {
      title: "Location",
      url: "#",
      icon: MapPin,
      items: [
        {
          title: "Areas",
          url: `/workspace/admin/location/areas`,
          icon: MapPin,
        },
        {
          title: "Zones",
          url: `/workspace/admin/location/zones`,
          icon: MapPin,
        },
        {
          title: "Positions",
          url: `/workspace/admin/location/positions`,
          icon: MapPin,
        },
      ],
    },
    {
      title: "Request",
      url: "#",
      icon: ClipboardList,
      items: [
        {
          title: "HOD Requests",
          url: `/workspace/admin/requestList`,
          icon: AlertCircle,
        },
        {
          title: "HOT Reports",
          url: `/workspace/admin/requests/hot`,
          icon: Wrench,
        },
        {
          title: "Stock Keeper Requests",
          url: `/workspace/admin/requests/stock_keeper`,
          icon: Package,
        },
        {
          title: "Staff Tasks",
          url: `/workspace/admin/requests/staff`,
          icon: Users,
        },
        {
          title: "Request History",
          url: `/workspace/admin/requests/history`,
          icon: History,
        },
      ],
    },
  ];

  // Helper function to check if current path matches any child item
  const shouldMenuBeOpen = (item: (typeof ADMIN_ITEMS)[0]) => {
    if (!item.items || item.items.length === 0) {
      return false;
    }

    // Check if current pathname matches any child item URL
    return item.items.some((subItem) => pathname === subItem.url);
  };

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
            const isMenuOpen = shouldMenuBeOpen(item);

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isMenuOpen}
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
                              {subItem.icon && (
                                <subItem.icon className="mr-2 h-4 w-4" />
                              )}
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
