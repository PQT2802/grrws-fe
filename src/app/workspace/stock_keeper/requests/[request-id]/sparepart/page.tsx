'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, Wrench, Package, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from '../../components/StatusBadge';
import PartsTable from '../../components/sparepart/PartsTable';
import UnavailablePartsForm from '../../components/sparepart/UnavailablePartsForm';
import UnavailablePartsDisplay from '../../components/sparepart/UnavailablePartsDisplay';
import ConfirmRequestModal from '../../components/sparepart/ConfirmRequestModal';
import DeliveryConfirmationModal from '../../components/sparepart/DeliveryConfirmationModal';
import { UnavailablePart } from "../../../type";
import { apiClient } from '@/lib/api-client';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ✅ NEW: Extended RequestPart interface to include full spare part details
interface RequestPart {
  id: string;
  name: string;
  requested: number;
  code: string;
  stockQuantity: number;
  specification: string;
  isTakenFromStock: boolean;
  usageId: string;
  // ✅ NEW: Additional spare part details from API
  description?: string;
  categoryName?: string;
  unit?: string;
  warrantyPeriod?: number;
  createdDate?: string;
}

// ✅ NEW: Interface for unified machine action confirmation response
interface UnifiedSparePartRequest {
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
  // ✅ NEW: SparePartUsages array from unified API
  sparePartUsages?: {
    sparePartUsageId: string;
    sparePartId: string;
    sparepartName: string;
    quantityUsed: number;
    isTakenFromStock: boolean;
  }[];
  // Keep error details for backward compatibility
  errorDetails?: {
    errorId: string;
    errorName: string;
    spareParts?: {
      sparepartId: string;
      sparepartName: string;
      quantityNeeded: number;
      sparepartCode?: string;
      specification?: string;
      stockQuantity?: number;
    }[];
  }[];
}

export default function RequestDetailPage({ params }: { params: Promise<{ "request-id": string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<UnifiedSparePartRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestParts, setRequestParts] = useState<RequestPart[]>([]);
  const [loadingPartsDetails, setLoadingPartsDetails] = useState(false);
  
  // State for unavailable parts
  const [unavailableParts, setUnavailableParts] = useState<UnavailablePart[]>([]);
  const [showUnavailableForm, setShowUnavailableForm] = useState(false);
  const [submittedUnavailable, setSubmittedUnavailable] = useState(false);
  
  // State for form values
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [restockDate, setRestockDate] = useState("");
  
  // State for action modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  
  // ✅ NEW: Transform unified API response to spare part request format
  const transformToSparePartRequest = (unifiedData: any): UnifiedSparePartRequest => {
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
      // ✅ NEW: Map sparePartUsages from unified API
      sparePartUsages: unifiedData.sparePartUsages || [],
      // Keep error details for backward compatibility
      errorDetails: unifiedData.errorDetails || [],
    };
  };

  // ✅ NEW: Fetch full spare part details for each spare part
  const fetchSparePartDetails = async (sparePartId: string) => {
    try {
      console.log(`Fetching spare part details for ID: ${sparePartId}`);
      const sparePartDetail = await apiClient.sparePart.getPartById(sparePartId);
      return sparePartDetail;
    } catch (error) {
      console.warn(`Could not fetch spare part details for ${sparePartId}:`, error);
      return null;
    }
  };

  // ✅ NEW: Transform sparePartUsages to RequestPart format with full details
  const transformSparePartUsagesToRequestParts = async (sparePartUsages: any[]): Promise<RequestPart[]> => {
    const parts: RequestPart[] = [];
    setLoadingPartsDetails(true);
    
    try {
      // Fetch all spare part details concurrently
      const sparePartDetailsPromises = sparePartUsages.map(async (usage) => {
        const sparePartDetail = await fetchSparePartDetails(usage.sparePartId);
        return {
          usage,
          detail: sparePartDetail
        };
      });

      const sparePartResults = await Promise.allSettled(sparePartDetailsPromises);

      sparePartResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const { usage, detail } = result.value;
          
          parts.push({
            id: usage.sparePartId,
            name: usage.sparepartName,
            requested: usage.quantityUsed,
            code: detail?.sparepartCode || usage.sparePartId.substring(0, 8),
            stockQuantity: detail?.stockQuantity || 0,
            specification: detail?.specification || "",
            isTakenFromStock: usage.isTakenFromStock || false,
            usageId: usage.sparePartUsageId,
            // ✅ NEW: Additional details from full spare part API
            description: detail?.description || "",
            categoryName: detail?.categoryName || "",
            unit: detail?.unit || "",
            warrantyPeriod: detail?.warrantyPeriod || 0,
            createdDate: detail?.createdDate || "",
          });
        } else {
          // Fallback for failed requests
          const usage = sparePartUsages[index];
          parts.push({
            id: usage.sparePartId,
            name: usage.sparepartName,
            requested: usage.quantityUsed,
            code: usage.sparePartId.substring(0, 8),
            stockQuantity: 0,
            specification: "",
            isTakenFromStock: usage.isTakenFromStock || false,
            usageId: usage.sparePartUsageId,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching spare part details:", error);
      toast.error("Không thể tải đầy đủ thông tin linh kiện");
    } finally {
      setLoadingPartsDetails(false);
    }
    
    return parts;
  };

  // ✅ LEGACY: Transform error details to RequestPart format (keep for backward compatibility)
  const transformErrorDetailsToRequestParts = (errorDetails: any[]): RequestPart[] => {
    const parts: RequestPart[] = [];
    
    errorDetails.forEach((error) => {
      if (error.spareParts && error.spareParts.length > 0) {
        error.spareParts.forEach((sparePart: any) => {
          parts.push({
            id: sparePart.sparepartId,
            name: sparePart.sparepartName,
            requested: sparePart.quantityNeeded,
            code: sparePart.sparepartCode || sparePart.sparepartId.substring(0, 8),
            stockQuantity: sparePart.stockQuantity || 0,
            specification: sparePart.specification || "",
            isTakenFromStock: false,
            usageId: sparePart.sparepartId,
          });
        });
      }
    });
    
    return parts;
  };
  
  // ✅ UPDATED: Fetch request detail using unified API
  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching unified spare part request detail for ID: ${requestId}`);
        
        // ✅ Use the new unified API
        const response = await apiClient.machineActionConfirmation.getById(requestId);
        
        console.log("Unified API response:", response);
        
        // Handle both possible response structures
        const requestData = response.data || response;
        if (!requestData) {
          console.error("API response structure:", response);
          throw new Error("Request data not found");
        }

        // ✅ Verify this is a SparePartRequest
        if (requestData.actionType?.toLowerCase() !== "sparepartrequest") {
          throw new Error("This request is not a spare part request");
        }
        
        const transformedData = transformToSparePartRequest(requestData);
        setRequestDetail(transformedData);
        
        // ✅ NEW: Priority 1 - Transform sparePartUsages (from unified API)
        if (transformedData.sparePartUsages && transformedData.sparePartUsages.length > 0) {
          console.log(`Found ${transformedData.sparePartUsages.length} spare part usages in unified API`);
          const parts = await transformSparePartUsagesToRequestParts(transformedData.sparePartUsages);
          setRequestParts(parts);
        } 
        // ✅ Priority 2 - Fallback to error details (for backward compatibility)
        else if (transformedData.errorDetails && transformedData.errorDetails.length > 0) {
          console.log(`Fallback: Found ${transformedData.errorDetails.length} error details with spare parts`);
          const parts = transformErrorDetailsToRequestParts(transformedData.errorDetails);
          setRequestParts(parts);
        } 
        // ✅ Priority 3 - No spare parts found
        else {
          console.log("No spare parts found in either sparePartUsages or errorDetails");
          setRequestParts([]);
        }
        
        toast.success("Chi tiết yêu cầu đã được tải thành công");
      } catch (err) {
        console.error("Failed to fetch request detail:", err);
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
  
  // Calculate if a part is already marked unavailable
  const isPartUnavailable = (partId: string) => {
    return unavailableParts.some(p => p.id === partId);
  };
  
  // Handle selecting/deselecting parts
  const togglePartSelection = (partId: string) => {
    if (selectedPartIds.includes(partId)) {
      setSelectedPartIds(selectedPartIds.filter(id => id !== partId));
    } else {
      setSelectedPartIds([...selectedPartIds, partId]);
    }
  };
  
  // Handle form submission for unavailable parts
  const handleUnavailableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // ✅ UPDATED: Use unified API for updating status
      await apiClient.machineActionConfirmation.updateConfirmation(requestId, {
        stockkeeperConfirm: false,
        notes: `Insufficient parts: ${reason}. Expected restock: ${restockDate}`,
      });
      
      // Update local state
      const newUnavailableParts: UnavailablePart[] = selectedPartIds.map(id => ({
        id,
        reason,
        restockDate,
      }));
      
      setUnavailableParts([...unavailableParts, ...newUnavailableParts]);
      setSubmittedUnavailable(true);
      toast.success("Các linh kiện đã được đánh dấu không có sẵn");
      
      // Reset form and reload details to get updated status
      setSelectedPartIds([]);
      setReason("");
      setRestockDate("");
      setShowUnavailableForm(false);
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to update parts status:", error);
      toast.error("Không thể cập nhật trạng thái linh kiện");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Function to reload request detail using unified API
  const refreshRequestDetail = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.machineActionConfirmation.getById(requestId);
      const requestData = response.data || response;
      
      const transformedData = transformToSparePartRequest(requestData);
      setRequestDetail(transformedData);
      
      // ✅ NEW: Re-process spare parts with priority order
      if (transformedData.sparePartUsages && transformedData.sparePartUsages.length > 0) {
        const parts = await transformSparePartUsagesToRequestParts(transformedData.sparePartUsages);
        setRequestParts(parts);
      } else if (transformedData.errorDetails && transformedData.errorDetails.length > 0) {
        const parts = transformErrorDetailsToRequestParts(transformedData.errorDetails);
        setRequestParts(parts);
      } else {
        setRequestParts([]);
      }
    } catch (err) {
      console.error("Failed to refresh request detail:", err);
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
      console.error("Failed to confirm request:", error);
      toast.error("Không thể xác nhận yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle completing delivery - Keep existing logic for now
  const handleCompleteDelivery = async (partUsageIds: string[]) => {
    try {
      setIsLoading(true);
      
      // ✅ For now, use the unified API to mark as confirmed
      await apiClient.machineActionConfirmation.updateConfirmation(requestId, {
        stockkeeperConfirm: true,
        notes: "Parts delivered successfully",
      });
      
      setShowDeliveryModal(false);
      toast.success("Các linh kiện đã được đánh dấu là đã giao");
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to mark parts as delivered:", error);
      toast.error("Không thể đánh dấu linh kiện là đã giao");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowUnavailableForm(false);
    setSelectedPartIds([]);
  };
  
  // Go back to requests list
  const goBack = () => {
    router.push("../../requests");
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa xác nhận";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // ✅ UPDATED: Determine what actions are available based on status
  const getActionButtons = () => {
    if (!requestDetail) return null;
    
    const isPending = requestDetail.status.toLowerCase() === "pending";
    const isConfirmed = requestDetail.status.toLowerCase() === "confirmed" || requestDetail.stockkeeperConfirm;
    
    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
        
        {isPending && !requestDetail.stockkeeperConfirm && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
          >
            Xác nhận yêu cầu
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
      <div className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
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
            <h1 className="text-xl font-bold">Yêu cầu: {requestDetail?.confirmationCode}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xem và quản lý thông tin yêu cầu linh kiện
            </p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">Trạng thái:</span>
            <StatusBadge status={requestDetail?.status || "Unknown"} />
          </div>
        </div>
      </div>
      
      {/* Request Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Thông tin yêu cầu</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Người yêu cầu</p>
            <p className="font-medium">{requestDetail?.assigneeName || "Không xác định"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Ngày yêu cầu</p>
            <p className="font-medium">{formatDate(requestDetail?.startDate || null)}</p>
          </div>
          
          {requestDetail?.endDate && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Ngày hoàn thành</p>
              <p className="font-medium">{formatDate(requestDetail?.endDate)}</p>
            </div>
          )}
          
          {requestDetail?.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Ghi chú</p>
              <p className="font-medium">{requestDetail.notes}</p>
            </div>
          )}

          {/* ✅ NEW: Confirmation status */}
          <div className="col-span-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Xác nhận thợ máy</p>
                <Badge variant={requestDetail?.mechanicConfirm ? "default" : "secondary"}>
                  {requestDetail?.mechanicConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Xác nhận thủ kho</p>
                <Badge variant={requestDetail?.stockkeeperConfirm ? "default" : "secondary"}>
                  {requestDetail?.stockkeeperConfirm ? "Đã xác nhận" : "Chưa xác nhận"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ✅ UPDATED: Spare Parts Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Chi tiết yêu cầu linh kiện
            {loadingPartsDetails && (
              <span className="text-sm text-gray-500 ml-2">(Đang tải chi tiết...)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ✅ NEW: Show loading state for spare part details */}
          {loadingPartsDetails ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Đang tải chi tiết linh kiện...</p>
              </div>
            </div>
          ) : requestParts.length > 0 ? (
            <Tabs defaultValue="spareparts" className="mt-2">
              <TabsList className="w-full grid grid-cols-2 mb-3">
                <TabsTrigger value="spareparts">
                  Linh kiện ({requestParts.length})
                </TabsTrigger>
                <TabsTrigger value="details">
                  Chi tiết linh kiện
                </TabsTrigger>
              </TabsList>

              {/* ✅ NEW: Spare Parts List Tab */}
              <TabsContent value="spareparts">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[400px] overflow-auto">
                  <div className="space-y-3">
                    {requestParts.map((part, index) => (
                      <div
                        key={part.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="text-sm font-medium">{part.name}</div>
                            <div className="text-xs text-gray-500">
                              Mã: {part.code} • Số lượng: {part.requested}
                            </div>
                            {part.specification && (
                              <div className="text-xs text-gray-400">
                                Quy cách: {part.specification}
                              </div>
                            )}
                            {part.categoryName && (
                              <div className="text-xs text-blue-600">
                                Danh mục: {part.categoryName}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Kho: {part.stockQuantity}
                          </div>
                          <Badge variant={part.stockQuantity >= part.requested ? "default" : "destructive"} className="text-xs">
                            {part.stockQuantity >= part.requested ? "Đủ" : "Thiếu"}
                          </Badge>
                          {part.isTakenFromStock && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Đã lấy từ kho
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ✅ NEW: Detailed Parts Information Tab */}
              <TabsContent value="details">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[400px] overflow-auto">
                  <div className="grid gap-4">
                    {requestParts.map((part, index) => (
                      <div
                        key={part.id}
                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-blue-500" />
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {part.name}
                            </h4>
                          </div>
                          <Badge variant={part.isTakenFromStock ? "default" : "secondary"} className="text-xs">
                            {part.isTakenFromStock ? "Đã giao" : "Chưa giao"}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">Mã linh kiện:</span>
                            <div className="font-medium">{part.code}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Số lượng:</span>
                            <div className="font-medium">{part.requested}</div>
                          </div>
                          <div>
                            <span className="text-gray-500">Tồn kho:</span>
                            <div className="font-medium">{part.stockQuantity}</div>
                          </div>
                          {part.unit && (
                            <div>
                              <span className="text-gray-500">Đơn vị:</span>
                              <div className="font-medium">{part.unit}</div>
                            </div>
                          )}
                          {part.warrantyPeriod && part.warrantyPeriod > 0 && (
                            <div>
                              <span className="text-gray-500">Bảo hành:</span>
                              <div className="font-medium">{part.warrantyPeriod} tháng</div>
                            </div>
                          )}
                          {part.categoryName && (
                            <div>
                              <span className="text-gray-500">Danh mục:</span>
                              <div className="font-medium">{part.categoryName}</div>
                            </div>
                          )}
                        </div>
                        
                        {part.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                            <span className="text-gray-500 text-sm">Mô tả:</span>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {part.description}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center py-8 text-center">
              <div className="flex flex-col items-center max-w-md">
                <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                  Không có thông tin linh kiện
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Yêu cầu này không chứa thông tin linh kiện hoặc chưa được gán linh kiện.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      {getActionButtons()}
      
      {/* Confirmation Modal */}
      <ConfirmRequestModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRequest}
        title="Xác nhận yêu cầu linh kiện"
        description="Xác nhận yêu cầu này sẽ thông báo cho người yêu cầu rằng các linh kiện đã sẵn sàng để lấy."
        confirmButtonText="Xác nhận yêu cầu"
      />
      
      {/* Delivery Confirmation Modal */}
      <DeliveryConfirmationModal
        isOpen={showDeliveryModal}
        onClose={() => setShowDeliveryModal(false)}
        onConfirm={handleCompleteDelivery}
        parts={requestParts.map(part => ({
          id: part.id,
          name: part.name,
          code: part.code || part.id.substring(0, 8),
          quantity: part.requested,
          usageId: part.usageId || part.id 
        }))}
      />
    </div>
  );
}