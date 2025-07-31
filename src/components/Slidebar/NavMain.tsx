"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRight } from "lucide-react";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon | string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon | string;
    }[];
  }[];
}) {
  const pathname = usePathname();

  // Helper function to check if current path matches any child item
  const shouldMenuBeOpen = (item: typeof items[0]) => {
    if (!item.items || item.items.length === 0) {
      return false;
    }

    // Check if current pathname matches any child item URL
    return item.items.some((subItem) => pathname === subItem.url);
  };

  // Helper function to render icon (handles both LucideIcon and string)
  const renderIcon = (
    icon: LucideIcon | string | undefined,
    className?: string
  ) => {
    if (!icon) return null;

    if (typeof icon === "string") {
      // If icon is a string, you might want to handle it differently
      // For now, we'll just return null or you can implement string-based icon mapping
      return null;
    } else {
      // If icon is a LucideIcon component
      const IconComponent = icon;
      return <IconComponent className={className} />;
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          if (!item.items || item.items.length === 0) {
            return (
              <SidebarMenuItem key={uuidv4()}>
                <SidebarMenuButton
                  asChild
                  className={`${
                    pathname === item.url &&
                    "text-white bg-primary hover:text-white hover:bg-primary/90"
                  }`}
                >
                  <Link href={item.url}>
                    {renderIcon(item.icon)}
                    <span>{item.title}</span>
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
                      {renderIcon(item.icon)}
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
                              {renderIcon(subItem.icon, "mr-2 h-4 w-4")}
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
