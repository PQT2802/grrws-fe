"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Settings, BarChart3 } from "lucide-react";
import SparePartRequestsAdmin from "@/components/AdminRequestCpn/SKeeper/SparePartRequestsAdmin";
import MachineRequestsAdmin from "@/components/AdminRequestCpn/SKeeper/MachineRequestsAdmin";
import RequestSummaryAdmin from "@/components/AdminRequestCpn/SKeeper/RequestSummaryAdmin";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AdminStockKeeperRequestsPage() {
  const [activeTab, setActiveTab] = useState("summary");
  const { user, isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
          <p className="text-muted-foreground">Bạn không có quyền xem trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Remove border/shadow, just plain title */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý yêu cầu từ Thủ kho</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Xem và theo dõi tất cả yêu cầu linh kiện và thiết bị từ bộ phận thủ kho
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tổng quan
          </TabsTrigger>
          <TabsTrigger value="spare-parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Yêu cầu linh kiện
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Yêu cầu thiết bị
          </TabsTrigger>
        </TabsList>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <RequestSummaryAdmin />
        </TabsContent>

        {/* Spare Parts Tab */}
        <TabsContent value="spare-parts">
          <SparePartRequestsAdmin />
        </TabsContent>

        {/* Machines Tab */}
        <TabsContent value="machines">
          <MachineRequestsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  );
}