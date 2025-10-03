"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  Settings,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { DEVICE_WEB } from "@/types/device.type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ UPDATED: Interface for unified machine request detail
interface UnifiedMachineRequestDetail {
  id: string;
  confirmationCode: string;
  actionType: string;
  status: string;
  startDate: string;
  createdDate: string;
  endDate?: string;
  assigneeName: string;
  requestedByName?: string;
  notes?: string;
  mechanicConfirm: boolean;
  stockkeeperConfirm: boolean;
  // Device information for machine requests
  deviceId?: string;
  machineId?: string;
}

export default function MachineRequestDetailPage({
  params,
}: {
  params: Promise<{ "request-id": string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<UnifiedMachineRequestDetail | null>(null);
  const [device, setDevice] = useState<DEVICE_WEB | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEW: Transform unified API response to machine request format
  const transformToMachineRequest = (unifiedData: any): UnifiedMachineRequestDetail => {
    return {
      id: unifiedData.id,
      confirmationCode: unifiedData.confirmationCode,
      actionType: unifiedData.actionType,
      status: unifiedData.status,
      startDate: unifiedData.startDate,
      createdDate: unifiedData.createdDate,
      endDate: unifiedData.endDate,
      assigneeName: unifiedData.assigneeName,
      requestedByName: unifiedData.requestedByName,
      notes: unifiedData.notes,
      mechanicConfirm: unifiedData.mechanicConfirm,
      stockkeeperConfirm: unifiedData.stockkeeperConfirm,
      // Extract device ID from machine action details
      deviceId: unifiedData.deviceId,
      machineId: unifiedData.machineId,
    };
  };

  // ✅ UPDATED: Fetch request detail using unified API
  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching unified machine request detail for ID: ${requestId}`);

        // ✅ Use the new unified API
        const response = await apiClient.machineActionConfirmation.getById(requestId);
        
        console.log("Unified machine API response:", response);
        
        // Handle both possible response structures
        const requestData = response.data || response;
        if (!requestData) {
          console.error("API response structure:", response);
          throw new Error("Request data not found");
        }

        // ✅ Verify this is a machine-related request (not SparePartRequest)
        if (requestData.actionType?.toLowerCase() === "sparepartrequest") {
          throw new Error("This request is not a machine request");
        }

        const transformedData = transformToMachineRequest(requestData);
        setRequestDetail(transformedData);

        // ✅ Fetch device details if deviceId exists
        if (transformedData.deviceId) {
          try {
            const deviceData = await apiClient.device.getDeviceById(transformedData.deviceId);
            setDevice(deviceData);
          } catch (deviceError) {
            console.warn("Could not fetch device details:", deviceError);
          }
        }

        toast.success("Chi tiết yêu cầu đã được tải thành công");
      } catch (err) {
        console.error("Failed to fetch machine request detail:", err);
        setError("Không thể tải chi tiết yêu cầu");
        toast.error("Không thể tải chi tiết yêu cầu");
      } finally {
        setIsLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId]);

  // Go back to requests list with tab memory
  const goBack = () => {
    const tab = searchParams.get("tab") || "machines";
    router.push(`../../requests?tab=${tab}`);
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa xác nhận";
    return new Date(dateString).toLocaleString("vi-VN");
  };

  // ✅ NEW: Get device status color
  const getDeviceStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
      case "hoạt động":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/10",
          border: "border-blue-200 dark:border-blue-800",
          title: "text-blue-700 dark:text-blue-400",
          icon: "text-blue-600"
        };
      case "maintenance":
      case "bảo trì":
      case "đang sửa chữa":
        return {
          bg: "bg-orange-50 dark:bg-orange-950/10",
          border: "border-orange-200 dark:border-orange-800",
          title: "text-orange-700 dark:text-orange-400",
          icon: "text-orange-600"
        };
      case "broken":
      case "hỏng":
        return {
          bg: "bg-red-50 dark:bg-red-950/10",
          border: "border-red-200 dark:border-red-800",
          title: "text-red-700 dark:text-red-400",
          icon: "text-red-600"
        };
      case "inactive":
      case "ngừng hoạt động":
        return {
          bg: "bg-gray-50 dark:bg-gray-950/10",
          border: "border-gray-200 dark:border-gray-800",
          title: "text-gray-700 dark:text-gray-400",
          icon: "text-gray-600"
        };
      default:
        return {
          bg: "bg-green-50 dark:bg-green-950/10",
          border: "border-green-200 dark:border-green-800",
          title: "text-green-700 dark:text-green-400",
          icon: "text-green-600"
        };
    }
  };

  // ✅ UPDATED: Render device information (single device, expanded layout)
  const renderDeviceInfo = (device: DEVICE_WEB | null) => {
    const statusColors = device ? getDeviceStatusColor(device.status) : getDeviceStatusColor("default");

    return (
      <div
        className={`border ${statusColors.border} rounded-lg p-6 ${statusColors.bg} transition-all duration-300`}
      >
        <div className="flex items-center gap-3 mb-6">
          <Settings className={`h-6 w-6 ${statusColors.icon}`} />
          <h3 className={`text-xl font-semibold ${statusColors.title}`}>
            Thông tin thiết bị
          </h3>
        </div>

        {device ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Tên thiết bị
                </p>
                <p className="font-semibold text-lg">{device.deviceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Mã thiết bị
                </p>
                <p className="font-semibold text-lg">{device.deviceCode}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Trạng thái
                </p>
                <StatusBadge status={device.status} />
              </div>
            </div>

            {/* Technical Specifications */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Thông số kỹ thuật
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Số seri
                  </p>
                  <p className="font-medium">{device.serialNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Model
                  </p>
                  <p className="font-medium">{device.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Nhà sản xuất
                  </p>
                  <p className="font-medium">{device.manufacturer}</p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                Thông tin thời gian
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Ngày sản xuất
                  </p>
                  <p className="font-medium">
                    {formatDate(device.manufactureDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Ngày lắp đặt
                  </p>
                  <p className="font-medium">
                    {formatDate(device.installationDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            {device.zoneName && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Vị trí lắp đặt
                </h4>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="font-medium">
                    {device.zoneName} - {device.areaName}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            {device.description && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-6">
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4">
                  Mô tả
                </h4>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <p className="text-gray-700 dark:text-gray-300">
                    {device.description}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <Monitor className="h-8 w-8 text-gray-400" />
            </div>
            <div>
              <p className="font-medium text-gray-500 text-lg mb-2">
                Không có thông tin thiết bị
              </p>
              <p className="text-sm text-gray-400">
                Thiết bị chưa được liên kết với yêu cầu này
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-medium mb-2">Lỗi</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={goBack}
              className="flex items-center text-gray-500 hover:text-primary mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Quay lại danh sách</span>
            </button>
            <h1 className="text-xl font-bold">{requestDetail?.confirmationCode}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xem thông tin yêu cầu thiết bị (Chỉ xem)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <StatusBadge status={requestDetail?.status || "Unknown"} />
            </div>
          </div>
        </div>
      </div>

      {/* Request Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Thông tin yêu cầu</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <User className="h-4 w-4" />
                <span>Người yêu cầu/ thực hiện</span>
              </div>
              <p className="font-medium">
                {requestDetail?.requestedByName || requestDetail?.assigneeName || "Chưa có người yêu cầu/ thực hiện"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Ngày tạo yêu cầu</span>
              </div>
              <p className="font-medium">
                {formatDate(requestDetail?.createdDate || requestDetail?.startDate || null)}
              </p>
            </div>

            {requestDetail?.endDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày hoàn thành</span>
                </div>
                <p className="font-medium">
                  {formatDate(requestDetail?.endDate)}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Loại hành động
              </p>
              <p className="font-medium">
                {requestDetail?.actionType || "Không có"}
              </p>
            </div>

            {requestDetail?.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Ghi chú
                </p>
                <p className="font-medium">
                  {requestDetail.notes}
                </p>
              </div>
            )}

            {/* Confirmation status */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Trạng thái xác nhận
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Thợ máy:</span>
                  <StatusBadge 
                    status={requestDetail?.mechanicConfirm ? "Confirmed" : "Pending"} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Thủ kho:</span>
                  <StatusBadge 
                    status={requestDetail?.stockkeeperConfirm ? "Confirmed" : "Pending"} 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Information */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        {renderDeviceInfo(device)}
      </div>

      {/* Action Buttons - Only Back button */}
      <div className="flex justify-end">
        <button
          onClick={goBack}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    </div>
  );
}
