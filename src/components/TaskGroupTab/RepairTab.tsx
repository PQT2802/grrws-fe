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

  // Calculate fixed errors count
  const fixedErrorsCount = repairTaskDetail.errorDetails?.filter(
    (error) => error.isFixed && !error.isDeleted
  ).length;

  // Define colors for timelines and spare parts borders based on error index
  const groupColors = [
    "border-green-500 bg-green-50 dark:bg-green-950/30",
    "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  ];
  const iconColors = ["text-green-500", "text-blue-500"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </div>
          {repairTask.status === "Pending" && (
            <div className="flex gap-2">
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
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top Section - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800 p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                {repairTaskDetail.taskName}
              </div>
              <div className="font-bold text-lg text-orange-900 dark:text-orange-100">
                Nhiệm vụ sửa chữa
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400">
                ID: {repairTaskDetail.taskId}
              </div>
            </div>
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
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">Tổng quan</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Số lỗi:</span>
                  <span className="font-medium">
                    {repairTaskDetail.errorDetails?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Lỗi đã sửa:</span>
                  <span className="font-medium text-green-600">
                    {fixedErrorsCount || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Linh kiện:</span>
                  <span className="font-medium">
                    {repairTaskDetail.errorDetails?.reduce(
                      (acc, error) => acc + (error.spareParts?.length || 0),
                      0
                    ) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="errors" className="mt-4">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="errors" className="text-sm">
                Sự cố ({repairTaskDetail.errorDetails?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="spareparts" className="text-sm">
                Linh kiện
              </TabsTrigger>
            </TabsList>

            {/* Errors Tab - More Compact */}
            <TabsContent value="errors" className="mt-0">
              {repairTaskDetail.errorDetails &&
              repairTaskDetail.errorDetails.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                  {repairTaskDetail.errorDetails.map((error, index) => (
                    <div
                      key={error.errorId}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        error.isFixed && !error.isDeleted ? "bg-green-50/60 dark:bg-green-950/20" : ""
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
                              error.isFixed && !error.isDeleted ? "border-green-500 text-green-700" : ""
                            }`}
                          >
                            #{index + 1}
                          </Badge>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4
                                className={`text-sm font-medium ${
                                  error.isDeleted
                                    ? "line-through opacity-60 text-gray-500"
                                    : error.isFixed
                                    ? "text-green-700 dark:text-green-400"
                                    : "text-gray-900 dark:text-gray-100"
                                } group-hover:text-blue-600 transition-colors`}
                              >
                                {error.errorName}
                              </h4>
                              {error.isDeleted && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <AlertTriangle className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600">
                                    Lỗi đã bị xóa
                                  </span>
                                </div>
                              )}
                              {error.isFixed && !error.isDeleted && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-600">
                                    Đã sửa
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {error.spareParts &&
                                error.spareParts.length > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs py-0 px-1.5"
                                  >
                                    {error.spareParts.length} linh kiện
                                  </Badge>
                                )}
                              {error.isFixed && !error.isDeleted && (
                                <Badge 
                                  className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 text-xs py-0 px-1.5"
                                >
                                  Hoàn tất
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {error.spareParts && error.spareParts.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {expandedErrors[error.errorId]
                                ? "Thu nhỏ"
                                : "Mở rộng"}
                            </span>
                          )}
                          {!error.isDeleted && !error.isFixed && (
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
                              error.isFixed 
                                ? "border-green-500 bg-green-50/60 dark:bg-green-950/20" 
                                : groupColors[index % groupColors.length]
                            }`}
                          >
                            <h5 className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              <Package
                                className={`h-3.5 w-3.5 ${
                                  error.isFixed 
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
                                        <div className="text-xs font-medium text-gray-900 dark:text-gray-100">
                                          {sparePart.sparepartName}
                                        </div>
                                      </div>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
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

            {/* Spare Parts Tab - More Compact */}
            <TabsContent value="spareparts" className="mt-0">
              {repairTaskDetail.errorDetails &&
              repairTaskDetail.errorDetails.some(
                (error) => error.spareParts && error.spareParts.length > 0
              ) ? (
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
                    <Package className="h-4 w-4 text-blue-600" />
                    Tất cả linh kiện cần thiết
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    {repairTaskDetail.errorDetails
                      .flatMap((error, errorIndex) =>
                        (error.spareParts || []).map((sparePart) => ({
                          ...sparePart,
                          errorName: error.errorName,
                          errorIndex,
                          isErrorDeleted: error.isDeleted,
                          isErrorFixed: error.isFixed,
                        }))
                      )
                      .map((sparePart, idx) => (
                        <div
                          key={sparePart.sparepartId + "-" + idx}
                          className={`border-l-2 rounded-md p-2 ${
                            sparePart.isErrorFixed && !sparePart.isErrorDeleted
                              ? "border-green-500 bg-green-50/60 dark:bg-green-950/20"
                              : groupColors[sparePart.errorIndex % groupColors.length]
                          } ${sparePart.isErrorDeleted ? "opacity-60" : ""}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Package
                                className={`h-4 w-4 ${
                                  sparePart.isErrorFixed && !sparePart.isErrorDeleted
                                    ? "text-green-600"
                                    : iconColors[sparePart.errorIndex % iconColors.length]
                                }`}
                              />
                              <div>
                                <div className="flex gap-5">
                                  <div
                                    className={`text-sm font-medium ${
                                      sparePart.isErrorDeleted
                                        ? "line-through text-gray-500"
                                        : sparePart.isErrorFixed
                                        ? "text-green-700 dark:text-green-400"
                                        : ""
                                    }`}
                                  >
                                    {sparePart.sparepartName}
                                  </div>
                                  {sparePart.isErrorDeleted && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                      <span className="text-xs text-red-600">
                                        Lỗi đã bị xóa
                                      </span>
                                    </div>
                                  )}
                                  {sparePart.isErrorFixed && !sparePart.isErrorDeleted && (
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
                                    sparePart.isErrorDeleted
                                      ? "line-through"
                                      : ""
                                  }`}
                                >
                                  Từ lỗi: {sparePart.errorName}
                                </div>
                              </div>
                            </div>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                sparePart.isErrorFixed && !sparePart.isErrorDeleted 
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
        </div>
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