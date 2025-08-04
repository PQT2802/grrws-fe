"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatAPIDateToHoChiMinh, getFirstLetterUppercase } from "@/lib/utils";
import {
  TASK_IN_GROUP,
  WARRANTY_TASK_DETAIL,
  INSTALL_TASK_DETAIL,
  DOCUMENT,
  REPAIR_TASK_DETAIL,
} from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import {
  X,
  Clock,
  Calendar,
  AlertCircle,
  Package,
  Shield,
  CheckCircle,
  FileText,
  Timer,
  Monitor,
  ArrowRight,
  FileImage,
  FileIcon,
  ChevronDown,
  ChevronRight,
  Plus,
  UserCheck,
  Wrench,
} from "lucide-react";
import {
  translateTaskPriority,
  translateTaskStatus,
  translateTaskType,
} from "@/utils/textTypeTask";
import {
  getGroupTypeColor,
  getPriorityColor,
  getStatusColor,
} from "@/utils/colorUtils";
import AddErrorToTaskModal from "@/components/ErrorTableCpn/AddErrorToTaskModal";
import { apiClient } from "@/lib/api-client";

interface TaskDetailSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  task: TASK_IN_GROUP | null;
  taskDetail:
    | WARRANTY_TASK_DETAIL
    | INSTALL_TASK_DETAIL
    | REPAIR_TASK_DETAIL
    | null;
  oldDevice?: DEVICE_WEB | null;
  newDevice?: DEVICE_WEB | null;
  onRefreshTaskDetail: (taskId: string) => void;
}

const TaskDetailSidePanel = ({
  isOpen,
  onClose,
  task,
  taskDetail,
  oldDevice,
  newDevice,
  onRefreshTaskDetail,
}: TaskDetailSidePanelProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timeout = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  if (!isAnimating && !isOpen) return null;
  if (!task) return null;

  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "uninstallation":
        return <Package className="h-4 w-4 text-red-500" />;
      case "installation":
        return <Package className="h-4 w-4 text-green-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warrantysubmission":
      case "warrantyreturn":
      case "warranty":
        return <Shield className="h-4 w-4 text-blue-500" />;
      case "storagereturn":
      case "stockreturn":
        return <Package className="h-4 w-4 text-cyan-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const warrantyTaskDetail = taskDetail as WARRANTY_TASK_DETAIL;
  const repairTaskDetail = taskDetail as REPAIR_TASK_DETAIL;

  const handleToggleExpandError = (errorId: string) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  const handleChangeAssignee = () => {
    // TODO: Implement change assignee functionality
    console.log("Change assignee clicked");
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-2/5 lg:w-1/3 xl:w-1/4 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
            <div className="flex items-center gap-2">
              {getTaskTypeIcon(task.taskType)}
              <h2 className="text-lg font-semibold">Chi tiết Nhiệm vụ</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 pb-20 space-y-3">
            {/* Task Header */}
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-bold leading-tight">
                  {task.taskName}
                </h3>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-xs">
                  #{task.orderIndex}
                </Badge>
                <Badge className={`${getStatusColor(task.status)} text-xs`}>
                  {translateTaskStatus(task.status)}
                </Badge>
                <Badge className={`${getPriorityColor(task.priority)} text-xs`}>
                  {translateTaskPriority(task.priority)}
                </Badge>
                {task.status.toLowerCase() === "suggested" && (
                  <Badge
                    variant="outline"
                    className="text-purple-600 border-purple-300 text-xs"
                  >
                    Đề xuất mới
                  </Badge>
                )}
                <Badge
                  className={`${getGroupTypeColor(task.taskType)}text-xs gap-2`}
                >
                  {getTaskTypeIcon(task.taskType)}
                  {translateTaskType(task.taskType)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Basic Task Information - Compact Layout */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Thông tin Cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {/* Description - Full width */}
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Mô tả
                  </label>
                  <p className="mt-1 text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700">
                    {task.taskDescription || "Không có mô tả"}
                  </p>
                </div>

                {/* Assignee with Change button */}
                {task.assigneeName && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Người được giao
                    </label>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {getFirstLetterUppercase(task.assigneeName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs">{task.assigneeName}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleChangeAssignee}
                        className="h-6 px-2 text-xs"
                      >
                        <UserCheck className="h-3 w-3 mr-1" />
                        Đổi
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Details (for repair tasks) */}
            {task.taskType.toLowerCase() === "repair" &&
              repairTaskDetail?.errorDetails &&
              repairTaskDetail.errorDetails.length >= 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Wrench className="h-4 w-4 text-orange-600" />
                        Chi tiết Lỗi ({repairTaskDetail.errorDetails.length})
                      </CardTitle>
                      {repairTaskDetail.status === "Pending" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowAddErrorModal(true)}
                          className="h-6 px-2 text-xs bg-orange-500 hover:bg-orange-600"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Chẩn đoán
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {repairTaskDetail.errorDetails.length > 0 ? (
                      repairTaskDetail.errorDetails.map((error, index) => (
                        <div
                          key={error.errorId}
                          className="border border-gray-200 dark:border-gray-700 rounded p-2"
                        >
                          {/* Error header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {error.errorName}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                            </div>
                            {error.spareParts &&
                              error.spareParts.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleToggleExpandError(error.errorId)
                                  }
                                  className="h-5 w-5 p-0"
                                >
                                  {expandedErrors[error.errorId] ? (
                                    <ChevronDown className="h-3 w-3" />
                                  ) : (
                                    <ChevronRight className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                          </div>

                          {/* Expandable spare parts */}
                          {expandedErrors[error.errorId] &&
                            error.spareParts &&
                            error.spareParts.length > 0 && (
                              <div className="mt-2 pl-3 border-l-2 border-orange-300 dark:border-orange-700">
                                <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Phụ tùng cần:
                                </div>
                                {error.spareParts.map((part) => (
                                  <div
                                    key={part.sparepartId}
                                    className="flex items-center justify-between py-1 text-xs"
                                  >
                                    <div className="flex items-center gap-1">
                                      <Package className="h-3 w-3 text-orange-500" />
                                      <span>{part.sparepartName}</span>
                                    </div>
                                    <span className="font-medium">
                                      x{part.quantityNeeded}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-3">
                        <Wrench className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                        <p className="text-xs text-gray-500">
                          Chưa có lỗi nào được chẩn đoán
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

            {/* Device Information (for installation tasks) - Compact */}
            {(oldDevice || newDevice) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Monitor className="h-4 w-4 text-green-600" />
                    Thông tin Thiết bị
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {oldDevice && newDevice ? (
                    <div className="space-y-3">
                      <div className="text-center">
                        <Badge variant="outline" className="text-xs">
                          Thay thế thiết bị
                        </Badge>
                      </div>

                      {/* Old Device - Compact */}
                      <div className="p-2 border border-red-200 bg-red-50 dark:bg-red-950/30 rounded">
                        <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">
                          Thiết bị cũ (Tháo)
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Monitor className="h-3 w-3 text-red-600" />
                          <span className="font-medium text-xs">
                            {oldDevice.deviceName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {oldDevice.deviceCode}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <ArrowRight className="h-3 w-3 text-gray-400" />
                      </div>

                      {/* New Device - Compact */}
                      <div className="p-2 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded">
                        <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                          Thiết bị mới (Lắp)
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          <Monitor className="h-3 w-3 text-green-600" />
                          <span className="font-medium text-xs">
                            {newDevice.deviceName}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {newDevice.deviceCode}
                        </div>
                      </div>
                    </div>
                  ) : oldDevice ? (
                    <div className="p-2 border border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                        Thiết bị
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Monitor className="h-3 w-3 text-blue-600" />
                        <span className="font-medium text-xs">
                          {oldDevice.deviceName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {oldDevice.deviceCode}
                      </div>
                    </div>
                  ) : newDevice ? (
                    <div className="p-2 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded">
                      <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-1">
                        Thiết bị mới
                      </div>
                      <div className="flex items-center gap-1 mb-1">
                        <Monitor className="h-3 w-3 text-green-600" />
                        <span className="font-medium text-xs">
                          {newDevice.deviceName}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {newDevice.deviceCode}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <Monitor className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">
                        Thông tin thiết bị không khả dụng
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline Information - Compact */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Thời gian thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {task.startTime && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-green-500" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Bắt đầu
                      </label>
                      <p className="text-xs">
                        {formatAPIDateToHoChiMinh(task.startTime, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {task.expectedTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-blue-500" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Dự kiến hoàn thành
                      </label>
                      <p className="text-xs">
                        {formatAPIDateToHoChiMinh(
                          task.expectedTime,
                          "datetime"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {task.endTime && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Hoàn thành
                      </label>
                      <p className="text-xs">
                        {formatAPIDateToHoChiMinh(task.endTime, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {warrantyTaskDetail?.actualReturnDate && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-blue-500" />
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Ngày trả thực tế
                      </label>
                      <p className="text-xs">
                        {formatAPIDateToHoChiMinh(
                          warrantyTaskDetail.actualReturnDate,
                          "datetime"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {!task.startTime && !task.expectedTime && !task.endTime && (
                  <div className="text-center py-3">
                    <Timer className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-xs text-gray-500">
                      Chưa có thông tin thời gian
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status-specific Information */}
            {task.status.toLowerCase() === "suggested" && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1 text-sm">
                        Nhiệm vụ đề xuất
                      </h4>
                      <p className="text-xs text-purple-600 dark:text-purple-300">
                        Nhiệm vụ này được đề xuất tự động và chưa được áp dụng.
                        Bạn có thể áp dụng nó để chuyển trạng thái thành
                        &quot;Đang chờ&quot;.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* AddErrorToTaskModal */}
      <AddErrorToTaskModal
        open={showAddErrorModal}
        onOpenChange={setShowAddErrorModal}
        taskId={task?.taskId || ""}
        listError={repairTaskDetail?.errorDetails || []}
        onErrorsAdded={() => {
          setShowAddErrorModal(false);
          if (task?.taskId && onRefreshTaskDetail) {
            onRefreshTaskDetail(task.taskId); // This triggers the parent refresh
          }
        }}
      />
    </>
  );
};

export default TaskDetailSidePanel;
