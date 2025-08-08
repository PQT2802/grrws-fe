"use client";

import {
  Home,
  Box,
  FileText,
  ClipboardList,
  Settings,
  Smartphone,
  WashingMachine,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavSKeeper() {
  const pathname = usePathname();

  const STOCK_KEEPER_ITEMS = [
    {
      title: "Dashboard",
      url: `/workspace/stock_keeper/dashboard`,
      icon: Home,
    },
    {
      title: "Request",
      url: `/workspace/stock_keeper/requests`,
      icon: ClipboardList,
    },
    {
      title: "Device",
      url: `/workspace/stock_keeper/devices`,
      icon: Smartphone,
    },
    {
      title: "Machine",
      url: `/workspace/stock_keeper/machines`,
      icon: WashingMachine,
    },
    {
      title: "Spare Part",
      url: `/workspace/stock_keeper/inventory`,
      icon: Box,
    },
    {
      title: "Stock In/Out Logs",
      url: `/workspace/stock_keeper/logs`,
      icon: FileText,
    },
  ];

  return (
    <SidebarGroup>
      <SidebarMenu>
        {STOCK_KEEPER_ITEMS.map((item) => (
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
