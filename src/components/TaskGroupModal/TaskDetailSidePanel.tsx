"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  formatAPIDateToHoChiMinh,
  getFirstLetterUppercase,
} from "@/lib/utils";
import { 
  TASK_IN_GROUP, 
  WARRANTY_TASK_DETAIL, 
  INSTALL_TASK_DETAIL,
  DOCUMENT 
} from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import {
  X,
  Clock,
  Calendar,
  User,
  AlertCircle,
  Package,
  Shield,
  CheckCircle,
  FileText,
  Timer,
  Monitor,
  ArrowRight,
  Phone,
  MapPin,
  DollarSign,
  FileImage,
  FileIcon,
  Eye,
  ExternalLink,
  Download,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  translateTaskPriority,
  translateTaskStatus,
  translateTaskType,
} from "@/utils/textTypeTask";
import { getPriorityColor, getStatusColor } from "@/utils/colorUtils";

interface TaskDetailSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  task: TASK_IN_GROUP | null;
  taskDetail: WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | null;
  oldDevice?: DEVICE_WEB | null;
  newDevice?: DEVICE_WEB | null;
}

const TaskDetailSidePanel = ({
  isOpen,
  onClose,
  task,
  taskDetail,
  oldDevice,
  newDevice,
}: TaskDetailSidePanelProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

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
        return <Package className="h-5 w-5 text-red-500" />;
      case "installation":
        return <Package className="h-5 w-5 text-green-500" />;
      case "repair":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "warrantysubmission":
      case "warrantyreturn":
      case "warranty":
        return <Shield className="h-5 w-5 text-blue-500" />;
      case "storagereturn":
      case "stockreturn":
        return <Package className="h-5 w-5 text-cyan-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get file icon based on document type or URL
  const getFileIcon = (document: DOCUMENT) => {
    const type = document.docymentType?.toLowerCase() || "";
    const url = document.documentUrl?.toLowerCase() || "";

    if (type.includes("pdf") || url.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (
      type.includes("image") ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/)
    ) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (type.includes("warranty") || type.includes("claim")) {
      return <Shield className="h-5 w-5 text-indigo-500" />;
    } else if (type.includes("report")) {
      return <FileText className="h-5 w-5 text-green-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle document view/download
  const handleViewDocument = (document: DOCUMENT) => {
    window.open(document.documentUrl, "_blank");
  };

  const warrantyTaskDetail = taskDetail as WARRANTY_TASK_DETAIL;
  const installTaskDetail = taskDetail as INSTALL_TASK_DETAIL;

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0  bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-2/5  lg:w-1/3 xl:w-1/4 bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
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
          <div className="flex-1 p-4 pb-20 space-y-4">
            {/* Task Header */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xl font-bold">{task.taskName}</h3>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">#{task.orderIndex}</Badge>
                <Badge className={getStatusColor(task.status)}>
                  {translateTaskStatus(task.status)}
                </Badge>
                <Badge className={getPriorityColor(task.priority)}>
                  {translateTaskPriority(task.priority)}
                </Badge>
                {task.status.toLowerCase() === "suggested" && (
                  <Badge
                    variant="outline"
                    className="text-purple-600 border-purple-300"
                  >
                    Đề xuất mới
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            {/* Basic Task Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Thông tin Cơ bản
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Mô tả
                  </label>
                  <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                    {task.taskDescription || "Không có mô tả"}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Loại nhiệm vụ
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      {getTaskTypeIcon(task.taskType)}
                      <span className="text-sm font-medium">{translateTaskType(task.taskType)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Thứ tự thực hiện
                    </label>
                    <p className="mt-1 text-sm font-medium">#{task.orderIndex}</p>
                  </div>
                </div>

                {task.assigneeName && (
                  <div className="flex items-center gap-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Người được giao
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary text-white text-xs">
                            {getFirstLetterUppercase(task.assigneeName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assigneeName}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warranty Information (for warranty tasks) */}
            {warrantyTaskDetail && warrantyTaskDetail.claimNumber && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-blue-600" />
                    Thông tin Bảo hành
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-col gap-3 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-800">
                    <div>
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {warrantyTaskDetail.warrantyProvider}
                      </div>
                      <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                        {warrantyTaskDetail.claimNumber}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        Mã bảo hành: {warrantyTaskDetail.warrantyCode}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Trạng thái claim
                      </label>
                      <div className="mt-1">
                        <Badge variant="outline">
                          {warrantyTaskDetail.claimStatus}
                        </Badge>
                      </div>
                    </div>

                    {warrantyTaskDetail.contractNumber && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Số hợp đồng
                        </label>
                        <p className="mt-1 text-sm font-medium">
                          {warrantyTaskDetail.contractNumber}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Mô tả sự cố
                    </label>
                    <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                      {warrantyTaskDetail.issueDescription}
                    </p>
                  </div>

                  {warrantyTaskDetail.hotNumber && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Hotline kỹ thuật
                        </label>
                        <p className="text-sm">
                          <a
                            href={`tel:${warrantyTaskDetail.hotNumber}`}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {warrantyTaskDetail.hotNumber}
                          </a>
                        </p>
                      </div>
                    </div>
                  )}

                  {warrantyTaskDetail.location && (
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Vị trí dịch vụ
                        </label>
                        <p className="text-sm">{warrantyTaskDetail.location}</p>
                      </div>
                    </div>
                  )}

                  {warrantyTaskDetail.claimAmount && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Số tiền claim
                        </label>
                        <p className="text-sm font-medium">
                          ${warrantyTaskDetail.claimAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Device Information (for installation tasks) */}
            {(oldDevice || newDevice) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Monitor className="h-4 w-4 text-green-600" />
                    Thông tin Thiết bị
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {oldDevice && newDevice ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-3">
                          Thay thế thiết bị
                        </Badge>
                      </div>

                      {/* Old Device */}
                      <div className="p-3 border border-red-200 bg-red-50 dark:bg-red-950/30 rounded-md">
                        <div className="text-xs font-medium text-red-700 dark:text-red-300 mb-2">
                          Thiết bị cũ (Tháo)
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="h-4 w-4 text-red-600" />
                          <span className="font-medium text-sm">{oldDevice.deviceName}</span>
                        </div>
                        <div className="text-xs text-gray-600">{oldDevice.deviceCode}</div>
                      </div>

                      {/* Arrow */}
                      <div className="flex justify-center">
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* New Device */}
                      <div className="p-3 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-md">
                        <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                          Thiết bị mới (Lắp)
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-sm">{newDevice.deviceName}</span>
                        </div>
                        <div className="text-xs text-gray-600">{newDevice.deviceCode}</div>
                      </div>
                    </div>
                  ) : oldDevice ? (
                    <div className="p-3 border border-blue-200 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                      <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                        Thiết bị
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-sm">{oldDevice.deviceName}</span>
                      </div>
                      <div className="text-xs text-gray-600">{oldDevice.deviceCode}</div>
                    </div>
                  ) : newDevice ? (
                    <div className="p-3 border border-green-200 bg-green-50 dark:bg-green-950/30 rounded-md">
                      <div className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                        Thiết bị mới
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-sm">{newDevice.deviceName}</span>
                      </div>
                      <div className="text-xs text-gray-600">{newDevice.deviceCode}</div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Monitor className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Thông tin thiết bị không khả dụng
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Documents Section (for warranty tasks) */}
            {warrantyTaskDetail && warrantyTaskDetail.documents && warrantyTaskDetail.documents.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Tài liệu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {warrantyTaskDetail.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc)}
                          <div>
                            <div className="text-sm font-medium">
                              {doc.docymentType || "Document"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {doc.documentUrl ? "Có sẵn" : "Không có URL"}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                  disabled={!doc.documentUrl}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Xem tài liệu</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDocument(doc)}
                                  disabled={!doc.documentUrl}
                                  className="h-8 w-8 p-0"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mở trong tab mới</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  Thời gian thực hiện
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {task.startTime && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Thời gian bắt đầu
                      </label>
                      <p className="text-sm">
                        {formatAPIDateToHoChiMinh(task.startTime, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {task.expectedTime && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Thời gian dự kiến hoàn thành
                      </label>
                      <p className="text-sm">
                        {formatAPIDateToHoChiMinh(task.expectedTime, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {task.endTime && (
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Thời gian hoàn thành
                      </label>
                      <p className="text-sm">
                        {formatAPIDateToHoChiMinh(task.endTime, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {warrantyTaskDetail?.actualReturnDate && (
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-blue-500 mt-1" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ngày trả thực tế
                      </label>
                      <p className="text-sm">
                        {formatAPIDateToHoChiMinh(warrantyTaskDetail.actualReturnDate, "datetime")}
                      </p>
                    </div>
                  </div>
                )}

                {!task.startTime && !task.expectedTime && !task.endTime && (
                  <div className="text-center py-4">
                    <Timer className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Chưa có thông tin thời gian
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status-specific Information */}
            {task.status.toLowerCase() === "suggested" && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-1">
                        Nhiệm vụ đề xuất
                      </h4>
                      <p className="text-sm text-purple-600 dark:text-purple-300">
                        Nhiệm vụ này được đề xuất tự động và chưa được áp dụng. 
                        Bạn có thể áp dụng nó để chuyển trạng thái thành "Đang chờ".
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional warranty information */}
            {warrantyTaskDetail && warrantyTaskDetail.resolution && warrantyTaskDetail.warrantyNotes&& (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-4 w-4 text-indigo-600" />
                    Thông tin bổ sung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {warrantyTaskDetail.resolution && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Giải pháp
                      </label>
                      <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                        {warrantyTaskDetail.resolution}
                      </p>
                    </div>
                  )}

                  {warrantyTaskDetail.warrantyNotes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Ghi chú
                      </label>
                      <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                        {warrantyTaskDetail.warrantyNotes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TaskDetailSidePanel;