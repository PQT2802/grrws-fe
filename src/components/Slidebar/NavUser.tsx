"use client";

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
// ✅ Change from USER_TYPE to AuthUser
import { AuthUser } from "@/types/auth.type";
import { getFirstLetterUppercase } from "@/lib/utils";
// ✅ Remove Firebase import
// import { logOut } from "@/lib/firebase.auth";
import { useRouter } from "next/navigation";
// ✅ Add AuthProvider imports
import { useAuth } from "@/components/providers/AuthProvider";
import { useState } from "react";
import { toast } from "react-toastify";

interface PropType {
  user: AuthUser; // ✅ Use AuthUser instead of USER_TYPE
}

export function NavUser(props: PropType) {
  const { user } = props;

  const router = useRouter();
  const { isMobile } = useSidebar();
  const { logout } = useAuth(); // ✅ Get logout from AuthProvider
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ Add loading state

  // ✅ Updated logout function using AuthProvider
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log("🚪 NavUser logout initiated");
      await logout(); // ✅ Uses AuthProvider logout
      toast.success("Logged out successfully");
      // No need to manually navigate - AuthProvider handles it
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast.error("Logout failed");
      // Fallback: force logout even if there's an error
      localStorage.clear();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {/* ✅ Use AuthUser properties */}
                <AvatarImage
                  src={user?.profilePictureUrl}
                  alt={user?.fullName}
                />
                <AvatarFallback className="rounded-lg bg-primary text-white">
                  {user?.fullName
                    ? getFirstLetterUppercase(user?.fullName)
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {/* ✅ Use AuthUser properties */}
                <span className="truncate font-semibold">{user?.fullName}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {/* ✅ Use AuthUser properties */}
                  <AvatarImage
                    src={user?.profilePictureUrl}
                    alt={user?.fullName}
                  />
                  <AvatarFallback className="rounded-lg bg-primary text-white">
                    {user?.fullName
                      ? getFirstLetterUppercase(user?.fullName)
                      : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  {/* ✅ Use AuthUser properties */}
                  <span className="truncate font-semibold">
                    {user?.fullName}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <Sparkles />
                Upgrade to Pro
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {/* ✅ Updated logout button with loading state */}
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoggingOut} // ✅ Disable during logout
            >
              <LogOut />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
