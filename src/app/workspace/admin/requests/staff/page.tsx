"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Archive, Wrench, Settings, RefreshCw, BarChart3, Download } from "lucide-react";
import StaffTasksAdmin from "@/components/AdminRequestCpn/Staff/StaffTasksAdmin";
import { useAuth } from "@/components/providers/AuthProvider";
import { STAFF_TASK, TASK_TYPE_MAPPING, TaskTabType } from "@/types/task.type";
import { apiClient } from "@/lib/api-client";

export default function StaffRequestsPage() {
  const [activeTab, setActiveTab] = useState<TaskTabType>("all");
  const [allTasks, setAllTasks] = useState<STAFF_TASK[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAdmin } = useAuth();

  // Fetch all tasks to calculate counts
  const fetchAllTasks = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.task.getAllSingleTasks(1, 1000); // Get all tasks for counting
      setAllTasks(response.data);
    } catch (error) {
      console.error('Failed to fetch tasks for counting:', error);
      setAllTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTasks();
  }, [refreshTrigger]);

  // Calculate task counts by tab type
  const getTaskCountByTab = (tabType: TaskTabType) => {
    if (tabType === 'all') return allTasks.length;
    const allowedTypes = TASK_TYPE_MAPPING[tabType];
    return allTasks.filter(task => allowedTypes.includes(task.taskType as any)).length;
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quản lý công việc nhân viên</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi và quản lý tất cả các công việc được giao cho nhân viên
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
          
          {/* <Button 
            variant="outline" 
            className="border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400"
          >
            <Download className="mr-2 h-4 w-4" />
            Xuất file
          </Button> */}
        </div>
      </div>

      {/* Tabs with Dynamic Task Counts */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TaskTabType)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Tất cả {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getTaskCountByTab('all')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="warranty" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Bảo hành {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getTaskCountByTab('warranty')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="repair" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Sửa chữa {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getTaskCountByTab('repair')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="replace" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Thay thế {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getTaskCountByTab('replace')}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="install_uninstall" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Lắp đặt & Tháo {!isLoading && (
              <Badge variant="secondary" className="ml-1">
                {getTaskCountByTab('install_uninstall')}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* All Tasks Tab */}
        <TabsContent value="all">
          <StaffTasksAdmin activeTab="all" onTasksUpdate={setAllTasks} refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Warranty Tasks Tab */}
        <TabsContent value="warranty">
          <StaffTasksAdmin activeTab="warranty" onTasksUpdate={setAllTasks} refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Repair Tasks Tab */}
        <TabsContent value="repair">
          <StaffTasksAdmin activeTab="repair" onTasksUpdate={setAllTasks} refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Replace Tasks Tab */}
        <TabsContent value="replace">
          <StaffTasksAdmin activeTab="replace" onTasksUpdate={setAllTasks} refreshTrigger={refreshTrigger} />
        </TabsContent>

        {/* Install/Uninstall Tasks Tab */}
        <TabsContent value="install_uninstall">
          <StaffTasksAdmin activeTab="install_uninstall" onTasksUpdate={setAllTasks} refreshTrigger={refreshTrigger} />
        </TabsContent>
      </Tabs>
    </div>
  );
}