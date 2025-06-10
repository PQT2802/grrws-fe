"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import AppNavbar from "@/components/AppNavbar/AppNavbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <main className="w-full relative">
        <div className="w-full p-5 mt-0 mb-[43.19px]">
          <div>{children}</div>
        </div>
      </main>
    </SidebarProvider>
  );
}
