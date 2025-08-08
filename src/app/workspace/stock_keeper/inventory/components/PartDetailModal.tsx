"use client";

import {
  X,
  AlertTriangle,
  Package,
  Edit,
  CheckCircle,
  Settings,
  Tag,
  Truck,
  DollarSign,
  FileText,
  Wrench,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import Image from "next/image"; // ✅ Add import for Next.js Image
import { PartDetailModalProps, PartType } from "../../type";
import UpdateQuantityModal from "./UpdateQuantityModal";
import UpdateSparePartModal from "./UpdateSparePartModal";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";

interface PartDetailModalPropsExtended extends PartDetailModalProps {
  isViewOnlyMode?: boolean;
}

export default function PartDetailModal({
  isOpen,
  onClose,
  part,
  onUpdate,
  partId,
  isViewOnlyMode = false,
}: PartDetailModalPropsExtended) {
  const { user } = useAuth();
  const [currentPart, setCurrentPart] = useState<PartType | null>(part || null);
  const [isLowStock, setIsLowStock] = useState(false);
  const [isOutOfStock, setIsOutOfStock] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUpdateSpModal, setShowUpdateSpModal] = useState(false);
  const [originalData, setOriginalData] = useState<
    SPAREPART_INVENTORY_ITEM | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasFullAccess =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STOCK_KEEPER;

  // Load part data when partId is provided (for direct access)
  useEffect(() => {
    if (isOpen && partId && !part) {
      console.log(
        "PartDetailModal: Loading part by ID from direct access:",
        partId
      );
      fetchPartById(partId);
    }
  }, [isOpen, partId, part]);

  // Update current part when prop changes
  useEffect(() => {
    if (part) {
      setCurrentPart(part);
      setIsLowStock(part.quantity > 0 && part.quantity < part.minThreshold);
      setIsOutOfStock(part.quantity === 0);
      console.log("PartDetailModal: Part updated:", part);
    }
  }, [part]);

  // Update stock status when currentPart changes
  useEffect(() => {
    if (currentPart) {
      setIsLowStock(
        currentPart.quantity > 0 &&
          currentPart.quantity < currentPart.minThreshold
      );
      setIsOutOfStock(currentPart.quantity === 0);
    }
  }, [currentPart]);

  // Fetch part data by ID directly from API
  const fetchPartById = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`Fetching part data for ID: ${id}`);

      const response = await apiClient.sparePart.getPartById(id);
      console.log("API response for part by ID:", response);

      let partData;
      if (response?.data?.data) {
        partData = response.data.data;
      } else if (response?.data) {
        partData = response.data;
      } else if (response) {
        partData = response;
      } else {
        throw new Error("No data returned from API");
      }

      if (partData && partData.id) {
        const convertedPart: PartType = {
          id: partData.id,
          name: partData.sparepartName,
          machineType:
            partData.machineNames?.length > 0
              ? partData.machineNames[0]
              : "Khác",
          category: partData.category || "Others",
          quantity: partData.stockQuantity,
          minThreshold: 10,
          description: partData.description || "",
          image: partData.imgUrl || "/placeholder-part.png",
          importedDate: new Date().toISOString().split("T")[0],
          unit: partData.unit || "Cái",
          specification: partData.specification || "",
          supplier: partData.supplierName || "",
          supplierId: partData.supplierId || "",
          unitPrice: partData.unitPrice || 0,
          expectedAvailabilityDate: partData.expectedAvailabilityDate
            ? new Date(partData.expectedAvailabilityDate)
                .toISOString()
                .split("T")[0]
            : "",
        };

        setCurrentPart(convertedPart);
        setOriginalData(partData);
        console.log("Part data loaded successfully:", convertedPart);
      } else {
        throw new Error("Invalid part data structure");
      }
    } catch (error: any) {
      console.error("Error fetching part data:", error);
      setError(error?.message || "Không thể tải dữ liệu linh kiện");
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced refresh function for modal data
  const refreshModalData = async (showLoadingState: boolean = true) => {
    if (!currentPart?.id) {
      console.warn("No part ID available for refreshing modal data");
      return;
    }

    try {
      if (showLoadingState) {
        setIsRefreshing(true);
      }

      console.log(`🔄 Refreshing modal data for part ID: ${currentPart.id}`);

      const response = await apiClient.sparePart.getPartById(currentPart.id);
      console.log("📊 Refreshed part data:", response);

      let partData;
      if (response?.data?.data) {
        partData = response.data.data;
      } else if (response?.data) {
        partData = response.data;
      } else if (response) {
        partData = response;
      } else {
        throw new Error("No data returned from refresh API");
      }

      if (partData && partData.id) {
        const refreshedPart: PartType = {
          id: partData.id,
          name: partData.sparepartName,
          machineType:
            partData.machineNames?.length > 0
              ? partData.machineNames[0]
              : "Khác",
          category: partData.category || "Others",
          quantity: partData.stockQuantity,
          minThreshold: 10,
          description: partData.description || "",
          image: partData.imgUrl || "/placeholder-part.png",
          importedDate: new Date().toISOString().split("T")[0],
          unit: partData.unit || "Cái",
          specification: partData.specification || "",
          supplier: partData.supplierName || "",
          supplierId: partData.supplierId || "",
          unitPrice: partData.unitPrice || 0,
          expectedAvailabilityDate: partData.expectedAvailabilityDate
            ? new Date(partData.expectedAvailabilityDate)
                .toISOString()
                .split("T")[0]
            : "",
        };

        setCurrentPart(refreshedPart);
        setOriginalData(partData);

        console.log("✅ Modal data refreshed successfully:", refreshedPart);

        onUpdate?.();
      } else {
        throw new Error("Invalid refreshed part data structure");
      }
    } catch (error: any) {
      console.error("❌ Error refreshing modal data:", error);
      toast.error("Không thể làm mới dữ liệu linh kiện");
    } finally {
      if (showLoadingState) {
        setIsRefreshing(false);
      }
    }
  };

  // Fetch original data for both Admin and Stock Keeper
  const fetchOriginalData = useCallback(async () => {
    if (!currentPart?.id || !hasFullAccess) {
      console.warn(
        "PartDetailModal: No part ID available or insufficient permissions"
      );
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Fetching original data for part ID: ${currentPart.id}`);

      const response = await apiClient.sparePart.getPartById(currentPart.id);

      if (response?.data) {
        setOriginalData(response.data);
        console.log("Original data fetched successfully:", response.data);
      } else {
        console.warn("No data returned from API");
      }
    } catch (error: any) {
      console.error("Error fetching part details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPart?.id, hasFullAccess]);

  // Fetch original data when modal opens
  useEffect(() => {
    if (isOpen && currentPart?.id && !originalData && hasFullAccess) {
      fetchOriginalData();
    }
  }, [isOpen, currentPart?.id, fetchOriginalData, originalData, hasFullAccess]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOriginalData(undefined);
      setShowUpdateModal(false);
      setShowUpdateSpModal(false);
      setError(null);
      setIsRefreshing(false);
      if (partId && !part) {
        setCurrentPart(null);
      }
    }
  }, [isOpen, partId, part]);

  // Close modal on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Enhanced quantity update with immediate modal refresh
  const handleUpdateQuantitySubmit = async (data: {
    date: string;
    qty: number;
    method: string;
  }) => {
    if (!hasFullAccess) {
      toast.error("Bạn không có quyền cập nhật số lượng tồn kho");
      return;
    }

    if (!currentPart?.id) {
      console.error("No part ID available for quantity update");
      return;
    }

    try {
      console.log("🔄 Updating quantity:", {
        partId: currentPart.id,
        ...data,
      });

      const response = await apiClient.sparePart.updateStockQuantity(
        currentPart.id,
        data.method === "Adjustment"
          ? data.qty
          : data.method === "Export"
          ? Math.max(0, currentPart.quantity - data.qty)
          : currentPart.quantity + data.qty
      );

      toast.success(`Đã cập nhật số lượng ${currentPart.name} thành công`);

      await refreshModalData(false);
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Cập nhật số lượng thất bại");
    }
  };

  // Enhanced general update success handler with immediate modal refresh
  const handleUpdateSuccess = async () => {
    if (!hasFullAccess) {
      toast.error("Bạn không có quyền cập nhật thông tin linh kiện");
      return;
    }

    console.log("🎉 Part updated successfully, refreshing modal...");
    setShowUpdateSpModal(false);

    await refreshModalData(true);

    toast.success("Thông tin linh kiện đã được cập nhật");
  };

  // Handle Update Stock button click
  const handleUpdateStockClick = () => {
    if (!hasFullAccess) {
      toast.warning("Bạn không có quyền cập nhật số lượng tồn kho");
      return;
    }
    setShowUpdateModal(true);
  };

  // Handle Edit Details button click
  const handleEditDetailsClick = () => {
    if (!hasFullAccess) {
      toast.warning("Bạn không có quyền chỉnh sửa thông tin linh kiện");
      return;
    }
    setShowUpdateSpModal(true);
  };

  if (!isOpen) return null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-foreground">
              Đang tải thông tin linh kiện...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !currentPart) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Lỗi</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  if (!currentPart) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              {currentPart.name}
            </h2>
            {isRefreshing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                <span className="text-sm">Đang cập nhật...</span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image and basic info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center">
                <Image
                  src={currentPart.image || "/file.svg"}
                  alt={currentPart.name}
                  width={192}
                  height={192}
                  className="max-h-40 max-w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes("/file.svg")) {
                      target.src = "/file.svg";
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Stock Status */}
              <div
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  isOutOfStock
                    ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    : isLowStock
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {isOutOfStock ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Hết hàng
                  </>
                ) : isLowStock ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Sắp hết hàng
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Còn hàng
                  </>
                )}
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Tồn kho hiện tại
                  </label>
                  <p className="text-lg font-semibold text-foreground">
                    {currentPart.quantity} {currentPart.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Ngưỡng tối thiểu
                  </label>
                  <p className="text-lg font-semibold text-foreground">
                    {currentPart.minThreshold} {currentPart.unit}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              {hasFullAccess && (
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateStockClick}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Package className="w-4 h-4" />
                    Cập nhật tồn kho
                  </button>
                  <button
                    onClick={handleEditDetailsClick}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Edit className="w-4 h-4" />
                    Chỉnh sửa thông tin
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-medium text-foreground mb-6">
              Thông tin chi tiết
            </h3>

            <div className="space-y-6">
              {/* Row 1: Machine Type & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Settings className="w-4 h-4 text-blue-500" />
                    Loại máy
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.machineType || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="w-4 h-4 text-green-500" />
                    Danh mục
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.category || "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 2: Supplier & Unit Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Truck className="w-4 h-4 text-orange-500" />
                    Nhà cung cấp
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.supplier || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Đơn giá
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.unitPrice
                      ? `${currentPart.unitPrice.toLocaleString("vi-VN")} đ`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 3: Description & Specification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Mô tả
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.description || "Không có mô tả"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wrench className="w-4 h-4 text-red-500" />
                    Thông số kỹ thuật
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.specification || "Không có thông số"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Quantity Modal */}
      {hasFullAccess && (
        <UpdateQuantityModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateQuantitySubmit}
          defaultMethod="Adjustment"
          currentQuantity={currentPart.quantity}
        />
      )}

      {/* Update Spare Part Modal */}
      {hasFullAccess && currentPart && (
        <UpdateSparePartModal
          isOpen={showUpdateSpModal}
          onClose={() => setShowUpdateSpModal(false)}
          onSuccess={handleUpdateSuccess}
          part={currentPart}
          originalData={originalData}
        />
      )}
    </div>
  );
}
