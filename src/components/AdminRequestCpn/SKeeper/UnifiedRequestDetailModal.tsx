'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Settings, FileText, CheckCircle, XCircle, Clock, AlertCircle, Package, Archive, Cog, RefreshCw, Wrench } from "lucide-react";
import { UNIFIED_SKEEPER_REQUEST, MachineActionType } from "@/types/sparePart.type";
import { DEVICE_WEB } from "@/types/device.type";
import { translateActionType, translateTaskStatus } from "@/utils/textTypeTask";
import { apiClient } from "@/lib/api-client";
import { Skeleton } from "@/components/ui/skeleton";

interface UnifiedRequestDetailModalProps {
  request: UNIFIED_SKEEPER_REQUEST | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function UnifiedRequestDetailModal({ 
  request, 
  isOpen, 
  onClose 
}: UnifiedRequestDetailModalProps) {
  
  const [device, setDevice] = useState<DEVICE_WEB | null>(null);
  const [isLoadingDevice, setIsLoadingDevice] = useState(false);
  const [requesterUser, setRequesterUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // Fetch device details and user details when modal opens
  useEffect(() => {
    const fetchData = async () => {
      if (!request || !isOpen) return;

      const originalData = request.originalData as any;
      const deviceId = originalData?.deviceId;
      const requestedById = originalData?.requestedById;

      // Fetch device details
      if (deviceId) {
        setIsLoadingDevice(true);
        try {
          const deviceData = await apiClient.device.getDeviceById(deviceId);
          setDevice(deviceData);
        } catch (error) {
          console.error('Failed to fetch device details:', error);
          setDevice(null);
        } finally {
          setIsLoadingDevice(false);
        }
      } else {
        setDevice(null);
      }

      // Fetch user details
      if (requestedById) {
        setIsLoadingUser(true);
        try {
          const userData = await apiClient.user.getUserById(requestedById);
          setRequesterUser(userData);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          setRequesterUser(null);
        } finally {
          setIsLoadingUser(false);
        }
      } else {
        setRequesterUser(null);
      }
    };

    fetchData();
  }, [request, isOpen]);

  if (!request) return null;

  // Safe translation functions
  const safeTranslateTaskStatus = (status: string) => {
    try {
      return translateTaskStatus(status || 'unknown');
    } catch (error) {
      console.error('Error translating status:', error);
      return status || 'Unknown';
    }
  };

  const safeTranslateActionType = (actionType: string) => {
    try {
      return translateActionType(actionType || 'unknown');
    } catch (error) {
      console.error('Error translating action type:', error);
      return actionType || 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed': case 'inprogress': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeIcon = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case 'stockout': return <Package className="h-5 w-5 text-red-600" />;
      case 'stockin': return <Archive className="h-5 w-5 text-green-600" />;
      case 'installation': return <Cog className="h-5 w-5 text-blue-600" />;
      case 'warrantysubmission': return <RefreshCw className="h-5 w-5 text-orange-600" />;
      case 'sparepartrequest': return <Wrench className="h-5 w-5 text-purple-600" />;
      default: return <Settings className="h-5 w-5 text-gray-600" />;
    }
  };

  const getActionTypeColor = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case 'stockout': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'stockin': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'installation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'warrantysubmission': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'sparepartrequest': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    const date = new Date(dateString);
    const timeString = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateTimeString = date.toLocaleDateString('vi-VN') + ' ' + timeString;
    
    // Calculate relative time
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    let relativeTime = '';
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      relativeTime = `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      relativeTime = `${diffInHours} giờ trước`;
    } else {
      relativeTime = "Trên 1 ngày";
    }
    
    return `${dateTimeString} • ${relativeTime}`;
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-600 dark:text-green-400';
      case 'inactive': return 'text-red-600 dark:text-red-400';
      case 'inuse': return 'text-blue-600 dark:text-blue-400';
      case 'inrepair': return 'text-orange-600 dark:text-orange-400';
      case 'inwarranty': return 'text-purple-600 dark:text-purple-400';
      case 'decommissioned': return 'text-gray-600 dark:text-gray-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getVietnameseDeviceStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Active': 'Hoạt động',
      'Inactive': 'Không hoạt động',
      'InUse': 'Đang sử dụng',
      'InRepair': 'Đang sửa chữa',
      'InWarranty': 'Đang bảo hành',
      'Decommissioned': 'Ngừng sử dụng'
    };
    return statusMap[status] || status;
  };

  const originalData = request.originalData as any;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-800 dark:text-slate-200">
            Chi tiết yêu cầu xác nhận
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Request Header */}
          <div className="border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {request.actionType && getActionTypeIcon(request.actionType)}
                <div>
                  <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                    {request.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {request.actionType ? safeTranslateActionType(request.actionType) : 'Không xác định'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(request.status)}
                <Badge className={getStatusColor(request.status)}>
                  {safeTranslateTaskStatus(request.status)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Request Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Request Information */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Thông tin yêu cầu
              </h4>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Mã xác nhận:</span>
                  <p className="text-slate-600 dark:text-slate-400">{request.title}</p>
                </div>
                {/* Người yêu cầu with API call */}
                {originalData?.requestedById && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Người yêu cầu:</span>
                    {isLoadingUser ? (
                      <Skeleton className="h-5 w-32 mt-1" />
                    ) : (
                      <p className="text-slate-600 dark:text-slate-400">
                        {requesterUser?.fullName || requesterUser?.userName || 'Không thể tải thông tin người dùng'}
                      </p>
                    )}
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Người thực hiện:</span>
                  <p className="text-slate-600 dark:text-slate-400">
                    {request.assigneeName || 'Chưa có người thực hiện'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Ngày bắt đầu:</span>
                  <p className="text-slate-600 dark:text-slate-400">{formatDate(request.requestDate)}</p>
                </div>
                {/* Ghi chú moved here */}
                {originalData?.notes && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Ghi chú:</span>
                    <p className="text-slate-600 dark:text-slate-400">
                      {originalData.notes}
                    </p>
                  </div>
                )}
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Loại hành động:</span>
                  <div className="mt-1">
                    <Badge className={request.actionType ? getActionTypeColor(request.actionType) : 'bg-gray-100 text-gray-800'}>
                      {request.actionType ? safeTranslateActionType(request.actionType) : 'Không xác định'}
                    </Badge>
                  </div>
                </div>
                {/* {originalData?.machineId && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">ID Máy móc:</span>
                    <p className="text-slate-600 dark:text-slate-400">{originalData.machineId}</p>
                  </div>
                )} */}
              </div>
            </div>

            {/* Enhanced Device Information - Matching MachineRequestDetailModal design */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Thông tin thiết bị
              </h4>
              {isLoadingDevice ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-5 w-3/4" />
                    </div>
                  </div>
                </div>
              ) : device ? (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Tên thiết bị:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.deviceName}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Mã thiết bị:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.deviceCode}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Số seri:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.serialNumber}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Model:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.model}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Nhà sản xuất:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.manufacturer}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Trạng thái:</span>
                      <p className={`font-medium ${getDeviceStatusColor(device.status)}`}>
                        {getVietnameseDeviceStatus(device.status)}
                      </p>
                    </div>
                  </div>
                  
                  {device.description && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Mô tả:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.description}</p>
                    </div>
                  )}
                  
                  {/* <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Ngày sản xuất:</span>
                      <p className="text-slate-600 dark:text-slate-400">{formatDate(device.manufactureDate)}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Ngày lắp đặt:</span>
                      <p className="text-slate-600 dark:text-slate-400">{formatDate(device.installationDate)}</p>
                    </div>
                  </div> */}
                  

                  {device.specifications && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Thông số kỹ thuật:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.specifications}</p>
                    </div>
                  )}
                  
                  {device.zoneName && (
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Vị trí:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.zoneName} - {device.areaName}</p>
                    </div>
                  )}

                  {/* <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Nhà cung cấp:</span>
                      <p className="text-slate-600 dark:text-slate-400">{device.supplier || 'Chưa có thông tin'}</p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Giá mua:</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {device.purchasePrice ? `${device.purchasePrice.toLocaleString('vi-VN')} VND` : 'Chưa có thông tin'}
                      </p>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Bảo hành:</span>
                      <p className={`font-medium ${device.isUnderWarranty ? 'text-green-600' : 'text-red-600'}`}>
                        {device.isUnderWarranty ? 'Còn bảo hành' : 'Hết bảo hành'}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-300">Vị trí chỉ mục:</span>
                      <p className="text-slate-600 dark:text-slate-400">
                        {device.positionIndex !== null ? `#${device.positionIndex}` : 'Chưa xác định'}
                      </p>
                    </div>
                  </div>
                </div>
              ) : originalData?.deviceId ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">Không thể tải thông tin thiết bị</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 dark:text-gray-400">Không có thông tin thiết bị</p>
                </div>
              )}
            </div>
          </div>

          {/* Confirmation Section */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Xác nhận yêu cầu
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <div className="font-medium text-sm">Xác nhận từ thợ máy</div>
                  <div className="text-xs text-slate-500">Mechanic Confirmation</div>
                </div>
                <div className="flex items-center gap-2">
                  {request.mechanicConfirm ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <Badge 
                    variant="secondary" 
                    className={
                      request.mechanicConfirm 
                        ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    }
                  >
                    {request.mechanicConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <div className="font-medium text-sm">Xác nhận từ thủ kho</div>
                  <div className="text-xs text-slate-500">Stock Keeper Confirmation</div>
                </div>
                <div className="flex items-center gap-2">
                  {request.stockkeeperConfirm ? (
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  )}
                  <Badge 
                    variant="secondary" 
                    className={
                      request.stockkeeperConfirm 
                        ? "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                        : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                    }
                  >
                    {request.stockkeeperConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-4">
              Tiến trình yêu cầu
            </h4>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className={`flex flex-col items-center ${
                  ['pending', 'inprogress', 'completed'].includes(request.status.toLowerCase()) ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['pending', 'inprogress', 'completed'].includes(request.status.toLowerCase()) 
                      ? 'bg-blue-100 dark:bg-blue-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="text-xs mt-1 text-center">Đang chờ</div>
                </div>
                
                <div className={`flex flex-col items-center ${
                  ['inprogress', 'completed'].includes(request.status.toLowerCase()) ? 'text-purple-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    ['inprogress', 'completed'].includes(request.status.toLowerCase()) 
                      ? 'bg-purple-100 dark:bg-purple-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Settings className="h-4 w-4" />
                  </div>
                  <div className="text-xs mt-1 text-center">Xác nhận</div>
                </div>
                
                <div className={`flex flex-col items-center ${
                  request.status.toLowerCase() === 'completed' ? 'text-green-600' : 'text-gray-400'
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    request.status.toLowerCase() === 'completed' 
                      ? 'bg-green-100 dark:bg-green-900/30' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <div className="text-xs mt-1 text-center">Hoàn thành</div>
                </div>
              </div>
              
              {/* Progress Line */}
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-600 -z-10">
                <div 
                  className={`h-full transition-all duration-300 ${
                    request.status.toLowerCase() === 'completed' ? 'w-full bg-green-500' :
                    request.status.toLowerCase() === 'inprogress' ? 'w-1/2 bg-purple-500' :
                    request.status.toLowerCase() === 'pending' ? 'w-1 bg-blue-500' :
                    'w-0 bg-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}