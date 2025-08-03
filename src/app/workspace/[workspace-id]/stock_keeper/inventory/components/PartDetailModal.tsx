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
  Eye,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartDetailModalProps, PartType } from "../../type";
import UpdateQuantityModal from "./UpdateQuantityModal";
import UpdateSparePartModal from "./UpdateSparePartModal";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";

interface PartDetailModalPropsExtended extends PartDetailModalProps {
  isViewOnlyMode?: boolean; // ✅ Add view-only mode prop
}

export default function PartDetailModal({ 
  isOpen, 
  onClose, 
  part, 
  onUpdate, 
  partId,
  isViewOnlyMode = false // ✅ Default to false for backward compatibility
}: PartDetailModalPropsExtended) {
  const [currentPart, setCurrentPart] = useState<PartType | null>(part || null);
  const [isLowStock, setIsLowStock] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUpdateSpModal, setShowUpdateSpModal] = useState(false);
  const [originalData, setOriginalData] = useState<SPAREPART_INVENTORY_ITEM | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load part data when partId is provided (for direct access)
  useEffect(() => {
    if (isOpen && partId && !part) {
      console.log('PartDetailModal: Loading part by ID from direct access:', partId);
      fetchPartById(partId);
    }
  }, [isOpen, partId, part]);

  // Update current part when prop changes
  useEffect(() => {
    if (part) {
      setCurrentPart(part);
      setIsLowStock(part.quantity < part.minThreshold);
      console.log("PartDetailModal: Part updated:", part);
    }
  }, [part]);

  // Update low stock status when currentPart changes
  useEffect(() => {
    if (currentPart) {
      setIsLowStock(currentPart.quantity < currentPart.minThreshold);
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
      
      // Handle different response structures
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
        // Convert API response to PartType format
        const convertedPart: PartType = {
          id: partData.id,
          name: partData.sparepartName,
          machineType: partData.machineNames?.length > 0 ? partData.machineNames[0] : "Khác",
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
            ? new Date(partData.expectedAvailabilityDate).toISOString().split('T')[0]
            : ""
        };

        setCurrentPart(convertedPart);
        setOriginalData(partData);
        console.log("Part data loaded successfully:", convertedPart);
      } else {
        throw new Error("Invalid part data structure");
      }
    } catch (error: any) {
      console.error("Error fetching part data:", error);
      console.error("Full error object:", JSON.stringify(error, null, 2));
      setError(error?.message || "Failed to load part data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch original data for the update modal if needed - Only for Stock Keeper
  useEffect(() => {
    if (isOpen && currentPart?.id && !originalData && !isViewOnlyMode) {
      fetchOriginalData();
    }
  }, [isOpen, currentPart?.id, isViewOnlyMode]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOriginalData(undefined);
      setShowUpdateModal(false);
      setShowUpdateSpModal(false);
      setError(null);
      if (partId && !part) {
        setCurrentPart(null); // Reset when closing direct access modal
      }
    }
  }, [isOpen, partId, part]);

  const fetchOriginalData = async () => {
    if (!currentPart?.id || isViewOnlyMode) {
      console.warn("PartDetailModal: No part ID available or view-only mode, skipping original data fetch");
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
      if (error?.status !== 404) {
        // Only show error if it's not a 404
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  // ✅ Handle form submission for quantity update - Only for Stock Keeper
  const handleUpdateQuantitySubmit = async (data: { date: string; qty: number; method: string }) => {
    if (isViewOnlyMode) {
      toast.error("You don't have permission to update stock quantities");
      return;
    }

    if (!currentPart?.id) {
      console.error("No part ID available for quantity update");
      return;
    }

    try {
      console.log("Updating quantity:", {
        partId: currentPart.id,
        ...data
      });
      
      // Call the API directly to update quantity
      const response = await apiClient.sparePart.updateStockQuantity(
        currentPart.id, 
        data.method === 'Adjustment' ? data.qty : (
          data.method === 'Export' ? Math.max(0, currentPart.quantity - data.qty) : currentPart.quantity + data.qty
        )
      );
      
      // Update the current part state with new quantity
      let newQuantity = currentPart.quantity;
      if (data.method === 'Export') {
        newQuantity = Math.max(0, currentPart.quantity - data.qty);
      } else if (data.method === 'Import') {
        newQuantity = currentPart.quantity + data.qty;
      } else if (data.method === 'Adjustment') {
        newQuantity = data.qty;
      }
      
      const updatedPart = {
        ...currentPart,
        quantity: newQuantity
      };
      setCurrentPart(updatedPart);
      
      toast.success(`Updated ${currentPart.name} quantity by ${data.qty} units`);
      
      // Reload the original data to ensure we're showing the latest data
      setOriginalData(undefined);
      fetchOriginalData();
      
      // Trigger parent refresh
      onUpdate?.();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity");
    }
  };

  // ✅ Handle success for Spare Part update - Only for Stock Keeper
  const handleUpdateSuccess = () => {
    if (isViewOnlyMode) {
      toast.error("You don't have permission to update spare part details");
      return;
    }

    console.log("Part updated successfully");
    setShowUpdateSpModal(false);
    setOriginalData(undefined);
    fetchOriginalData();
    onUpdate?.();
  };

  // ✅ Handle Update Stock button click
  const handleUpdateStockClick = () => {
    if (isViewOnlyMode) {
      toast.warning("You don't have permission to update stock quantities");
      return;
    }
    setShowUpdateModal(true);
  };

  // ✅ Handle Edit Details button click
  const handleEditDetailsClick = () => {
    if (isViewOnlyMode) {
      toast.warning("You don't have permission to edit spare part details");
      return;
    }
    setShowUpdateSpModal(true);
  };

  if (!isOpen) return null;

  // Show loading state
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-4 text-lg text-foreground">Loading part details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !currentPart) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
        <div className="bg-card rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
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
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!currentPart) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              {currentPart.name}
            </h2>
            {/* ✅ View-Only Mode Indicator */}
            {isViewOnlyMode && (
              <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-sm">
                <Shield className="h-3 w-3" />
                <span>View Only</span>
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
                <img
                  src={currentPart.image || "/file.svg"}
                  alt={currentPart.name}
                  className="max-h-40 max-w-full object-contain"
                  onError={(e) => {
                    if (!e.currentTarget.src.includes("file.svg")) {
                      e.currentTarget.src = "/file.svg";
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-4">
              {/* Stock Status */}
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                isLowStock 
                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" 
                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              }`}>
                {isLowStock ? (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Low Stock
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    In Stock
                  </>
                )}
              </div>

              {/* Key Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Current Stock
                  </label>
                  <p className="text-lg font-semibold text-foreground">
                    {currentPart.quantity} {currentPart.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Min Threshold
                  </label>
                  <p className="text-lg font-semibold text-foreground">
                    {currentPart.minThreshold} {currentPart.unit}
                  </p>
                </div>
              </div>

              {/* ✅ Action Buttons - Only for Stock Keeper */}
              {!isViewOnlyMode && (
                <div className="flex gap-3">
                  <button
                    onClick={handleUpdateStockClick}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    Update Stock
                  </button>
                  <button
                    onClick={handleEditDetailsClick}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Details
                  </button>
                </div>
              )}

              {/* ✅ View-Only Message for Admin */}
              {isViewOnlyMode && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm">
                  <Eye className="w-4 h-4" />
                  <span>You have view-only access to this spare part information.</span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Information */}
          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-medium text-foreground mb-6">
              Part Details
            </h3>
            
            <div className="space-y-6">
              {/* Row 1: Machine Type & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Settings className="w-4 h-4 text-blue-500" />
                    Machine Type
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.machineType || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Tag className="w-4 h-4 text-green-500" />
                    Category
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
                    Supplier
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.supplier || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Unit Price
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.unitPrice ? `đ${currentPart.unitPrice.toFixed(2)}` : "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 3: Description & Specification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Description
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.description || "No description available"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Wrench className="w-4 h-4 text-red-500" />
                    Specification
                  </label>
                  <p className="text-sm text-foreground">
                    {currentPart.specification || "No specification available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Update Quantity Modal - Only for Stock Keeper */}
      {!isViewOnlyMode && (
        <UpdateQuantityModal
          isOpen={showUpdateModal}
          onClose={() => setShowUpdateModal(false)}
          onSubmit={handleUpdateQuantitySubmit}
          defaultMethod="Adjustment"
          currentQuantity={currentPart.quantity}
        />
      )}

      {/* ✅ Update Spare Part Modal - Only for Stock Keeper */}
      {!isViewOnlyMode && currentPart && (
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