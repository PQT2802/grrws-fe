"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  User,
  MapPin,
  Wrench,
  Archive,
  Settings,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  RefreshCw,
  Loader2,
  FileText,
  Eye,
} from "lucide-react";
import { REQUEST_ITEM } from "@/types/dashboard.type";
import { apiClient } from "@/lib/api-client";
import {
  translateTaskStatus,
  translateTaskPriority,
  translateTaskType,
  translateGroupType,
} from "@/utils/textTypeTask";

interface RequestDetailModalProps {
  request: REQUEST_ITEM | null;
  isOpen: boolean;
  onClose: () => void;
}

interface RequestWithTasks extends REQUEST_ITEM {
  tasks?: any[];
  createdByName?: string;
}

export default function RequestDetailModal({
  request,
  isOpen,
  onClose,
}: RequestDetailModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [taskGroups, setTaskGroups] = useState<any[]>([]);
  const [technicalIssues, setTechnicalIssues] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [createdByName, setCreatedByName] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const fetchRequestDetails = useCallback(async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      // Fetch all related data - using correct APIs
      const [taskGroupsData, technicalIssuesData, errorsData] =
        await Promise.all([
          apiClient.task.getTaskGroups(request.id, 1, 100), // Use task groups API
          apiClient.request.getTechnicalIssueOfRequest(request.id), // Correct technical issues API
          apiClient.request.getErrorOfRequest(request.id), // Errors API
        ]);

      // Fetch creator name
      try {
        const userInfo = await apiClient.user.getUserById(request.createdBy);
        setCreatedByName(userInfo.fullName || userInfo.name || "Unknown User");
      } catch (error) {
        console.error("Error fetching creator name:", error);
        setCreatedByName("Unknown User");
      }

      // Handle task groups response structure
      let taskGroupsArray = [];
      if (taskGroupsData?.data) {
        taskGroupsArray = Array.isArray(taskGroupsData.data)
          ? taskGroupsData.data
          : [taskGroupsData.data];
      }

      setTaskGroups(taskGroupsArray);
      setTechnicalIssues(technicalIssuesData || []);
      setErrors(errorsData || []);
    } catch (error) {
      console.error("Error fetching request details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [request]);
  useEffect(() => {
    if (request && isOpen) {
      fetchRequestDetails();
    }
  }, [request, isOpen, fetchRequestDetails]);

  const getTaskTypeIcon = (taskType: string) => {
    if (!taskType) return Package;

    switch (taskType.toLowerCase()) {
      case "repair":
        return Wrench;
      case "warranty":
      case "warrantysubmission":
      case "warrantyreturn":
        return Archive;
      case "replacement":
        return RefreshCw;
      case "installation":
      case "uninstallation":
        return Settings;
      default:
        return Package;
    }
  };

  const getGroupTypeIcon = (groupType: string) => {
    if (!groupType) return FileText;

    switch (groupType.toLowerCase()) {
      case "repair":
        return Wrench;
      case "warranty":
      case "warrantysubmission":
      case "warrantyreturn":
        return Archive;
      case "replacement":
        return RefreshCw;
      case "installation":
      case "uninstallation":
        return Settings;
      default:
        return FileText;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return AlertCircle;

    switch (status.toLowerCase()) {
      case "pending":
        return Clock;
      case "inprogress":
      case "in-progress":
        return RefreshCw;
      case "completed":
        return CheckCircle;
      case "cancelled":
        return XCircle;
      case "paused":
        return Pause;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return "bg-gray-500/10 text-gray-400 border-gray-500/20";

    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "inprogress":
      case "in-progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "paused":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    if (!priority) return "bg-gray-500/10 text-gray-400 border-gray-500/20";

    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";

    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const safeTranslateTaskStatus = (status: string) => {
    try {
      return translateTaskStatus(status || "unknown");
    } catch (error) {
      console.error("Error translating status:", error);
      return status || "Unknown";
    }
  };

  const safeTranslateTaskPriority = (priority: string) => {
    try {
      return translateTaskPriority(priority || "medium");
    } catch (error) {
      console.error("Error translating priority:", error);
      return priority || "Medium";
    }
  };

  const safeTranslateTaskType = (taskType: string) => {
    try {
      return translateTaskType(taskType || "unknown");
    } catch (error) {
      console.error("Error translating task type:", error);
      return taskType || "Unknown";
    }
  };

  const safeTranslateGroupType = (groupType: string) => {
    try {
      return translateGroupType(groupType || "unknown");
    } catch (error) {
      console.error("Error translating group type:", error);
      return groupType || "Unknown";
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  if (!request) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Chi tiết báo cáo
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải chi tiết báo cáo...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Request Information - Improved Layout with Horizontal Badge Alignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Thông tin yêu cầu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-4">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Tiêu đề yêu cầu
                        </span>
                        <span className="text-sm">
                          {request.requestTitle || "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm font-medium text-muted-foreground">
                          Mô tả
                        </span>
                        <span className="text-sm">
                          {request.description || "Không có mô tả"}
                        </span>
                      </div>

                      {/* Horizontal Badge Layout - Status and Priority Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Status Badge */}
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Trạng thái
                          </span>
                          <Badge
                            className={`${getStatusColor(
                              request.status
                            )} w-fit px-3 py-1`}
                          >
                            {safeTranslateTaskStatus(request.status)}
                          </Badge>
                        </div>
                        {/* Priority Badge */}
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm font-medium text-muted-foreground">
                            Độ ưu tiên
                          </span>
                          <Badge
                            className={`${getPriorityColor(
                              request.priority
                            )} w-fit px-3 py-1`}
                          >
                            {safeTranslateTaskPriority(request.priority)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <User className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground">
                            Người tạo
                          </span>
                          <span className="text-sm">
                            {createdByName || "Loading..."}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground">
                            Ngày tạo
                          </span>
                          <span className="text-sm">
                            {formatDate(request.createdDate)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground">
                            Vị trí
                          </span>
                          <span className="text-sm">
                            {request.areaName || "N/A"} -{" "}
                            {request.zoneName || "N/A"} (Vị trí{" "}
                            {request.positionIndex || "N/A"})
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Package className="h-4 w-4 text-muted-foreground mt-1" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-muted-foreground">
                            Thiết bị
                          </span>
                          <span className="text-sm">
                            {request.deviceName || "N/A"} (
                            {request.deviceCode || "N/A"})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Technical Issues & Errors - Enhanced with Colored Cards */}
              {(technicalIssues.length > 0 || errors.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Thông tin lỗi / Triệu chứng kỹ thuật
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {technicalIssues.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-blue-600">
                          Triệu chứng kỹ thuật ({technicalIssues.length})
                        </h4>
                        <div className="space-y-3">
                          {technicalIssues.map((issue, index) => (
                            <div
                              key={index}
                              className="relative p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg dark:bg-blue-950/20"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                                      {index + 1}
                                    </span>
                                    <span className="font-medium text-blue-800 dark:text-blue-200">
                                      {issue.name ||
                                        issue.displayName ||
                                        "Unnamed Technical Issue"}
                                    </span>
                                    {issue.isCommon && (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800 border-yellow-300"
                                      >
                                        Phổ biến
                                      </Badge>
                                    )}
                                  </div>

                                  {issue.description && (
                                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 ml-8">
                                      {issue.description}
                                    </p>
                                  )}

                                  {issue.symptomCode && (
                                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-8">
                                      Mã triệu chứng: {issue.symptomCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 text-orange-600">
                          Lỗi kỹ thuật ({errors.length})
                        </h4>
                        <div className="space-y-3">
                          {errors.map((error, index) => (
                            <div
                              key={index}
                              className="relative p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg dark:bg-orange-950/20"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                                      {technicalIssues.length + index + 1}
                                    </span>
                                    <span className="font-medium text-orange-800 dark:text-orange-200">
                                      {error.errorName ||
                                        error.name ||
                                        "Unknown Error"}
                                    </span>
                                    {error.isCommon && (
                                      <Badge
                                        variant="outline"
                                        className="bg-yellow-100 text-yellow-800 border-yellow-300"
                                      >
                                        Phổ biến
                                      </Badge>
                                    )}
                                  </div>

                                  {error.description && (
                                    <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 ml-8">
                                      {error.description}
                                    </p>
                                  )}

                                  {error.errorCode && (
                                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 ml-8">
                                      Mã lỗi: {error.errorCode}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Task Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Nhóm công việc
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {taskGroups.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>
                        Không có nhóm công việc nào được tạo cho yêu cầu này
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {taskGroups.map((group, groupIndex) => {
                        const GroupIcon = getGroupTypeIcon(group.groupType);

                        return (
                          <div
                            key={groupIndex}
                            className="border rounded-lg p-4 bg-muted/30"
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <GroupIcon className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <h4 className="font-medium text-lg">
                                  {group.groupName}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">
                                    {safeTranslateGroupType(group.groupType)}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(group.createdDate)}
                                  </span>
                                  {group.createdByName && (
                                    <span className="text-xs text-muted-foreground">
                                      • Tạo bởi: {group.createdByName}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Tasks in Group */}
                            {group.tasks && group.tasks.length > 0 && (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Công việc</TableHead>
                                    <TableHead>Loại</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead>Ưu tiên</TableHead>
                                    <TableHead>Người thực hiện</TableHead>
                                    <TableHead>Thời gian</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.tasks
                                    .sort(
                                      (a: any, b: any) =>
                                        (a.orderIndex || 0) -
                                        (b.orderIndex || 0)
                                    )
                                    .map((task: any, taskIndex: number) => {
                                      const TaskIcon = getTaskTypeIcon(
                                        task.taskType
                                      );
                                      const StatusIcon = getStatusIcon(
                                        task.status
                                      );

                                      return (
                                        <TableRow key={taskIndex}>
                                          <TableCell>
                                            <div className="space-y-1">
                                              <div className="flex items-center gap-2">
                                                <span className="flex items-center justify-center w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                                                  {task.orderIndex ||
                                                    taskIndex + 1}
                                                </span>
                                                <span className="font-medium">
                                                  {task.taskName ||
                                                    "Unnamed Task"}
                                                </span>
                                              </div>
                                              <div className="text-sm text-muted-foreground line-clamp-2 ml-7">
                                                {task.taskDescription ||
                                                  task.description ||
                                                  "No description"}
                                              </div>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-2">
                                              <TaskIcon className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm">
                                                {safeTranslateTaskType(
                                                  task.taskType
                                                )}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              className={`${getStatusColor(
                                                task.status
                                              )} flex items-center gap-1 w-fit`}
                                            >
                                              <StatusIcon className="h-3 w-3" />
                                              {safeTranslateTaskStatus(
                                                task.status
                                              )}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <Badge
                                              className={getPriorityColor(
                                                task.priority
                                              )}
                                            >
                                              {safeTranslateTaskPriority(
                                                task.priority
                                              )}
                                            </Badge>
                                          </TableCell>
                                          <TableCell>
                                            <div className="flex items-center gap-1 text-sm">
                                              <User className="h-3 w-3 text-muted-foreground" />
                                              <span>
                                                {task.assigneeName ||
                                                  "Chưa phân công"}
                                              </span>
                                            </div>
                                          </TableCell>
                                          <TableCell>
                                            <div className="space-y-1">
                                              {task.startTime && (
                                                <div className="text-sm">
                                                  Bắt đầu:{" "}
                                                  {formatDate(task.startTime)}
                                                </div>
                                              )}
                                              {task.expectedTime && (
                                                <div className="text-xs text-orange-400">
                                                  Dự kiến:{" "}
                                                  {formatDate(
                                                    task.expectedTime
                                                  )}
                                                </div>
                                              )}
                                              {task.endTime && (
                                                <div className="text-xs text-green-400">
                                                  Hoàn thành:{" "}
                                                  {formatDate(task.endTime)}
                                                </div>
                                              )}
                                            </div>
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Images from Request - Improved with HOD layout and eye icon */}
              {request.issues && request.issues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Hình ảnh báo cáo ({request.issues.length} triệu chứng)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {request.issues.map((issue, index) => (
                        <div key={index} className="p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                                {index + 1}
                              </span>
                              <span className="font-medium text-sm">
                                {issue.displayName || "Unnamed Issue"}
                              </span>
                            </div>
                            {issue.imageUrls && issue.imageUrls.length > 0 && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                  {issue.imageUrls.length} hình ảnh
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleImageClick(issue.imageUrls[0])
                                  }
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          {issue.imageUrls && issue.imageUrls.length > 1 && (
                            <div className="ml-9 flex gap-2">
                              {issue.imageUrls.slice(1).map((url, imgIndex) => (
                                <Button
                                  key={imgIndex}
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleImageClick(url)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Hình {imgIndex + 2}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal - Removed Custom Close Button */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem hình ảnh</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Preview"
                width={800}
                height={600}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
