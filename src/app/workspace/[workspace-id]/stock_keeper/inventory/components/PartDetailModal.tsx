"use client";

import { 
  X, 
  AlertTriangle, 
  Package, 
  Edit, 
  CheckCircle,
  Settings,      // For Machine Type
  Tag,           // For Category
  Truck,         // For Supplier
  DollarSign,    // For Unit Price
  FileText,      // For Description
  Wrench         // For Specification
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartDetailModalProps, PartType } from "../../type";
import UpdateQuantityModal from "./UpdateQuantityModal";
import UpdateSparePartModal from "./UpdateSparePartModal";
import { toast } from "react-toastify";
import { sparePartService } from "@/app/service/sparePart.service";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";

// Add onUpdate prop to the interface
interface ExtendedPartDetailModalProps extends PartDetailModalProps {
  onUpdate?: () => void; // Callback for when a part is updated
}

export default function PartDetailModal({ isOpen, onClose, part, onUpdate }: ExtendedPartDetailModalProps) {
  const isLowStock = part.quantity < part.minThreshold;
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showUpdateSpModal, setShowUpdateSpModal] = useState(false);
  const [originalData, setOriginalData] = useState<SPAREPART_INVENTORY_ITEM | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPart, setCurrentPart] = useState<PartType>(part);

  // Update current part when prop changes
  useEffect(() => {
    if (part) {
      setCurrentPart(part);
      console.log("PartDetailModal: Part updated:", part);
    }
  }, [part]);

  // Fetch original data for the update modal if needed
  useEffect(() => {
    if (isOpen && currentPart?.id && !originalData) {
      fetchOriginalData();
    }
  }, [isOpen, currentPart?.id]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setOriginalData(undefined);
      setShowUpdateModal(false);
      setShowUpdateSpModal(false);
    }
  }, [isOpen]);

  const fetchOriginalData = async () => {
    if (!currentPart?.id) {
      console.warn("PartDetailModal: No part ID available for fetching original data");
      return;
    }

    try {
      setIsLoading(true);
      console.log(`Fetching original data for part ID: ${currentPart.id}`);

      // Actually fetch the data from the API
      const response = await sparePartService.getSparePartById(currentPart.id);

      if (response?.data) {
        setOriginalData(response.data);
        console.log("Original data fetched successfully:", response.data);
      } else {
        console.warn("No data returned from API");
      }
    } catch (error: any) {
      console.error("Error fetching part details:", error);
      // Only show error if it's not a 404 (which might be expected for some parts)
      if (error?.status !== 404) {
        // Optionally show a toast error here
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

  // Handle form submission for quantity update
  const handleUpdateQuantitySubmit = async (data: { date: string; qty: number; method: string }) => {
    if (!currentPart?.id) {
      console.error("No part ID available for quantity update");
      return;
    }

    try {
      console.log("Updating quantity:", {
        partId: currentPart.id,
        ...data
      });
      
      // Call the actual API to update quantity
      const response = await sparePartService.updateSparePartQuantity(
        currentPart.id, 
        data.qty, 
        data.method as any, 
        data.date
      );
      
      // Update the current part state with new quantity based on the method
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
      
      toast.success(`Updated ${currentPart.name} quantity by ${data.qty} units (${data.method})`);
      
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

  // Handle success for Spare Part update - modified to call onUpdate and refresh modal data
  const handleUpdateSuccess = () => {
    console.log("Part updated successfully");
    // Close the update modal
    setShowUpdateSpModal(false);
    // Clear original data to force refresh
    setOriginalData(undefined);
    // Explicitly fetch the updated data immediately
    fetchOriginalData();
    // Call the onUpdate callback from parent to refresh data
    onUpdate?.();
    // Note: The parent will pass the updated part data, which will trigger useEffect above
  };

  if (!isOpen || !currentPart) return null;

  // Use currentPart instead of part throughout the component
  const displayPart = currentPart;
  const isCurrentLowStock = displayPart.quantity < displayPart.minThreshold;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      {/* Modal content using displayPart instead of part */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {displayPart.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image and basic info */}
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <div className="w-48 h-48 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <img
                  src={displayPart.image || "/file.svg"}
                  alt={displayPart.name}
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
                isCurrentLowStock 
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" 
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}>
                {isCurrentLowStock ? (
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
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Current Stock
                  </label>
                  <p className="text-lg font-semibold">
                    {displayPart.quantity} {displayPart.unit}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                    Min Threshold
                  </label>
                  <p className="text-lg font-semibold">
                    {displayPart.minThreshold} {displayPart.unit}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Package className="w-4 h-4" />
                  Update Stock
                </button>
                <button
                  onClick={() => setShowUpdateSpModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Edit Details
                </button>
                {/* {isLowStock && (
                  <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Order More
                  </button>
                )} */}
              </div>
            </div>
          </div>

          {/* Detailed Information - Redesigned Layout */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
              Part Details
            </h3>
            
            <div className="space-y-6">
              {/* Row 1: Machine Type & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Settings className="w-4 h-4 text-blue-500" />
                    Machine Type
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.machineType || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Tag className="w-4 h-4 text-green-500" />
                    Category
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.category || "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 2: Supplier & Unit Price */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Truck className="w-4 h-4 text-orange-500" />
                    Supplier
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.supplier || "N/A"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                    Unit Price
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.unitPrice ? `đ${displayPart.unitPrice.toFixed(2)}` : "N/A"}
                  </p>
                </div>
              </div>

              {/* Row 3: Description & Specification */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <FileText className="w-4 h-4 text-purple-500" />
                    Description
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.description || "No description available"}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <Wrench className="w-4 h-4 text-red-500" />
                    Specification
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {displayPart.specification || "No specification available"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Quantity Modal */}
      <UpdateQuantityModal
        isOpen={showUpdateModal}
        onClose={() => setShowUpdateModal(false)}
        onSubmit={handleUpdateQuantitySubmit}
        defaultMethod="Adjustment"
        currentQuantity={displayPart.quantity}
      />

      {/* Update Spare Part Modal */}
      {displayPart && (
        <UpdateSparePartModal
          isOpen={showUpdateSpModal}
          onClose={() => setShowUpdateSpModal(false)}
          onSuccess={handleUpdateSuccess}
          part={displayPart}
          originalData={originalData}
        />
      )}
    </div>
  );
}