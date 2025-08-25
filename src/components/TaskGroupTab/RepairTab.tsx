import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wrench,
  Loader2,
  Package,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  User,
  Flag,
} from "lucide-react";
import { REPAIR_TASK_DETAIL, TASK_IN_GROUP } from "@/types/task.type";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddErrorToTaskModal from "@/components/ErrorTableCpn/AddErrorToTaskModal";
import { apiClient } from "@/lib/api-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";

interface RepairTabProps {
  repairTask: TASK_IN_GROUP | null;
  repairTaskDetail: REPAIR_TASK_DETAIL | null;
  onErrorsAdded?: () => void;
}

const RepairTab = ({
  repairTask,
  repairTaskDetail,
  onErrorsAdded,
}: RepairTabProps) => {
  // State for AddErrorToTaskModal
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>(
    {}
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [errorToDelete, setErrorToDelete] = useState<string | null>(null);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!repairTask) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-center">
            <div className="flex flex-col items-center max-w-md">
              <Wrench className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Không có thông tin sửa chữa
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhóm nhiệm vụ này không chứa nhiệm vụ sửa chữa nào.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!repairTaskDetail) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">
              Đang tải thông tin sửa chữa...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Toggle expand/collapse for error spare parts
  const handleToggleExpandError = (errorId: string) => {
    setExpandedErrors((prev) => ({
      ...prev,
      [errorId]: !prev[errorId],
    }));
  };

  // Delete a single error
  const handleDeleteError = async () => {
    if (!errorToDelete || !repairTask?.taskId) return;
    setDeleting(true);
    try {
      await apiClient.error.addTaskErrors({
        TaskId: repairTask.taskId,
        ErrorIds: [errorToDelete],
        Action: "Remove",
      });
      setShowDeleteDialog(false);
      setErrorToDelete(null);
      setRefreshFlag((prev) => prev + 1);
      onErrorsAdded?.();
    } catch (error) {
      // Optionally show error toast
    } finally {
      setDeleting(false);
    }
  };

  // Delete all errors
  const handleDeleteAllErrors = async () => {
    if (!repairTask?.taskId || !repairTaskDetail?.errorDetails?.length) return;
    setDeleting(true);
    try {
      await apiClient.error.addTaskErrors({
        TaskId: repairTask.taskId,
        ErrorIds: repairTaskDetail.errorDetails.map((err) => err.errorId),
        Action: "Remove",
      });
      setShowDeleteAllDialog(false);
      setRefreshFlag((prev) => prev + 1);
      onErrorsAdded?.();
    } catch (error) {
      // Optionally show error toast
    } finally {
      setDeleting(false);
    }
  };

  // Calculate metrics for summary - Updated to include all errors but filter for metrics
  const allErrors = repairTaskDetail.errorDetails || [];
  const activeErrors = allErrors.filter((error) => !error.isDeleted);
  const fixedErrorsCount = activeErrors.filter((error) => error.isFixed).length;
  const totalActiveErrors = activeErrors.length;
  const totalSparePartsUsed = activeErrors
    .filter((error) => error.isFixed)
    .reduce((acc, error) => acc + (error.spareParts?.length || 0), 0);

  // Calculate errors fixed today (August 22, 2025) - only active errors
  const today = new Date("2025-08-22").toDateString();
  const errorsFixedToday = activeErrors.filter((error) => {
    if (!error.isFixed || !error.completedDate) return false;
    return new Date(error.completedDate).toDateString() === today;
  }).length;

  // Helper functions for formatting
  const formatExpectedTime = (expectedTime: string | null) => {
    if (!expectedTime) return "Chưa xác định";
    try {
      return new Date(expectedTime).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Chưa xác định";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "1":
      case "High":
        return "Ưu tiên cao";
      case "2":
      case "Medium":
        return "Thường";
      case "3":
      case "Low":
        return "Thấp";
      default:
        return priority || "Chưa xác định";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "1":
      case "High":
        return "text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800";
      case "2":
      case "Medium":
        return "text-yellow-700 bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800";
      case "3":
      case "Low":
        return "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-700 bg-green-50 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800";
      case "in progress":
      case "inprogress":
        return "text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800";
      case "pending":
        return "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-800";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:text-gray-400 dark:border-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "Hoàn thành";
      case "in progress":
      case "inprogress":
        return "Đang thực hiện";
      case "pending":
        return "Chờ xử lý";
      default:
        return status || "Chưa xác định";
    }
  };

  // Define colors for timelines and spare parts borders based on error index
  const groupColors = ["border-blue-500 bg-blue-50 dark:bg-blue-950/30"];
  const iconColors = ["text-green-500", "text-blue-500"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </div>
          <div className="flex gap-2">
            {repairTask.status === "Pending" && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={
                  !repairTaskDetail?.errorDetails?.length ||
                  deleting ||
                  !repairTask?.taskId
                }
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Xóa tất cả lỗi
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowAddErrorModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
              disabled={!repairTask?.taskId}
            >
              <Plus className="h-4 w-4 mr-2" />
              Chẩn đoán lỗi
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Compact Summary Section - Only show for incomplete tasks */}
          {repairTaskDetail.status !== "Completed" && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between gap-4">
                {/* Today's Progress */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Hôm nay đã sửa
                    </div>
                    <div className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                      {errorsFixedToday} lỗi
                    </div>
                  </div>
                </div>

                {/* Total Fixed Errors */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tổng lỗi đã sửa
                    </div>
                    <div className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {fixedErrorsCount}/{totalActiveErrors} lỗi
                      {fixedErrorsCount === totalActiveErrors &&
                        totalActiveErrors > 0 && (
                          <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs ml-2">
                            Hoàn thành
                          </Badge>
                        )}
                    </div>
                  </div>
                </div>

                {/* Total Spare Parts */}
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                    <Package className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tổng linh kiện
                    </div>
                    <div className="text-sm font-semibold text-orange-700 dark:text-orange-300">
                      {totalSparePartsUsed} linh kiện
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Top Section - Enhanced Task Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Task Information with Status */}
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800 p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                {repairTaskDetail.taskName}
              </div>
              <div className="font-bold text-lg text-orange-900 dark:text-orange-100">
                Nhiệm vụ sửa chữa
              </div>
              <div className="mt-2">
                <Badge
                  className={`text-xs ${getStatusColor(
                    repairTaskDetail.status
                  )}`}
                >
                  {getStatusLabel(repairTaskDetail.status)}
                </Badge>
              </div>
            </div>

            {/* Installation Status */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">Trạng thái</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Đã tháo dỡ:</span>
                  <Badge
                    variant={
                      repairTaskDetail.isUninstall ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {repairTaskDetail.isUninstall ? "Đã tháo" : "Chưa tháo"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Đã lắp đặt:</span>
                  <Badge
                    variant={
                      repairTaskDetail.isInstall ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {repairTaskDetail.isInstall ? "Đã lắp" : "Chưa lắp"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Task Details */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">Chi tiết nhiệm vụ</div>
              <div className="space-y-5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-500">Dự kiến hoàn thành:</span>
                  </div>{" "}
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 ml-4">
                    {formatExpectedTime(repairTaskDetail.expectedTime)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-gray-500" />
                    <span className="text-gray-500">Thợ sửa chữa:</span>
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-gray-100 ml-4">
                    {repairTaskDetail.assigneeName || "Chưa phân công"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="errors" className="mt-4">
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="errors" className="text-sm">
              Sự cố ({allErrors.length})
            </TabsTrigger>
            <TabsTrigger value="spareparts" className="text-sm">
              Linh kiện
            </TabsTrigger>
          </TabsList>

          {/* Errors Tab - Show all errors including deleted ones with strikethrough */}
          <TabsContent value="errors" className="mt-0">
            {allErrors.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                {allErrors.map((error, index) => (
                  <div
                    key={error.errorId}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                      error.isDeleted
                        ? "opacity-60 bg-gray-100/50 dark:bg-gray-900/30"
                        : error.isFixed
                        ? "bg-green-50/60 dark:bg-green-950/20"
                        : ""
                    }`}
                  >
                    <div
                      className="flex items-start justify-between cursor-pointer group p-3"
                      onClick={() => handleToggleExpandError(error.errorId)}
                      tabIndex={0}
                      role="button"
                      aria-expanded={!!expandedErrors[error.errorId]}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <Badge
                          variant="outline"
                          className={`text-xs py-0 px-1.5 ${
                            error.isDeleted
                              ? "border-gray-400 text-gray-500 line-through"
                              : error.isFixed
                              ? "border-green-500 text-green-700"
                              : ""
                          }`}
                        >
                          #{index + 1}
                        </Badge>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-sm font-medium group-hover:text-blue-600 transition-colors ${
                                error.isDeleted
                                  ? "line-through text-gray-500 dark:text-gray-400"
                                  : error.isFixed
                                  ? "text-green-700 dark:text-green-400"
                                  : "text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {error.errorName}
                            </h4>
                            {error.isDeleted && (
                              <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs py-0 px-1.5">
                                Đã xóa
                              </Badge>
                            )}
                            {error.isFixed && !error.isDeleted && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">
                                  Đã sửa
                                </span>
                                <span className="text-xs text-green-600">
                                  {formatAPIDateToHoChiMinh(
                                    error.completedDate
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {error.spareParts &&
                              error.spareParts.length > 0 && (
                                <Badge
                                  variant="secondary"
                                  className={`text-xs py-0 px-1.5 ${
                                    error.isDeleted
                                      ? "line-through opacity-70"
                                      : ""
                                  }`}
                                >
                                  {error.spareParts.length} linh kiện
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {error.spareParts &&
                          error.spareParts.length > 0 &&
                          !error.isDeleted && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {expandedErrors[error.errorId]
                                ? "Thu nhỏ"
                                : "Mở rộng"}
                            </span>
                          )}
                        {!error.isFixed &&
                          !error.isDeleted &&
                          repairTask.status === "Pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 border-red-200 hover:bg-red-50 hover:border-red-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                setErrorToDelete(error.errorId);
                                setShowDeleteDialog(true);
                              }}
                              aria-label="Xóa lỗi"
                              disabled={
                                deleting ||
                                repairTaskDetail.status === "Completed"
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                      </div>
                    </div>

                    {/* Compact expandable spare parts section */}
                    {expandedErrors[error.errorId] &&
                      error.spareParts &&
                      error.spareParts.length > 0 && (
                        <div
                          className={`mx-3 mb-3 border-l-2 rounded-r-md p-2 ${
                            error.isDeleted
                              ? "border-gray-400 bg-gray-100/50 dark:bg-gray-900/30 opacity-60"
                              : error.isFixed
                              ? "border-green-500 bg-green-50/60 dark:bg-green-950/20"
                              : groupColors[index % groupColors.length]
                          }`}
                        >
                          <h5
                            className={`text-xs font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-1 ${
                              error.isDeleted ? "line-through" : ""
                            }`}
                          >
                            <Package
                              className={`h-3.5 w-3.5 ${
                                error.isDeleted
                                  ? "text-gray-500"
                                  : error.isFixed
                                  ? "text-green-600"
                                  : iconColors[index % iconColors.length]
                              }`}
                            />
                            Linh kiện ({error.spareParts.length})
                          </h5>
                          <div className="grid gap-2">
                            {error.spareParts.map((sparePart) => (
                              <div
                                key={sparePart.sparepartId}
                                className="bg-white/80 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 rounded-md p-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <div
                                        className={`text-xs font-medium text-gray-900 dark:text-gray-100 ${
                                          error.isDeleted ? "line-through" : ""
                                        }`}
                                      >
                                        {sparePart.sparepartName}
                                      </div>
                                    </div>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      error.isDeleted
                                        ? "line-through opacity-70"
                                        : ""
                                    }`}
                                  >
                                    SL: {sparePart.quantityNeeded}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-gray-200 dark:border-gray-700 rounded-md">
                <AlertTriangle className="h-10 w-10 text-gray-400 mb-2" />
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Không có thông tin lỗi
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chưa có lỗi nào được ghi nhận cho nhiệm vụ sửa chữa này.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Spare Parts Tab - Only show active errors' spare parts */}
          <TabsContent value="spareparts" className="mt-0">
            {allErrors.some(
              (error) => error.spareParts && error.spareParts.length > 0
            ) ? (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                  <Package className="h-4 w-4 text-blue-600" />
                  Tất cả linh kiện cần thiết
                </h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {allErrors
                    .flatMap((error, errorIndex) =>
                      (error.spareParts || []).map((sparePart) => ({
                        ...sparePart,
                        errorName: error.errorName,
                        errorIndex,
                        isErrorFixed: error.isFixed,
                        isErrorDeleted: error.isDeleted,
                      }))
                    )
                    .map((sparePart, idx) => (
                      <div
                        key={sparePart.sparepartId + "-" + idx}
                        className={`border-l-2 rounded-md p-2 ${
                          sparePart.isErrorDeleted
                            ? "border-gray-400 bg-gray-100/50 dark:bg-gray-900/30 opacity-60"
                            : sparePart.isErrorFixed
                            ? "border-green-500 bg-green-50/60 dark:bg-green-950/20"
                            : groupColors[
                                sparePart.errorIndex % groupColors.length
                              ]
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Package
                              className={`h-4 w-4 ${
                                sparePart.isErrorDeleted
                                  ? "text-gray-500"
                                  : sparePart.isErrorFixed
                                  ? "text-green-600"
                                  : iconColors[
                                      sparePart.errorIndex % iconColors.length
                                    ]
                              }`}
                            />
                            <div>
                              <div className="flex gap-5 items-center">
                                <div
                                  className={`text-sm font-medium ${
                                    sparePart.isErrorDeleted
                                      ? "line-through text-gray-500 dark:text-gray-400"
                                      : sparePart.isErrorFixed
                                      ? "text-green-700 dark:text-green-400"
                                      : ""
                                  }`}
                                >
                                  {sparePart.sparepartName}
                                </div>
                                {sparePart.isErrorDeleted && (
                                  <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs py-0 px-1.5">
                                    Đã xóa
                                  </Badge>
                                )}
                                {sparePart.isErrorFixed &&
                                  !sparePart.isErrorDeleted && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                                      <span className="text-xs text-green-600">
                                        Đã sửa xong
                                      </span>
                                    </div>
                                  )}
                              </div>
                              <div
                                className={`text-xs text-gray-600 dark:text-gray-400 ${
                                  sparePart.isErrorDeleted ? "line-through" : ""
                                }`}
                              >
                                Từ lỗi: {sparePart.errorName}
                              </div>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              sparePart.isErrorDeleted
                                ? "line-through opacity-70"
                                : sparePart.isErrorFixed
                                ? "border-green-500 text-green-700"
                                : ""
                            }`}
                          >
                            SL: {sparePart.quantityNeeded}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center border border-gray-200 dark:border-gray-700 rounded-md">
                <Package className="h-10 w-10 text-gray-400 mb-2" />
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                  Không có thông tin linh kiện
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Không có linh kiện nào được yêu cầu cho các lỗi hiện tại.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Modals */}
      <AddErrorToTaskModal
        open={showAddErrorModal}
        onOpenChange={setShowAddErrorModal}
        taskId={repairTask?.taskId || ""}
        listError={repairTaskDetail?.errorDetails || []}
        onErrorsAdded={() => {
          setRefreshFlag((prev) => prev + 1);
          setShowAddErrorModal(false);
          onErrorsAdded?.();
        }}
      />

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa lỗi</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Bạn có chắc chắn muốn xóa lỗi này khỏi nhiệm vụ sửa chữa?
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteError}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa tất cả lỗi</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            Bạn có chắc chắn muốn xóa tất cả lỗi khỏi nhiệm vụ sửa chữa?
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllErrors}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Xóa tất cả
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RepairTab;
