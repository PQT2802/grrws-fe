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
  DropdownMenuLabel,
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
  Check,
} from "lucide-react";
import { formatAPIDateToHoChiMinh, formatAPIDateUTC, getFirstLetterUppercase } from "@/lib/utils";
import { TASK_GROUP_WEB, TASK_IN_GROUP } from "@/types/task.type";
import {
  translateTaskPriority,
  translateTaskStatus,
  translateTaskType,
} from "@/utils/textTypeTask";
import { getPriorityColor, getStatusColor } from "@/utils/colorUtils";
import { toast } from "sonner";

interface OverviewTabProps {
  taskGroup: TASK_GROUP_WEB;
  onTaskClick: (task: TASK_IN_GROUP) => void;
}

const OverviewTab = ({ taskGroup, onTaskClick }: OverviewTabProps) => {
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
              <TableHead>Mức độ ưu tiên</TableHead>
              <TableHead>Người được giao</TableHead>
              <TableHead>Thời gian</TableHead>
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
                    <Badge
                      className={`${getPriorityColor(task.priority)} text-xs`}
                    >
                      {translateTaskPriority(task.priority)}
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
                  {/* <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>

                        {task.status.toLowerCase() === "suggested" && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              toast.info("Tính năng áp dụng đơn lẻ sắp ra mắt!");
                            }}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Áp dụng nhiệm vụ này
                          </DropdownMenuItem>
                        )}

                        {!["WarrantySubmission", "WarrantyReturn"].includes(
                          task.taskType
                        ) && (
                          <DropdownMenuItem onClick={() => onTaskClick(task)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell> */}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default OverviewTab;