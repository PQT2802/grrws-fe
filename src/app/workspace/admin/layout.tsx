// src/app/workspace/admin/layout.tsx
import type { Metadata } from "next";
import { AppSidebar } from "@/components/Slidebar/AppSlidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppNavbar from "@/components/AppNavbar/AppNavbar";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_APP_NAME ?? "GRRWS"} | Admin Workspace`,
  description: "Admin workspace for GRRWS",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full relative">
        <div className="w-full p-5 mt-0 mb-[43.19px]">
          <AppNavbar />
          <div className="mt-[60px]">{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}