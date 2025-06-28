"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, AlertCircle, FileText, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { REQUEST_WITH_REPORT } from "@/types/dashboard.type";

interface RequestDetailModalProps {
  request: REQUEST_WITH_REPORT | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function RequestDetailModal({ request, isOpen, onClose }: RequestDetailModalProps) {
  if (!request) return null;

  // Check if request has a report
  const hasReport = request.reportId && request.reportId !== 'no-report'

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
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
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
              {/* Report status badge */}
              {/* {hasReport ? (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  <FileText className="h-3 w-3 mr-1" />
                  Có báo cáo
                </Badge>
              ) : (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Chưa có báo cáo
                </Badge>
              )} */}
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
              {hasReport && request.reportId && request.reportId !== 'no-report' && (
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">ID Báo cáo:</span>
                  <p className="text-slate-600 dark:text-slate-400">{request.reportId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Mô tả yêu cầu
            </h4>
            <p className=" bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
              {request.description}
            </p>
          </div>

          {/* Issues List */}
          <div>
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Danh sách vấn đề ({request.issues?.length || 0} vấn đề)
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
                  Không có thông tin vấn đề chi tiết
                </div>
              )}
            </div>
          </div>

          {/* Additional info for requests without reports */}
          {!hasReport && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-2">
                Thông tin bổ sung
              </h4>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>• Yêu cầu này đang chờ được xử lý và tạo báo cáo chi tiết</p>
                <p>• Khi có báo cáo, bạn sẽ có thể xem thêm thông tin về các vấn đề kỹ thuật</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}