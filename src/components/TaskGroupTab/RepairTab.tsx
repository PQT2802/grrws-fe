"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Loader2, Package, Plus, Trash2 } from "lucide-react";
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
  onErrorsAdded?: () => void; // Add this prop
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

  // Define colors for timelines and spare parts borders based on error index
  const groupColors = [
    "border-green-500 bg-green-50 dark:bg-green-950/30",
    "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  ];
  const iconColors = ["text-green-500", "text-blue-500"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </div>
          <div className="mt-2 flex justify-end gap-2">
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
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top Section - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
                  <span className="text-xs text-gray-500">Đã ký xác nhận:</span>
                  <Badge
                    variant={
                      repairTaskDetail.isSigned ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {repairTaskDetail.isSigned ? "Đã ký" : "Chưa ký"}
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

          {/* Nested Tabs for detailed information */}
          <Tabs defaultValue="errors" className="mt-2">
            <TabsList className="w-full grid grid-cols-2 mb-3">
              <TabsTrigger value="errors">
                Sự cố ({repairTaskDetail.errorDetails?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="spareparts">Linh kiện</TabsTrigger>
            </TabsList>

            {/* Errors Tab with expandable spare parts */}
            <TabsContent value="errors">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[300px] overflow-auto">
                {repairTaskDetail.errorDetails &&
                repairTaskDetail.errorDetails.length > 0 ? (
                  <div className="space-y-3">
                    {repairTaskDetail.errorDetails.map((error, index) => (
                      <div
                        key={error.errorId}
                        className="border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0"
                      >
                        {/* Make the entire error row clickable */}
                        <div
                          className="flex items-start justify-between cursor-pointer group"
                          onClick={() => handleToggleExpandError(error.errorId)}
                          tabIndex={0}
                          role="button"
                          aria-expanded={!!expandedErrors[error.errorId]}
                        >
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:underline">
                              {error.errorName}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {error.spareParts &&
                              error.spareParts.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  {expandedErrors[error.errorId]
                                    ? "Thu nhỏ"
                                    : "Mở rộng"}
                                </span>
                              )}
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                setErrorToDelete(error.errorId);
                                setShowDeleteDialog(true);
                              }}
                              aria-label="Xóa lỗi"
                              disabled={deleting}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Expandable spare parts section */}
                        {expandedErrors[error.errorId] &&
                          error.spareParts &&
                          error.spareParts.length > 0 && (
                            <div
                              className={`mt-2 border-l-4 ${
                                groupColors[index % groupColors.length]
                              } rounded-md p-3`}
                            >
                              <div className="font-semibold text-xs mb-2 text-gray-700 dark:text-gray-300">
                                Các linh kiện cần:
                              </div>
                              {error.spareParts.map((sparePart) => (
                                <div
                                  key={sparePart.sparepartId}
                                  className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                >
                                  <div className="flex items-center gap-2">
                                    <Package
                                      className={`h-4 w-4 ${
                                        iconColors[index % iconColors.length]
                                      }`}
                                    />
                                    <div>
                                      <div className="text-sm font-medium">
                                        {sparePart.sparepartName}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        Số lượng: {sparePart.quantityNeeded}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Không có thông tin lỗi
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Spare Parts Tab - flat list of all spare parts */}
            <TabsContent value="spareparts">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[300px] overflow-auto">
                {repairTaskDetail.errorDetails &&
                repairTaskDetail.errorDetails.some(
                  (error) => error.spareParts && error.spareParts.length > 0
                ) ? (
                  <div className="flex flex-col gap-4">
                    {repairTaskDetail.errorDetails
                      .flatMap((error, errorIndex) =>
                        (error.spareParts || []).map((sparePart) => ({
                          ...sparePart,
                          errorName: error.errorName,
                          errorIndex,
                        }))
                      )
                      .map((sparePart, idx) => (
                        <div
                          key={sparePart.sparepartId + "-" + idx}
                          className={`border-l-4 ${
                            groupColors[
                              sparePart.errorIndex % groupColors.length
                            ]
                          } rounded-md p-3 flex items-center justify-between`}
                        >
                          <div className="flex items-center gap-2">
                            <Package
                              className={`h-4 w-4 ${
                                iconColors[
                                  sparePart.errorIndex % iconColors.length
                                ]
                              }`}
                            />
                            <div>
                              <div className="text-sm font-medium">
                                {sparePart.sparepartName}
                              </div>
                              <div className="text-xs text-gray-500">
                                Số lượng: {sparePart.quantityNeeded}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Không có thông tin linh kiện cho các lỗi này
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      {/* AddErrorToTaskModal */}
      <AddErrorToTaskModal
        open={showAddErrorModal}
        onOpenChange={setShowAddErrorModal}
        taskId={repairTask?.taskId || ""}
        listError={repairTaskDetail?.errorDetails || []}
        onErrorsAdded={() => {
          setRefreshFlag((prev) => prev + 1);
          setShowAddErrorModal(false);
          // Call the parent's callback to refresh the repair task details
          onErrorsAdded?.();
        }}
      />
      {/* Delete single error confirmation dialog */}
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
      {/* Delete all errors confirmation dialog */}
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
