"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, AlertCircle, FileText, Image as ImageIcon, AlertTriangle, Bug, Wrench, Loader2 } from "lucide-react";
import { REQUEST_WITH_REPORT } from "@/types/dashboard.type";
import { ERROR_FOR_REQUEST_DETAIL_WEB, TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { apiClient } from "@/lib/api-client";
import { useState, useEffect } from "react";

interface RequestDetailModalProps {
  request: REQUEST_WITH_REPORT | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailModal({ request, isOpen, onClose }: RequestDetailModalProps) {
  
  const [errors, setErrors] = useState<ERROR_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [technicalIssues, setTechnicalIssues] = useState<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(false);
  const [isLoadingTechnicalIssues, setIsLoadingTechnicalIssues] = useState(false);

  const hasReport = request?.reportId && request.reportId !== 'no-report';

  useEffect(() => {
    if (isOpen && hasReport && request?.id) {
      fetchErrorsAndTechnicalIssues(request.id);
    }
  }, [isOpen, hasReport, request?.id]);

  if (!request) return null;

  const fetchErrorsAndTechnicalIssues = async (requestId: string) => {
    try {
      // Fetch errors
      setIsLoadingErrors(true);
      const errorsResponse = await apiClient.request.getErrorOfRequest(requestId);
      console.log("Errors response:", errorsResponse);
      setErrors(errorsResponse.data || errorsResponse || []);
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      setErrors([]);
    } finally {
      setIsLoadingErrors(false);
    }

    try {
      // Fetch technical issues
      setIsLoadingTechnicalIssues(true);
      const technicalIssuesResponse = await apiClient.request.getTechnicalIssueOfRequest(requestId);
      console.log("Technical issues response:", technicalIssuesResponse);
      setTechnicalIssues(technicalIssuesResponse || []);
    } catch (error) {
      console.error('Failed to fetch technical issues:', error);
      setTechnicalIssues([]);
    } finally {
      setIsLoadingTechnicalIssues(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': 
      case 'completed': 
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'assigned': 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'unassigned': 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: 
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const getSeverityColor = (severity: string | null) => {
    if (!severity) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    
    switch (severity.toLowerCase()) {
      case 'critical': 
      case 'high': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': 
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': 
      case 'minor':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Chi tiết yêu cầu
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Title */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {request.requestTitle}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
              <Badge className={getStatusColor(request.status)}>
                {request.status}
              </Badge>
              {hasReport && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <FileText className="h-3 w-3 mr-1" />
                  Có báo cáo
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Calendar className="h-4 w-4" />
              <span>Ngày tạo: {formatDate(request.createdDate)}</span>
            </div>
          </div>

          {/* No Report Warning (for requests without reports) */}
          {!hasReport && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-center gap-2 text-orange-800 dark:text-orange-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Yêu cầu chưa có báo cáo</span>
              </div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Yêu cầu này chưa được tạo báo cáo chi tiết. Một số thông tin có thể bị hạn chế.
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
                <span className="font-medium text-slate-700 dark:text-slate-300">Tên thiết bị:</span>
                <p className="text-slate-600 dark:text-slate-400">{request.deviceName}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Mã thiết bị:</span>
                <p className="text-slate-600 dark:text-slate-400">{request.deviceCode}</p>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Vị trí:</span>
                <p className="text-slate-600 dark:text-slate-400">
                  {request.zoneName} - {request.areaName} (Vị trí {request.positionIndex})
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mô tả yêu cầu
            </h4>
            <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              {request.description}
            </p>
          </div>

          {/* Issues List */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Danh sách triệu chứng ({request.issues?.length || 0} triệu chứng)
            </h4>
            <div className="space-y-3">
              {request.issues && request.issues.length > 0 ? (
                request.issues.map((issue, index) => (
                  <div key={issue.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {issue.displayName}
                      </span>
                    </div>
                    {issue.imageUrls && issue.imageUrls.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <ImageIcon className="h-4 w-4" />
                        <span>{issue.imageUrls.length} hình ảnh</span>
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

          {/* Errors Section - Only show for requests with reports */}
          {hasReport && (
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Lỗi được xác định
                {isLoadingErrors && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </h4>
              <div className="space-y-3">
                {isLoadingErrors ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-slate-500">Đang tải lỗi...</span>
                  </div>
                ) : errors.length > 0 ? (
                  errors.map((error, index) => (
                    <div key={error.errorId} className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center w-6 h-6 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {error.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              Mã lỗi: {error.errorCode}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {error.severity && (
                            <Badge variant="secondary" className={`${getSeverityColor(error.severity)} border-0`}>
                              {error.severity}
                            </Badge>
                          )}
                          <Badge variant="secondary" className={`${getStatusColor(error.status)} border-0`}>
                            {error.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    Không có lỗi được xác định
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technical Issues Section - Only show for requests with reports */}
          {hasReport && (
            <div>
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Triệu chứng kỹ thuật
                {isLoadingTechnicalIssues && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </h4>
              <div className="space-y-3">
                {isLoadingTechnicalIssues ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2 text-slate-500">Đang tải triệu chứng kỹ thuật...</span>
                  </div>
                ) : technicalIssues.length > 0 ? (
                  technicalIssues.map((issue, index) => (
                    <div key={issue.technicalIssueId} className="p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start gap-3">
                          <span className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium mt-0.5">
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                              {issue.name}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                              Mã triệu chứng: {issue.symptomCode}
                            </div>
                            {issue.description && (
                              <div className="text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 rounded p-2 mb-2">
                                {issue.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <Badge variant="secondary" className={`${getStatusColor(issue.status)} border-0`}>
                            {issue.status}
                          </Badge>
                          {issue.isCommon && (
                            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-0">
                              Phổ biến
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                    Không có triệu chứng kỹ thuật được xác định
                  </div>
                )}
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
                <p>• Yêu cầu này đang chờ được xử lý và tạo báo cáo chi tiết</p>
                <p>• Khi có báo cáo, bạn sẽ có thể xem thêm thông tin về các lỗi và triệu chứng kỹ thuật</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}