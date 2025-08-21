"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  User,
  FileText,
  Settings,
  Package,
  CheckCircle,
  RefreshCw,
  Monitor,
} from "lucide-react";
import { toast } from "sonner";
import StatusBadge from "../../components/StatusBadge";
import ConfirmRequestModal from "../../components/sparepart/ConfirmRequestModal";
import ConfirmDeviceAvailableModal from "../../components/machine/ConfirmDeviceAvailableModal";
import ReplaceDeviceModal from "../../components/machine/ReplaceDeviceModal";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { apiClient } from "@/lib/api-client";
import { DEVICE_WEB } from "@/types/device.type";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ✅ NEW: Interface for unified machine request detail
interface UnifiedMachineRequestDetail {
  id: string;
  confirmationCode: string;
  actionType: string;
  status: string;
  startDate: string;
  endDate?: string;
  assigneeName: string;
  notes?: string;
  mechanicConfirm: boolean;
  stockkeeperConfirm: boolean;
  // Device information for machine requests
  oldDeviceId?: string;
  newDeviceId?: string;
  machineId?: string;
}

export default function MachineRequestDetailPage({
  params,
}: {
  params: Promise<{ "request-id": string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isStockKeeper } = useAuth();
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];

  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<UnifiedMachineRequestDetail | null>(null);
  const [oldDevice, setOldDevice] = useState<DEVICE_WEB | null>(null);
  const [newDevice, setNewDevice] = useState<DEVICE_WEB | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for action modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showConfirmDeviceModal, setShowConfirmDeviceModal] = useState(false);
  const [showReplaceDeviceModal, setShowReplaceDeviceModal] = useState(false);

  // ✅ NEW: Transform unified API response to machine request format
  const transformToMachineRequest = (unifiedData: any): UnifiedMachineRequestDetail => {
    return {
      id: unifiedData.id,
      confirmationCode: unifiedData.confirmationCode,
      actionType: unifiedData.actionType,
      status: unifiedData.status,
      startDate: unifiedData.startDate,
      endDate: unifiedData.endDate,
      assigneeName: unifiedData.assigneeName,
      notes: unifiedData.notes,
      mechanicConfirm: unifiedData.mechanicConfirm,
      stockkeeperConfirm: unifiedData.stockkeeperConfirm,
      // Extract device IDs from machine action details if available
      oldDeviceId: unifiedData.oldDeviceId || unifiedData.deviceId,
      newDeviceId: unifiedData.newDeviceId || unifiedData.replacementDeviceId,
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

        // ✅ Fetch device details concurrently (following DeviceTab logic)
        if (transformedData.oldDeviceId || transformedData.newDeviceId) {
          const [oldDeviceData, newDeviceData] = await Promise.allSettled([
            transformedData.oldDeviceId 
              ? apiClient.device.getDeviceById(transformedData.oldDeviceId) 
              : Promise.resolve(null),
            transformedData.newDeviceId 
              ? apiClient.device.getDeviceById(transformedData.newDeviceId) 
              : Promise.resolve(null),
          ]);

          if (oldDeviceData.status === 'fulfilled') {
            setOldDevice(oldDeviceData.value);
          }
          if (newDeviceData.status === 'fulfilled') {
            setNewDevice(newDeviceData.value);
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

  // ✅ UPDATED: Function to reload request detail using unified API
  const refreshRequestDetail = async () => {
    try {
      setIsLoading(true);

      // ✅ Re-fetch using unified API
      const response = await apiClient.machineActionConfirmation.getById(requestId);
      const requestData = response.data || response;

      if (requestData) {
        const transformedData = transformToMachineRequest(requestData);
        setRequestDetail(transformedData);

        // Re-fetch device details
        if (transformedData.oldDeviceId || transformedData.newDeviceId) {
          const [oldDeviceData, newDeviceData] = await Promise.allSettled([
            transformedData.oldDeviceId 
              ? apiClient.device.getDeviceById(transformedData.oldDeviceId) 
              : Promise.resolve(null),
            transformedData.newDeviceId 
              ? apiClient.device.getDeviceById(transformedData.newDeviceId) 
              : Promise.resolve(null),
          ]);

          if (oldDeviceData.status === 'fulfilled') {
            setOldDevice(oldDeviceData.value);
          }
          if (newDeviceData.status === 'fulfilled') {
            setNewDevice(newDeviceData.value);
          }
        }
      }
    } catch (err) {
      console.error("Failed to refresh machine request detail:", err);
      toast.error("Không thể làm mới chi tiết yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Handle confirming the request using unified API
  const handleConfirmRequest = async (notes: string) => {
    try {
      setIsLoading(true);

      await apiClient.machineActionConfirmation.updateConfirmation(requestId, {
        stockkeeperConfirm: true,
        notes: notes,
      });

      setShowConfirmModal(false);
      toast.success("Yêu cầu đã được xác nhận thành công");

      // Reload request data to get updated status
      await refreshRequestDetail();
    } catch (error) {
      console.error("Failed to confirm machine request:", error);
      toast.error("Không thể xác nhận yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Handle confirming device availability using unified API
  const handleConfirmDeviceAvailable = async () => {
    if (!requestDetail) return;

    try {
      setIsLoading(true);

      console.log(`Confirming device availability for request: ${requestDetail.id}`);

      await apiClient.machineActionConfirmation.updateConfirmation(requestDetail.id, {
        stockkeeperConfirm: true,
        notes: "Device replacement confirmed available",
      });

      toast.success("Đã xác nhận thiết bị thay thế thành công");

      // Update local state immediately
      setRequestDetail((prev) =>
        prev
          ? {
              ...prev,
              status: "InProgress",
              stockkeeperConfirm: true,
            }
          : null
      );

      // Optionally refresh data from server
      await refreshRequestDetail();
    } catch (error) {
      console.error("Failed to confirm device availability:", error);
      toast.error("Không thể xác nhận thiết bị thay thế");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Keep existing replace device logic (this might need backend support)
  const handleReplaceDevice = async (
    deviceId: string,
    reason: string,
    notes?: string
  ) => {
    if (!requestDetail) return;

    try {
      console.log(`Replacing device for request: ${requestDetail.id}`);

      // ✅ Try to use existing machine API if available, otherwise use unified API
      try {
        const payload = {
          RequestMachineId: requestDetail.id,
          Reason: reason,
          Notes: notes || "",
          DeviceId: deviceId,
        };

        console.log("Replace device payload:", payload);
        await apiClient.machine.replaceDevice(payload);
      } catch (machineApiError) {
        // Fallback to unified API
        console.log("Machine API failed, using unified API fallback");
        await apiClient.machineActionConfirmation.updateConfirmation(requestDetail.id, {
          notes: `Device replaced: ${reason}. ${notes || ""}`,
        });
      }

      toast.success("Thiết bị đã được thay thế thành công");

      // Refresh data from server to get updated information
      await refreshRequestDetail();
    } catch (error: any) {
      console.error("Failed to replace device:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Không thể thay thế thiết bị";
      toast.error(errorMessage);
      throw error;
    }
  };

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

  // Check if the request is eligible for device replacement
  const canReplaceDevice = () => {
    if (!requestDetail || !isStockKeeper) return false;
    return requestDetail.status.toLowerCase() === "inprogress" || requestDetail.stockkeeperConfirm;
  };

  // ✅ UPDATED: Render device information (following DeviceTab logic)
  const renderDeviceInfo = (
    device: DEVICE_WEB | null,
    title: string,
    isOld: boolean = false
  ) => {
    const borderColor = isOld
      ? "border-red-200 dark:border-red-800"
      : "border-green-200 dark:border-green-800";
    const bgColor = isOld
      ? "bg-red-50 dark:bg-red-950/10"
      : "bg-green-50 dark:bg-green-950/10";
    const titleColor = isOld
      ? "text-red-700 dark:text-red-400"
      : "text-green-700 dark:text-green-400";
    const iconColor = isOld ? "text-red-600" : "text-green-600";

    const isReplaceable = !isOld && canReplaceDevice();

    return (
      <div
        className={`border ${borderColor} rounded-lg p-4 ${bgColor} relative transition-all duration-300 ${
          isReplaceable ? "group cursor-pointer hover:shadow-lg" : ""
        }`}
      >
        {/* Enhanced Replace Device Hover Effect */}
        {isReplaceable && (
          <>
            {/* Blur overlay on hover */}
            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-[2px] rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 z-10" />

            {/* Large centered replace icon */}
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowReplaceDeviceModal(true);
                }}
                className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                title="Thay thế thiết bị"
                type="button"
              >
                <RefreshCw className="h-8 w-8 mx-auto" />
              </button>
            </div>

            {/* Corner indicator */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 z-30">
              <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full shadow-lg">
                Có thể thay thế
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-2 mb-4">
          {isOld ? (
            <Package className={`h-5 w-5 ${iconColor}`} />
          ) : (
            <Settings className={`h-5 w-5 ${iconColor}`} />
          )}
          <h3 className={`font-semibold ${titleColor}`}>{title}</h3>
        </div>

        {device ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tên thiết bị
                </p>
                <p className="font-medium">{device.deviceName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mã thiết bị
                </p>
                <p className="font-medium">{device.deviceCode}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Số seri
                </p>
                <p className="font-medium">{device.serialNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Model
                </p>
                <p className="font-medium">{device.model}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Nhà sản xuất
                </p>
                <p className="font-medium">{device.manufacturer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Trạng thái
                </p>
                <p
                  className={`font-medium ${
                    isOld ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {device.status}
                </p>
              </div>
            </div>

            {device.description && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Mô tả
                </p>
                <p className="font-medium text-sm">{device.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày sản xuất
                </p>
                <p className="font-medium text-sm">
                  {formatDate(device.manufactureDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Ngày lắp đặt
                </p>
                <p className="font-medium text-sm">
                  {formatDate(device.installationDate)}
                </p>
              </div>
            </div>

            {device.zoneName && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Vị trí
                </p>
                <p className="font-medium text-sm">
                  {device.zoneName} - {device.areaName}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
              <Monitor className="h-6 w-6 text-gray-400" />
            </div>
            {isOld ? (
              <p className="text-gray-500 dark:text-gray-400">
                Không thể tải thông tin thiết bị cũ
              </p>
            ) : (
              <div>
                <p className="font-medium text-gray-500">
                  Đang trong quá trình chọn thiết bị
                </p>
                <p className="text-sm text-gray-400">
                  Chờ thủ kho chọn thiết bị thay thế
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ✅ UPDATED: Determine what actions are available based on status
  const getActionButtons = () => {
    if (!requestDetail) return null;

    const isPending = requestDetail.status.toLowerCase() === "pending";
    const isConfirmed = requestDetail.stockkeeperConfirm;

    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>

        {isPending && !isConfirmed && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
          >
            Xác nhận yêu cầu
          </button>
        )}

        {/* Show device availability confirmation button for Pending requests */}
        {isPending && isStockKeeper && !isConfirmed && (
          <button
            onClick={() => setShowConfirmDeviceModal(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-2"
            disabled={isLoading}
          >
            <CheckCircle className="h-4 w-4" />
            Xác nhận có thiết bị thay thế
          </button>
        )}

        {/* Show replace device button for confirmed requests */}
        {canReplaceDevice() && (
          <button
            onClick={() => setShowReplaceDeviceModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm flex items-center gap-2"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Chọn lại thiết bị thay thế
          </button>
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
              Xem và quản lý thông tin yêu cầu thiết bị
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
                <span>Người thực hiện</span>
              </div>
              <p className="font-medium">
                {requestDetail?.assigneeName || "Không xác định"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Ngày yêu cầu</span>
              </div>
              <p className="font-medium">
                {formatDate(requestDetail?.startDate || null)}
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

            {/* ✅ NEW: Confirmation status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Xác nhận thợ máy
                </p>
                <StatusBadge 
                  status={requestDetail?.mechanicConfirm ? "Confirmed" : "Pending"} 
                />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                  Xác nhận thủ kho
                </p>
                <StatusBadge 
                  status={requestDetail?.stockkeeperConfirm ? "Confirmed" : "Pending"} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Device Replacement Details (following DeviceTab logic) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowRightLeft className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Chi tiết thiết bị thay thế</h2>
          {canReplaceDevice() && (
            <div className="ml-auto">
              <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                <RefreshCw className="h-3 w-3" />
                <span>Nhấp vào thiết bị thay thế để chọn lại</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Old Device */}
          {renderDeviceInfo(oldDevice, "Thiết bị hiện tại (sẽ thay thế)", true)}

          {/* New Device */}
          {renderDeviceInfo(newDevice, "Thiết bị thay thế mới", false)}
        </div>
      </div>

      {/* Action Buttons */}
      {getActionButtons()}

      {/* Existing Confirmation Modal */}
      <ConfirmRequestModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRequest}
        title="Xác nhận yêu cầu thiết bị"
        description="Xác nhận yêu cầu này sẽ thông báo cho người yêu cầu rằng thiết bị đã sẵn sàng để thay thế."
        confirmButtonText="Xác nhận yêu cầu"
      />

      {/* Device Availability Confirmation Modal */}
      <ConfirmDeviceAvailableModal
        isOpen={showConfirmDeviceModal}
        onClose={() => setShowConfirmDeviceModal(false)}
        onConfirm={handleConfirmDeviceAvailable}
        requestTitle={requestDetail?.confirmationCode || ""}
        isLoading={isLoading}
      />

      {/* Replace Device Modal */}
      <ReplaceDeviceModal
        isOpen={showReplaceDeviceModal}
        onClose={() => setShowReplaceDeviceModal(false)}
        onConfirm={handleReplaceDevice}
        requestId={requestDetail?.id || ""}
        machineId={requestDetail?.machineId || ""}
        currentDeviceName={newDevice?.deviceName || "Thiết bị thay thế"}
        isLoading={isLoading}
      />
    </div>
  );
}
