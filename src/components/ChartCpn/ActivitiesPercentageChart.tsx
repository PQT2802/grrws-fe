"use client"

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, TrendingUp, TrendingDown, Activity } from "lucide-react"
import { apiClient } from "@/lib/api-client";
import { TASK_STATISTICS } from "@/types/dashboard.type";
import { Loader2 } from "lucide-react";

interface TaskPercentage {
  type: string;
  percentage: number;
  color: string;
  label: string;
}

export default function ActivitiesPercentageChart() {
  const [taskStats, setTaskStats] = useState<TASK_STATISTICS | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Fetching task statistics for activities chart");
        
        const response = await apiClient.dashboard.getTaskStatistics();
        console.log("📦 Full API response:", response);
        
        // Handle different response structures
        let stats: TASK_STATISTICS;
        
        if (response.data) {
          stats = response.data;
        } else if (response) {
          stats = response as any;
        } else {
          throw new Error("Invalid response structure");
        }
        
        console.log("📊 Task statistics extracted:", stats);
        
        // Validate that we have the required fields
        if (typeof stats.warrantySubmissionTasksPercentage === 'undefined') {
          console.error("❌ Missing required fields in task statistics:", stats);
          throw new Error("Invalid task statistics format");
        }
        
        setTaskStats(stats);
        console.log("✅ Task statistics processed successfully");
      } catch (error: any) {
        console.error("❌ Error fetching task statistics:", error);
        setError(`Failed to load task statistics: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTaskStatistics();
  }, []);

  // Sort percentages in descending order for circle sizing
  const getSortedPercentages = (): TaskPercentage[] => {
    if (!taskStats) return [];
    
    // Calculate combined warranty percentage
    const warrantyPercentage = (taskStats.warrantySubmissionTasksPercentage || 0) + (taskStats.warrantyReturnTasksPercentage || 0);
    
    const percentages = [
      { 
        type: "warranty", 
        percentage: warrantyPercentage, 
        color: "#8b5cf6", 
        label: "Bảo hành" 
      },
      { 
        type: "repair", 
        percentage: taskStats.repairTasksPercentage || 0, 
        color: "#f97316", 
        label: "Sửa chữa" 
      },
      { 
        type: "replace", 
        percentage: taskStats.replaceTasksPercentage || 0, 
        color: "#10b981", 
        label: "Thay thế" 
      }
    ];
    
    return percentages.sort((a, b) => b.percentage - a.percentage);
  };

  const sortedPercentages = getSortedPercentages();

  // Calculate combined warranty totals for display
  const getCombinedWarrantyTotals = () => {
    if (!taskStats) return 0;
    return (taskStats.totalWarrantySubmissionTasks || 0) + (taskStats.totalWarrantyReturnTasks || 0);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading task statistics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div>
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-500 underline text-sm"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Thống kê hoạt động công việc</CardTitle>
        <Button variant="outline" size="sm" className="gap-2">
          Tuần
          <ChevronDown className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        
        {/* Main chart area with dynamic circles */}
        <div className="relative h-[280px] flex items-center justify-center mb-6">
          {sortedPercentages.length > 0 ? (
            <>
              {/* Largest circle - highest percentage */}
              {sortedPercentages[0] && (
                <div 
                  className="absolute w-48 h-48 rounded-full flex items-center justify-center text-white shadow-lg"
                  style={{ backgroundColor: sortedPercentages[0].color }}
                >
                  <div className="text-center">
                    <div className="text-3xl font-bold">{sortedPercentages[0].percentage.toFixed(0)}%</div>
                    <div className="text-sm">{sortedPercentages[0].label}</div>
                  </div>
                </div>
              )}

              {/* Medium circle - second highest percentage */}
              {sortedPercentages[1] && (
                <div 
                  className="absolute w-32 h-32 rounded-full flex items-center justify-center text-white -translate-x-24 translate-y-16 shadow-lg"
                  style={{ backgroundColor: sortedPercentages[1].color }}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold">{sortedPercentages[1].percentage.toFixed(0)}%</div>
                    <div className="text-xs">{sortedPercentages[1].label}</div>
                  </div>
                </div>
              )}

              {/* Small circle - lowest percentage */}
              {sortedPercentages[2] && (
                <div 
                  className="absolute w-20 h-20 rounded-full flex items-center justify-center text-white translate-x-28 -translate-y-16 shadow-lg"
                  style={{ backgroundColor: sortedPercentages[2].color }}
                >
                  <div className="text-center">
                    <div className="text-sm font-bold">{sortedPercentages[2].percentage.toFixed(0)}%</div>
                    <div className="text-xs">{sortedPercentages[2].label}</div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-muted-foreground text-center">
              <p>No task data available</p>
              <p className="text-xs mt-1">All percentages are 0%</p>
            </div>
          )}
        </div>

        {/* Statistics Grid - Updated to show combined warranty */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-purple-500" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {getCombinedWarrantyTotals()}
            </div>
            <div className="text-sm text-muted-foreground">Bảo hành</div>
            {/* <div className="text-xs text-gray-500 mt-1">
              Gửi: {taskStats?.totalWarrantySubmissionTasks || 0} | 
              Nhận: {taskStats?.totalWarrantyReturnTasks || 0}
            </div> */}
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-orange-500" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {taskStats?.totalRepairTasks || 0}
            </div>
            <div className="text-sm text-muted-foreground">Sửa chữa</div>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-muted/20 border">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className="h-4 w-4 text-green-500" />
              <TrendingUp className="h-3 w-3 text-green-500" />
            </div>
            <div className="text-2xl font-bold">
              {taskStats?.totalReplaceTasks || 0}
            </div>
            <div className="text-sm text-muted-foreground">Thay thế</div>
          </div>
        </div>

        {/* Additional Performance Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="font-medium">Toàn bộ công việc</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-blue-600">
                {taskStats?.totalTasks || 0}
              </span>
              <div className="text-xs text-muted-foreground">Tổng</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="font-medium">Công việc đang chờ</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-yellow-600">
                {taskStats?.totalPendingTasks || 0}
              </span>
              <div className="text-xs text-muted-foreground">
                {taskStats?.totalTasks ? 
                  `${((taskStats.totalPendingTasks / taskStats.totalTasks) * 100).toFixed(1)}% trên tổng` : 
                  '0% trên tổng'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="font-medium">Công việc đang thực hiện</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-orange-600">
                {taskStats?.totalInProgressTasks || 0}
              </span>
              <div className="text-xs text-muted-foreground">
                {taskStats?.totalTasks ? 
                  `${((taskStats?.totalInProgressTasks / taskStats.totalTasks) * 100).toFixed(1)}% trên tổng` : 
                  '0% trên tổng'
                }
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="font-medium">Công việc đã hoàn thành</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">
                {taskStats?.totalCompletedTasks || 0}
              </span>
              <div className="text-xs text-muted-foreground">
                {taskStats?.totalTasks ? 
                  `${((taskStats.totalCompletedTasks / taskStats.totalTasks) * 100).toFixed(1)}% trên tổng` : 
                  '0% trên tổng'
                }
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
