"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  AlertCircle,
  FileText,
  AlertTriangle,
  Bug,
  Wrench,
  Loader2,
  Eye,
} from "lucide-react";
import Image from "next/image";
import { REQUEST_WITH_REPORT } from "@/types/dashboard.type";
import {
  ERROR_FOR_REQUEST_DETAIL_WEB,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";
import {
  translateTaskStatus,
  translateTaskPriority,
} from "@/utils/textTypeTask";

interface RequestDetailModalProps {
  request: REQUEST_WITH_REPORT | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailModal({
  request,
  isOpen,
  onClose,
}: RequestDetailModalProps) {
  const [errors, setErrors] = useState<ERROR_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [technicalIssues, setTechnicalIssues] = useState<
    TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isLoadingTechnicalIssues, setIsLoadingTechnicalIssues] =
    useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const hasReport = request?.reportId && request.reportId !== "no-report";

  useEffect(() => {
    if (isOpen && hasReport && request?.id) {
      fetchErrorsAndTechnicalIssues(request.id);
    }

    // Clear data when modal closes or request changes
    if (!isOpen || !hasReport) {
      setErrors([]);
      setTechnicalIssues([]);
    }
  }, [isOpen, hasReport, request?.id]);

  if (!request) return null;

  const fetchErrorsAndTechnicalIssues = async (requestId: string) => {
    try {
      // Fetch errors
      setIsLoadingErrors(true);
      const errorsResponse = await apiClient.request.getErrorOfRequest(
        requestId
      );
      console.log("Errors response:", errorsResponse);
      setErrors(errorsResponse.data || errorsResponse || []);
    } catch (error) {
      console.error("Failed to fetch errors:", error);
      setErrors([]);
    } finally {
      setIsLoadingErrors(false);
    }

    try {
      // Fetch technical issues
      setIsLoadingTechnicalIssues(true);
      const technicalIssuesResponse =
        await apiClient.request.getTechnicalIssueOfRequest(requestId);
      console.log("Technical issues response:", technicalIssuesResponse);
      setTechnicalIssues(technicalIssuesResponse || []);
    } catch (error) {
      console.error("Failed to fetch technical issues:", error);
      setTechnicalIssues([]);
    } finally {
      setIsLoadingTechnicalIssues(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority: string) => {
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "assigned":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "unassigned":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return "bg-gray-500/10 text-gray-400 border-gray-500/20";

    switch (severity.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "medium":
      case "moderate":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
      case "minor":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  // Safe translation functions
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

  // Helper functions to determine what to show
  const hasErrors = !isLoadingErrors && errors.length > 0;
  const hasTechnicalIssues =
    !isLoadingTechnicalIssues && technicalIssues.length > 0;
  const isLoadingAnyReportData = isLoadingErrors || isLoadingTechnicalIssues;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-200">
              Chi tiết yêu cầu
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Request Title - Simplified Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                {request.requestTitle}
              </h3>
            </div>

            {/* No Report Warning (for requests without reports) */}
            {!hasReport && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Yêu cầu chưa có báo cáo</span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  Yêu cầu này chưa được tạo báo cáo chi tiết. Một số thông tin
                  có thể bị hạn chế.
                </p>
              </div>
            )}

            {/* Device Information */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Thông tin thiết bị
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Tên thiết bị:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {request.deviceName}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Mã thiết bị:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {request.deviceCode}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Vị trí:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {request.zoneName} - {request.areaName} (Vị trí{" "}
                    {request.positionIndex})
                  </p>
                </div>
              </div>
            </div>

            {/* Description with Status Information - Moved from Header */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Mô tả yêu cầu
              </h4>

              {/* Request Description */}
              <p className="rounded-lg pb-4">{request.description}</p>

              {/* Status Information Grid - Moved from Header */}
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

                {/* Report Badge */}
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Báo cáo
                  </span>
                  {hasReport ? (
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 w-fit px-3 py-1">
                      <FileText className="h-3 w-3 mr-1" />
                      Có báo cáo
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20 w-fit px-3 py-1">
                      Chưa có báo cáo
                    </Badge>
                  )}
                </div>

                {/* Creation Date */}
                <div className="flex flex-col space-y-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Ngày tạo
                  </span>
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(request.createdDate)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Issues List with improved image handling */}
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Danh sách triệu chứng ({request.issues?.length || 0} triệu
                chứng)
              </h4>
              <div className="space-y-3">
                {request.issues && request.issues.length > 0 ? (
                  request.issues.map((issue, index) => (
                    <div
                      key={issue.id}
                      className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                            {index + 1}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">
                            {issue.displayName}
                          </span>
                        </div>
                        {issue.imageUrls && issue.imageUrls.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 dark:text-slate-400">
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
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400">
                    Không có thông tin triệu chứng chi tiết
                  </div>
                )}
              </div>
            </div>

            {/* Errors Section with HOT card design */}
            {hasReport && (isLoadingErrors || hasErrors) && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Bug className="h-4 w-4" />
                  Lỗi được xác định
                  {isLoadingErrors && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </h4>
                <div className="space-y-3">
                  {isLoadingErrors ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-slate-500">
                        Đang tải lỗi...
                      </span>
                    </div>
                  ) : hasErrors ? (
                    errors.map((error, index) => (
                      <div
                        key={error.errorId}
                        className="relative p-4 bg-orange-50 border-l-4 border-orange-500 rounded-lg dark:bg-orange-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center justify-center w-6 h-6 bg-orange-500 text-white text-xs font-bold rounded-full">
                                {index + 1}
                              </span>
                              <span className="font-medium text-orange-800 dark:text-orange-200">
                                {error.name}
                              </span>
                            </div>

                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1 ml-8">
                              Mã lỗi: {error.errorCode}
                            </p>

                            <div className="flex gap-2 mt-2 ml-8">
                              {error.severity && (
                                <Badge
                                  variant="outline"
                                  className={`${getSeverityColor(
                                    error.severity
                                  )} border-0`}
                                >
                                  {error.severity}
                                </Badge>
                              )}
                              <Badge
                                variant="outline"
                                className={`${getStatusColor(
                                  error.status
                                )} border-0`}
                              >
                                {safeTranslateTaskStatus(error.status)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            )}

            {/* Technical Issues Section with HOT card design */}
            {hasReport && (isLoadingTechnicalIssues || hasTechnicalIssues) && (
              <div>
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Triệu chứng kỹ thuật
                  {isLoadingTechnicalIssues && (
                    <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  )}
                </h4>
                <div className="space-y-3">
                  {isLoadingTechnicalIssues ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                      <span className="ml-2 text-slate-500">
                        Đang tải triệu chứng kỹ thuật...
                      </span>
                    </div>
                  ) : hasTechnicalIssues ? (
                    technicalIssues.map((issue, index) => (
                      <div
                        key={issue.technicalIssueId}
                        className="relative p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg dark:bg-blue-950/20"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="flex items-center justify-center w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full">
                                {index + 1}
                              </span>
                              <span className="font-medium text-blue-800 dark:text-blue-200">
                                {issue.name}
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

                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 ml-8">
                              Mã triệu chứng: {issue.symptomCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : null}
                </div>
              </div>
            )}

            {/* Additional info for requests without reports */}
            {!hasReport && (
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                  Thông tin bổ sung
                </h4>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <p>
                    • Yêu cầu này đang chờ được xử lý và tạo báo cáo chi tiết
                  </p>
                  <p>
                    • Khi có báo cáo, bạn sẽ có thể xem thêm thông tin về các
                    lỗi và triệu chứng kỹ thuật
                  </p>
                </div>
              </div>
            )}

            {/* Show message when report exists but no errors or technical issues found (and not loading) */}
            {hasReport &&
              !isLoadingAnyReportData &&
              !hasErrors &&
              !hasTechnicalIssues && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-400">
                    <FileText className="h-5 w-5" />
                    <span className="font-medium">Báo cáo đã hoàn thành</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Báo cáo cho yêu cầu này đã được tạo nhưng chưa có thông tin
                    chi tiết về lỗi hoặc triệu chứng kỹ thuật.
                  </p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Xem hình ảnh</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <Image
              src={selectedImage}
              alt="Preview"
              width={1200}
              height={800}
              className="max-w-full max-h-[70vh] object-contain rounded-lg w-auto h-auto"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
              unoptimized
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
