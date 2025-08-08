"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Wrench, RefreshCw, BarChart3, Download } from "lucide-react";
import RequestReportsAdmin from "@/components/AdminRequestCpn/HOT/RequestReportsAdmin";
import { useAuth } from "@/components/providers/AuthProvider";
import { REQUEST_ITEM } from "@/types/dashboard.type";
import { apiClient } from "@/lib/api-client";

type ReportTabType = "all" | "repair" | "warranty";

export default function RequestReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTabType>("all");
  const [allRequests, setAllRequests] = useState<REQUEST_ITEM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAdmin } = useAuth();

  // Fetch all requests to calculate counts
  const fetchAllRequests = async () => {
    setIsLoading(true);
    try {
      console.log("MOUNTING: workspace/hot/requests/page.tsx");
      console.log("Fetching all requests...");
      const response = await apiClient.dashboard.getAllRequests(1, 1000);

      console.log("API Response structure:", response);

      // Handle different possible response structures
      let requestsData: REQUEST_ITEM[] = [];

      if (response?.data?.data && Array.isArray(response.data.data)) {
        // Structure: { data: { data: REQUEST_ITEM[] } }
        requestsData = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        // Structure: { data: REQUEST_ITEM[] }
        requestsData = response.data;
      } else if (Array.isArray(response)) {
        // Structure: REQUEST_ITEM[]
        requestsData = response;
      } else {
        console.error("Unexpected response structure:", response);
        throw new Error("Invalid response structure");
      }

      console.log(`Found ${requestsData.length} requests`);

      // Filter only requests that have tasks (reports)
      const requestsWithTasks = [];
      for (const request of requestsData) {
        try {
          const tasks = await apiClient.request.getTaskOfRequest(request.id);
          if (tasks && tasks.length > 0) {
            requestsWithTasks.push({
              ...request,
              tasks: tasks,
            });
          }
        } catch (error) {
          console.error(
            `Error fetching tasks for request ${request.id}:`,
            error
          );
          // Continue with next request instead of failing completely
        }
      }

      console.log(`Found ${requestsWithTasks.length} requests with tasks`);
      setAllRequests(requestsWithTasks);
    } catch (error) {
      console.error("Failed to fetch requests for counting:", error);
      setAllRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllRequests();
  }, [refreshTrigger]);

  // Calculate request counts by tab type
  const getRequestCountByTab = (tabType: ReportTabType) => {
    if (tabType === "all") return allRequests.length;

    return allRequests.filter((request) => {
      const tasks = (request as any).tasks || [];
      return tasks.some((task: any) => {
        const taskType = task.taskType?.toLowerCase();
        if (tabType === "repair") {
          return taskType === "repair";
        } else if (tabType === "warranty") {
          return (
            taskType === "warranty" ||
            taskType === "warrantysubmission" ||
            taskType === "warrantyreturn"
          );
        }
        return false;
      });
    }).length;
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-muted-foreground">
            Bạn không có quyền xem trang này.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý báo cáo yêu cầu</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Xem và quản lý tất cả các báo cáo yêu cầu đã được trưởng phòng kĩ
            thuật tạo
          </p>
        </div>

        {/* Action Buttons - Refresh and Export */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Làm mới
          </Button>

          <Button
            variant="outline"
            className="border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Tabs with Dynamic Request Counts */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as ReportTabType)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tất cả báo cáo{" "}
            {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getRequestCountByTab("all")}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="repair" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Báo cáo sửa chữa{" "}
            {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getRequestCountByTab("repair")}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="warranty" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Báo cáo bảo hành{" "}
            {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getRequestCountByTab("warranty")}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Reports Tab */}
        <TabsContent value="all">
          <RequestReportsAdmin
            activeTab="all"
            onRequestsUpdate={setAllRequests}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        {/* Repair Reports Tab */}
        <TabsContent value="repair">
          <RequestReportsAdmin
            activeTab="repair"
            onRequestsUpdate={setAllRequests}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        {/* Warranty Reports Tab */}
        <TabsContent value="warranty">
          <RequestReportsAdmin
            activeTab="warranty"
            onRequestsUpdate={setAllRequests}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
