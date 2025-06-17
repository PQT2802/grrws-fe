// ✅ Create components/TaskGroupModal/TaskGroupModal.tsx:
"use client";

import { useState } from "react";
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
import { formatTimeStampDate, getFirstLetterUppercase } from "@/lib/utils";
import { TASK_GROUP_WEB, TASK_IN_GROUP } from "@/types/task.type";
import {
  Clock,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Package,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TaskGroupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskGroup: TASK_GROUP_WEB | null;
}

const TaskGroupModal = ({
  open,
  onOpenChange,
  taskGroup,
}: TaskGroupModalProps) => {
  const [selectedTask, setSelectedTask] = useState<TASK_IN_GROUP | null>(null);

  if (!taskGroup) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
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
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Package className="h-5 w-5" />
            {taskGroup.groupName}
          </DialogTitle>
          <DialogDescription>
            Task group details and individual tasks breakdown
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tasks Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Tasks in Group ({taskGroup.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Task Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskGroup.tasks
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((task) => (
                      <TableRow
                        key={task.taskId}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell>
                          <Badge variant="secondary">#{task.orderIndex}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{task.taskName}</div>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {task.taskDescription}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(task.taskType)}
                            <span className="text-sm">{task.taskType}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(task.status)} text-xs`}
                          >
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getPriorityColor(
                              task.priority
                            )} text-xs`}
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getFirstLetterUppercase(task.assigneeName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assigneeName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Start:{" "}
                              {formatTimeStampDate(task.startTime, "datetime")}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expected:{" "}
                              {formatTimeStampDate(
                                task.expectedTime,
                                "datetime"
                              )}
                            </div>
                            {task.endTime && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Ended:{" "}
                                {formatTimeStampDate(task.endTime, "datetime")}
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
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => setSelectedTask(task)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskGroupModal;
