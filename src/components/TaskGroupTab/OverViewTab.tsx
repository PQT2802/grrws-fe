"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock,
  Calendar,
  CheckCircle,
  Package,
  AlertCircle,
  Shield,
  Eye,
  MoreHorizontal,
  StopCircle,
  Loader2,
  MapPin,
  Building,
} from "lucide-react";
import { formatAPIDateUTC, getFirstLetterUppercase } from "@/lib/utils";
import { TASK_GROUP_WEB, TASK_IN_GROUP, REPAIR_TASK_DETAIL } from "@/types/task.type";
import {
  translateTaskStatus,
  translateTaskType,
} from "@/utils/textTypeTask";
import { getStatusColor } from "@/utils/colorUtils";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api-client";

interface OverviewTabProps {
  taskGroup: TASK_GROUP_WEB;
  onTaskClick: (task: TASK_IN_GROUP) => void;
  onTaskStatusUpdate?: () => void; // Callback to refresh task data
}

const OverviewTab = ({ taskGroup, onTaskClick, onTaskStatusUpdate }: OverviewTabProps) => {
  const [disablingTasks, setDisablingTasks] = useState<Set<string>>(new Set());
  const [repairTaskDetails, setRepairTaskDetails] = useState<Record<string, REPAIR_TASK_DETAIL>>({});

  // Fetch repair task details to get isOnSiteRepair information
  useEffect(() => {
    const fetchRepairTaskDetails = async () => {
      const repairTasks = taskGroup.tasks.filter(task => task.taskType.toLowerCase() === "repair");
      
      const detailsMap: Record<string, REPAIR_TASK_DETAIL> = {};
      
      await Promise.allSettled(
        repairTasks.map(async (task) => {
          try {
            const detail = await apiClient.task.getRepairTaskDetail(task.taskId);
            if (detail) {
              detailsMap[task.taskId] = detail;
            }
          } catch (error) {
            console.warn(`Could not fetch repair task detail for ${task.taskId}:`, error);
          }
        })
      );
      
      setRepairTaskDetails(detailsMap);
    };

    if (taskGroup.tasks.some(task => task.taskType.toLowerCase() === "repair")) {
      fetchRepairTaskDetails();
    }
  }, [taskGroup.tasks]);

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "uninstallation":
        return <Package className="h-4 w-4 text-red-500" />;
      case "installation":
        return <Package className="h-4 w-4 text-green-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "stockin":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "warrantysubmission":
      case "warrantyreturn":
      case "warranty":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRepairLocationBadge = (task: TASK_IN_GROUP) => {
    if (task.taskType.toLowerCase() !== "repair") return null;
    
    const repairDetail = repairTaskDetails[task.taskId];
    if (!repairDetail) return null;

    return (
      <Badge 
        variant={repairDetail.isOnSiteRepair ? "default" : "secondary"}
        className="flex items-center gap-1 text-xs ml-2"
      >
        {repairDetail.isOnSiteRepair ? (
          <>
            <MapPin className="h-3 w-3" />
            Tại chỗ
          </>
        ) : (
          <>
            <Building className="h-3 w-3" />
            Xưởng
          </>
        )}
      </Badge>
    );
  };

  const handleDisableTask = async (task: TASK_IN_GROUP) => {
    // ✅ Updated condition: Only disable completed tasks
    if (task.status.toLowerCase() === "completed") {
      toast.error("Không thể ngừng nhiệm vụ đã hoàn thành");
      return;
    }

    try {
      setDisablingTasks(prev => new Set(prev).add(task.taskId));
      
      console.log(`🛑 Disabling task ${task.taskId} with unassignStaff=true`);
      
      await apiClient.task.disableTask(task.taskId, true);
      
      // ✅ Updated success toast message
      toast.success("Ngừng công việc thành công", {
        description: `Nhiệm vụ "${task.taskName}" đã được ngừng và chuyển về trạng thái Đang chờ`,
      });

      // Call the callback to refresh task data
      if (onTaskStatusUpdate) {
        onTaskStatusUpdate();
      }
      
    } catch (error) {
      console.error("❌ Failed to disable task:", error);
      toast.error("Không thể ngừng nhiệm vụ", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setDisablingTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(task.taskId);
        return newSet;
      });
    }
  };

  const isTaskDisabling = (taskId: string) => disablingTasks.has(taskId);

  // ✅ Updated function: Only disable for completed tasks
  const canDisableTask = (task: TASK_IN_GROUP) => {
    return task.status.toLowerCase() !== "completed";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Nhiệm vụ trong Nhóm ({taskGroup.tasks.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thứ tự</TableHead>
              <TableHead>Tên nhiệm vụ</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Người được giao</TableHead>
              <TableHead>Thời gian</TableHead>
              <TableHead className="w-[100px] text-center">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taskGroup.tasks
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((task) => (
                <TableRow
                  key={task.taskId}
                  className={`hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer ${
                    task.status.toLowerCase() === "suggested"
                      ? "bg-purple-50 dark:bg-purple-950/30"
                      : ""
                  }`}
                  onClick={() => onTaskClick(task)}
                >
                  <TableCell>
                    <Badge variant="secondary">#{task.orderIndex}</Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-2 flex-wrap">
                        {task.taskName}
                        {task.status.toLowerCase() === "suggested" && (
                          <Badge
                            variant="outline"
                            className="text-purple-600 border-purple-300"
                          >
                            Mới
                          </Badge>
                        )}
                        {getRepairLocationBadge(task)}
                      </div>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {task.taskDescription}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTaskTypeIcon(task.taskType)}
                      <span className="text-sm">
                        {translateTaskType(task.taskType)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(task.status)} text-xs`}>
                      {translateTaskStatus(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="bg-primary text-white text-xs">
                          {getFirstLetterUppercase(task.assigneeName ?? "NA")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {task.assigneeName || "Chưa giao"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {task.startTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Bắt đầu:{" "}
                          {formatAPIDateUTC(task.startTime, "datetime")}
                        </div>
                      )}
                      {task.expectedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Dự kiến:{" "}
                          {formatAPIDateUTC(task.expectedTime, "datetime")}
                        </div>
                      )}
                      {task.endTime && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Kết thúc:{" "}
                          {formatAPIDateUTC(task.endTime, "datetime")}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={isTaskDisabling(task.taskId)}
                        >
                          {isTaskDisabling(task.taskId) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskClick(task);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDisableTask(task);
                          }}
                          disabled={!canDisableTask(task) || isTaskDisabling(task.taskId)}
                          className={`${
                            canDisableTask(task) && !isTaskDisabling(task.taskId)
                              ? "text-red-600 focus:text-red-600 hover:text-red-600" 
                              : "text-gray-400 cursor-not-allowed opacity-50"
                          }`}
                        >
                          {isTaskDisabling(task.taskId) ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <StopCircle className="h-4 w-4 mr-2" />
                          )}
                          Ngừng công việc
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OverviewTab;