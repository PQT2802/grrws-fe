'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  BarChart3
} from 'lucide-react';
import { DEVICE_WEB } from '@/types/device.type';
import { DeviceExportService } from '@/components/DeviceCpn/DeviceExportData';
import { toast } from 'sonner';

interface DeviceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: DEVICE_WEB[];
}

export default function DeviceExportModal({
  isOpen,
  onClose,
  devices,
}: DeviceExportModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel'>('pdf');

  const handleExport = async (format: 'pdf' | 'excel') => {
    if (devices.length === 0) {
      toast.error('Không có thiết bị để xuất');
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      setExportMessage('Đang chuẩn bị xuất dữ liệu...');
      setSelectedFormat(format);

      console.log(`🚀 Starting ${format} export for ${devices.length} devices`);

      // Start export with progress callback
      await DeviceExportService.exportDevices(devices, format, (progress, message) => {
        setExportProgress(Math.min(progress, 99)); // Keep at 99% until complete
        setExportMessage(message);
        console.log(`Export progress: ${progress}% - ${message}`);
      });

      // Complete progress
      setExportProgress(100);
      setExportMessage('Xuất dữ liệu thành công!');

      // Show success message
      const formatName = format === 'pdf' ? 'PDF' : 'Excel';
      toast.success(`Xuất ${formatName} thành công!`, {
        description: `Đã xuất ${devices.length} thiết bị${format === 'pdf' ? ' kèm mã QR' : ' (có thể nhập lại)'}`,
      });

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        resetState();
      }, 1500);

    } catch (error) {
      console.error('Export failed:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Xuất dữ liệu thất bại - vui lòng thử lại';
        
      toast.error('Xuất dữ liệu thất bại', {
        description: errorMessage,
      });
      
      setExportMessage(`Lỗi: ${errorMessage}`);
      
      // Reset state after showing error
      setTimeout(() => {
        resetState();
      }, 3000);
    }
  };

  const resetState = () => {
    setIsExporting(false);
    setExportProgress(0);
    setExportMessage('');
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      resetState();
    }
  };

  // Count active devices and devices under warranty
  const activeDevices = devices.filter(d => d.status === 'Active').length;
  const warrantyDevices = devices.filter(d => d.isUnderWarranty).length;
  const inUseDevices = devices.filter(d => d.status === 'InUse').length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-blue-600" />
            Xuất Danh Sách Thiết Bị
          </DialogTitle>
          <DialogDescription>
            Chọn định dạng xuất dữ liệu. Mã QR sẽ được bao gồm trong file PDF để nhận dạng thiết bị.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary - Horizontal Layout with adjusted styling */}
          <div className="rounded-xl border p-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Tóm Tắt Dữ Liệu
            </h4>
            {/* ✅ Reduced font size and padding for better balance */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{devices.length}</div>
                <div className="text-xs text-gray-400 mt-1">Tổng Thiết Bị</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{activeDevices}</div>
                <div className="text-xs text-gray-400 mt-1">Trong Kho</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{warrantyDevices}</div>
                <div className="text-xs text-gray-400 mt-1">Còn Bảo Hành</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{inUseDevices}</div>
                <div className="text-xs text-gray-400 mt-1">Đang Sử Dụng</div>
              </div>
            </div>
          </div>

          {/* Export Progress */}
          {isExporting && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm font-medium">
                  Đang xuất sang {selectedFormat === 'pdf' ? 'PDF' : 'Excel'}...
                </span>
              </div>
              <Progress value={exportProgress} className="h-2" />
              <div className="text-xs text-gray-600 text-center">
                {exportProgress}% - {exportMessage}
              </div>
            </div>
          )}

          {/* Export Options - Horizontal Layout */}
          {!isExporting && (
            <div>
              <h4 className="font-medium mb-4 text-center">Chọn Định Dạng Xuất</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* PDF Export */}
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-blue-500 transition-all duration-200 hover:shadow-lg group">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 mx-auto mb-3 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="h-7 w-7 text-red-600" />
                    </div>
                    <h4 className="font-semibold text-lg">PDF File</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Báo cáo chuyên nghiệp kèm mã QR
                    </p>
                    <Badge variant="secondary" className="mt-2">Khuyến nghị</Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Bao gồm mã QR dễ quét</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Bố cục bảng chuyên nghiệp</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Sẵn sàng in ấn</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleExport('pdf')}
                    variant="outline" 
                    className="w-full border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                    disabled={devices.length === 0}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Xuất File PDF
                  </Button>
                </div>

                {/* Excel Export */}
                <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-green-500 transition-all duration-200 hover:shadow-lg group">
                  <div className="text-center mb-4">
                    <div className="w-14 h-14 mx-auto mb-3 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileSpreadsheet className="h-7 w-7 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-lg">Excel File</h4>
                    <p className="text-sm text-gray-400 mt-1">
                      Dữ liệu đầy đủ để có thể nhập file
                    </p>
                    <Badge variant="outline" className="mt-2">Có thể nhập lại file</Badge>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Bao gồm tất cả trường thiết bị</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Sẵn sàng nhập lại hệ thống</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Nhiều trang tính</span>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => handleExport('excel')} 
                    variant="outline" 
                    className="w-full border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                    disabled={devices.length === 0}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Xuất File Excel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Warning for no devices */}
          {devices.length === 0 && (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Không có thiết bị để xuất
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                  Vui lòng đảm bảo đã tải danh sách thiết bị trước khi xuất.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ✅ Fixed footer with right-aligned cancel button */}
        <div className="flex justify-between items-center pt-4 border-t bg-white dark:bg-gray-950">
          {/* Export info - Left side */}
          <div className="text-xs text-gray-400">
            {devices.length > 0 && (
              <p>Sẵn sàng xuất {devices.length} thiết bị</p>
            )}
          </div>

          {/* Action Buttons - Right side */}
          <div className="flex items-center gap-2">
            {/* Force close button during export (emergency) */}
            {isExporting && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  toast.warning('Đã hủy xuất dữ liệu');
                  resetState();
                  onClose();
                }}
                className="text-red-600 hover:text-red-700"
              >
                Hủy Xuất
              </Button>
            )}

            {/* ✅ Cancel Button - Moved to right side */}
            {!isExporting && (
              <Button variant="outline" onClick={handleClose}>
                Hủy
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}