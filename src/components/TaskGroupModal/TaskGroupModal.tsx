// ✅ Create components/TaskGroupModal/TaskGroupModal.tsx:
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  formatAPIDateToHoChiMinh,
  getFirstLetterUppercase,
} from "@/lib/utils";
import { TASK_GROUP_WEB, TASK_IN_GROUP } from "@/types/task.type";
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  Package,
  Eye,
  MoreHorizontal,
  Check,
  Loader2,
  ExternalLink,
  Shield,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import {  translateTaskType } from "@/utils/textTypeTask";

interface TaskGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskGroup: TASK_GROUP_WEB | null;
  onTaskGroupUpdated?: () => void;
}

const TaskGroupModal = ({
  open,
  onOpenChange,
  taskGroup,
  onTaskGroupUpdated,
}: TaskGroupModalProps) => {
  const params = useParams();
  const workspaceId = params?.["workspace-id"] as string;

  const [selectedTask, setSelectedTask] = useState<TASK_IN_GROUP | null>(null);
  const [applyingTasks, setApplyingTasks] = useState<boolean>(false);

  if (!taskGroup) return null;

  const suggestedTasks = taskGroup.tasks.filter(
    (task) => task.status.toLowerCase() === "suggested"
  );
  const hasSuggestedTasks = suggestedTasks.length > 0;

  const getTaskRoute = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "uninstallation":
        return "uninstall";
      case "installation":
        return "install";
      case "warrantysubmission":
      case "warrantyreturn":
      case "warranty":
        return "warranty";
      case "repair":
        return "repair";
      default:
        return null;
    }
  };

  const getTaskDetailUrl = (task: TASK_IN_GROUP) => {
    const route = getTaskRoute(task.taskType);
    if (!route || !workspaceId) return null;

    return `/workspace/${workspaceId}/tasks/${route}/${task.taskId}`;
  };

  const isTaskTypeSupported = (taskType: string) => {
    return getTaskRoute(taskType) !== null;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "suggested":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "uninstallation":
        return <Package className="h-4 w-4 text-red-500" />;
      case "installation":
        return <Package className="h-4 w-4 text-green-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warrantysubmission":
      case "warranty":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleApplySuggestedTasks = async () => {
    try {
      setApplyingTasks(true);

      console.log(
        `Applying suggested tasks for group: ${taskGroup.taskGroupId}`
      );

      await apiClient.task.applySuggestedGroupTasks(taskGroup.taskGroupId);

      toast.success(
        `Đã áp dụng thành công ${suggestedTasks.length} nhiệm vụ được đề xuất!`
      );

      onOpenChange(false);

      if (onTaskGroupUpdated) {
        onTaskGroupUpdated();
      }
    } catch (error) {
      console.error("Failed to apply suggested tasks:", error);
      toast.error("Không thể áp dụng nhiệm vụ được đề xuất. Vui lòng thử lại.");
    } finally {
      setApplyingTasks(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5" />
              <div>
                <DialogTitle>{taskGroup.groupName}</DialogTitle>
                <DialogDescription>
                  Chi tiết nhóm nhiệm vụ và phân tích nhiệm vụ cá nhân
                </DialogDescription>
              </div>
            </div>

            {hasSuggestedTasks && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={applyingTasks}
                  >
                    {applyingTasks ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Áp dụng tất cả nhiệm vụ ({suggestedTasks.length})
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Áp dụng nhiệm vụ</AlertDialogTitle>
                    <AlertDialogDescription>
                      Bạn có chắc chắn muốn áp dụng tất cả{" "}
                      {suggestedTasks.length} nhiệm vụ được đề xuất? Điều này sẽ
                      thay đổi trạng thái của chúng từ &quot;Được đề xuất&quot;
                      thành &quot;Đang chờ xử lý&quot; và chúng sẽ được giao cho
                      kỹ thuật viên.
                      <br />
                      <br />
                      <strong>Nhiệm vụ được đề xuất:</strong>
                      <ul className="mt-2 space-y-1">
                        {suggestedTasks.map((task) => (
                          <li key={task.taskId} className="text-sm">
                            • {task.taskName} - {task.taskType}
                          </li>
                        ))}
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleApplySuggestedTasks}
                      disabled={applyingTasks}
                    >
                      {applyingTasks ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Đang áp dụng...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Áp dụng nhiệm vụ
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {hasSuggestedTasks && (
            <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-800 dark:text-purple-200">
                      Có nhiệm vụ được đề xuất
                    </h4>
                    <p className="text-sm text-purple-600 dark:text-purple-300">
                      {suggestedTasks.length} nhiệm vụ sẵn sàng để áp dụng.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nhiệm vụ trong nhóm ({taskGroup.tasks.length})
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
                    <TableHead>Người thực hiện</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskGroup.tasks
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((task) => {
                      const taskDetailUrl = getTaskDetailUrl(task);
                      const isSupported = isTaskTypeSupported(task.taskType);

                      return (
                        <TableRow
                          key={task.taskId}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            task.status.toLowerCase() === "suggested"
                              ? "bg-purple-50 dark:bg-purple-950/30"
                              : ""
                          }`}
                        >
                          <TableCell>
                            <Badge variant="secondary">
                              #{task.orderIndex}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {task.taskName}
                                {task.status.toLowerCase() === "suggested" && (
                                  <Badge
                                    variant="outline"
                                    className="text-purple-600 border-purple-300"
                                  >
                                    Mới
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 max-w-xs ">
                                {task.taskDescription}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getTaskTypeIcon(task.taskType)}
                              <div className="flex flex-col">
                                <span className="text-sm">{translateTaskType(task.taskType)}</span>
                                <span
                                  className={`text-xs ${
                                    isSupported
                                      ? "text-green-600"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {isSupported
                                    ? `/${getTaskRoute(task.taskType)}/`
                                    : "Không khả dụng"}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(
                                task.status
                              )} text-xs`}
                            >
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="bg-primary text-white text-xs">
                                  {getFirstLetterUppercase(
                                    task.assigneeName ?? "NA"
                                  )}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {task.assigneeName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              {task.startTime && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Bắt đầu:{" "}
                                  {formatAPIDateToHoChiMinh(
                                    task.startTime,
                                    "datetime"
                                  )}
                                </div>
                              )}
                              {task.expectedTime && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  Dự kiến:{" "}
                                  {formatAPIDateToHoChiMinh(
                                    task.expectedTime,
                                    "datetime"
                                  )}
                                </div>
                              )}
                              {task.endTime && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                  Kết thúc:{" "}
                                  {formatAPIDateToHoChiMinh(
                                    task.endTime,
                                    "datetime"
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Hành động</DropdownMenuLabel>

                                {isSupported && taskDetailUrl ? (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={taskDetailUrl}
                                      onClick={() => onOpenChange(false)}
                                      className="flex items-center gap-2 w-full cursor-pointer"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Xem chi tiết
                                      <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                                    </Link>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    disabled
                                    className="flex items-center gap-2 text-gray-400"
                                  >
                                    <Eye className="h-4 w-4" />
                                    Xem chi tiết
                                    <span className="text-xs ml-auto">
                                      Không khả dụng
                                    </span>
                                  </DropdownMenuItem>
                                )}

                                {task.status.toLowerCase() === "suggested" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      console.log(
                                        "Apply single task:",
                                        task.taskId
                                      );
                                      toast.info(
                                        "Tính năng áp dụng nhiệm vụ đơn lẻ sắp ra mắt!"
                                      );
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Áp dụng nhiệm vụ này
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskGroupModal;
