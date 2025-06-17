'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from '../components/StatusBadge';
import PartsTable from '../components/PartsTable';
import UnavailablePartsForm from '../components/UnavailablePartsForm';
import UnavailablePartsDisplay from '../components/UnavailablePartsDisplay';
import ConfirmRequestModal from '../components/ConfirmRequestModal';
import DeliveryConfirmationModal from '../components/DeliveryConfirmationModal';
import { RequestPart, UnavailablePart } from "../../type";
import { sparePartService } from '@/app/service/sparePart.service';
import { SPAREPART_REQUEST_DETAIL } from "@/types/sparePart.type";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

export default function RequestDetailPage({ params }: { params: Promise<{ "request-id": string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<SPAREPART_REQUEST_DETAIL | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestParts, setRequestParts] = useState<RequestPart[]>([]);
  
  // State for unavailable parts
  const [unavailableParts, setUnavailableParts] = useState<UnavailablePart[]>([]);
  const [showUnavailableForm, setShowUnavailableForm] = useState(false);
  const [submittedUnavailable, setSubmittedUnavailable] = useState(false);
  
  // State for form values
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [restockDate, setRestockDate] = useState("");
  
  // New state for action modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  
  // Fetch request detail
  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setIsLoading(true);
        const response = await sparePartService.getSparePartRequestDetail(requestId);
        
        console.log("Request detail full response:", response);
        
        // Handle both possible response structures
        const requestData = response.data || response;
        if (!requestData) {
          console.error("API response structure:", response);
          throw new Error("Request data not found");
        }
        
        setRequestDetail(requestData);
        
        // Transform spare parts to the format expected by PartsTable
        const parts = requestData.sparePartUsages.map(usage => ({
          id: usage.sparePartId,
          name: usage.spareparts[0]?.sparepartName || "Unknown Part",
          requested: usage.quantityUsed,
          code: usage.spareparts[0]?.sparepartCode || "",
          stockQuantity: usage.spareparts[0]?.stockQuantity || 0,
          specification: usage.spareparts[0]?.specification || "",
          isTakenFromStock: usage.isTakenFromStock,
          usageId: usage.id // Add this field for the delivery confirmation
        }));
        
        setRequestParts(parts);
        toast.success("Request details loaded successfully");
      } catch (err) {
        console.error("Failed to fetch request detail:", err);
        setError("Failed to load request details");
        toast.error("Failed to load request details");
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
      
      // Call the API to mark parts as unavailable
      await sparePartService.markPartsAsUnavailable(
        requestId,
        selectedPartIds,
        restockDate,
        reason
      );
      
      // Update local state
      const newUnavailableParts: UnavailablePart[] = selectedPartIds.map(id => ({
        id,
        reason,
        restockDate,
      }));
      
      setUnavailableParts([...unavailableParts, ...newUnavailableParts]);
      setSubmittedUnavailable(true);
      toast.success("Parts marked as unavailable");
      
      // Reset form and reload details to get updated status
      setSelectedPartIds([]);
      setReason("");
      setRestockDate("");
      setShowUnavailableForm(false);
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to update parts status:", error);
      toast.error("Failed to update parts status");
    } finally {
      setIsLoading(false);
    }
  };

  // Function to reload request detail
  const refreshRequestDetail = async () => {
    try {
      setIsLoading(true);
      const response = await sparePartService.getSparePartRequestDetail(requestId);
      const requestData = response.data || response;
      
      setRequestDetail(requestData);
      
      // Transform spare parts to the format expected by PartsTable
      const parts = requestData.sparePartUsages.map(usage => ({
        id: usage.sparePartId,
        name: usage.spareparts[0]?.sparepartName || "Unknown Part",
        requested: usage.quantityUsed,
        code: usage.spareparts[0]?.sparepartCode || "",
        stockQuantity: usage.spareparts[0]?.stockQuantity || 0,
        specification: usage.spareparts[0]?.specification || "",
        isTakenFromStock: usage.isTakenFromStock,
        usageId: usage.id
      }));
      
      setRequestParts(parts);
    } catch (err) {
      console.error("Failed to refresh request detail:", err);
      toast.error("Failed to refresh request details");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle confirming the request
  const handleConfirmRequest = async (notes: string) => {
    try {
      setIsLoading(true);
      
      await sparePartService.confirmSparePartRequest(
        requestId,
        user?.id || "", // Use the current user ID or empty string if not available
        notes
      );
      
      setShowConfirmModal(false);
      toast.success("Request confirmed successfully");
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to confirm request:", error);
      toast.error("Failed to confirm request");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle completing delivery
  const handleCompleteDelivery = async (partUsageIds: string[]) => {
    try {
      setIsLoading(true);
      
      await sparePartService.markPartsAsDelivered(partUsageIds);
      
      setShowDeliveryModal(false);
      toast.success("Parts marked as delivered");
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to mark parts as delivered:", error);
      toast.error("Failed to mark parts as delivered");
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
    router.push("../requests");
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not confirmed";
    return new Date(dateString).toLocaleString();
  };

  // Determine what actions are available based on status
  const getActionButtons = () => {
    if (!requestDetail) return null;
    
    const isUnconfirmed = requestDetail.status === "Unconfirmed";
    const isConfirmed = requestDetail.status === "Confirmed";
    
    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm"
        >
          Back to Requests
        </button>
        
        {isUnconfirmed && (
          <>
            {/* <button
              onClick={() => setShowUnavailableForm(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm"
              disabled={showUnavailableForm || submittedUnavailable}
            >
              Mark Parts as Unavailable
            </button> */}
            
            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
            >
              Confirm Request
            </button>
          </>
        )}
        
        {/* {isConfirmed && (
          <button
            onClick={() => setShowDeliveryModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
          >
            Mark as Delivered
          </button>
        )} */}
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
          <div className="text-red-500 text-lg font-medium mb-2">Error</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={goBack}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Back to Requests
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
              <span className="text-sm">Back to Requests</span>
            </button>
            <h1 className="text-xl font-bold">Request: {requestDetail?.requestCode}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage request information
            </p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">Status:</span>
            <StatusBadge status={requestDetail?.status || "Unknown"} />
          </div>
        </div>
      </div>
      
      {/* Request Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Request Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Requested by</p>
            <p className="font-medium">{requestDetail?.assigneeName || "Unknown"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Request Date</p>
            <p className="font-medium">{formatDate(requestDetail?.requestDate || null)}</p>
          </div>
          
          {requestDetail?.confirmedDate && (
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Confirmation Date</p>
              <p className="font-medium">{formatDate(requestDetail?.confirmedDate)}</p>
            </div>
          )}
          
          {requestDetail?.notes && (
            <div className="col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">Notes</p>
              <p className="font-medium">{requestDetail.notes}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Parts List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Requested Parts</h2>
          
          {requestDetail?.status === "Unconfirmed" && !submittedUnavailable && !showUnavailableForm && (
            <button
              onClick={() => setShowUnavailableForm(true)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm font-medium"
            >
              Mark Parts as Unavailable
            </button>
          )}
        </div>
        
        {/* Parts Table */}
        <PartsTable
          parts={requestParts}
          showUnavailableForm={showUnavailableForm}
          selectedPartIds={selectedPartIds}
          isPartUnavailable={isPartUnavailable}
          onTogglePartSelection={togglePartSelection}
        />
        
        {/* Unavailable Form */}
        {showUnavailableForm && (
          <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-medium mb-4">Mark Selected Parts as Unavailable</h3>
            
            <UnavailablePartsForm
              selectedPartIds={selectedPartIds}
              reason={reason}
              restockDate={restockDate}
              onReasonChange={setReason}
              onRestockDateChange={setRestockDate}
              onSubmit={handleUnavailableSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        )}
        
        {/* Unavailable Parts Display */}
        <UnavailablePartsDisplay
          unavailableParts={unavailableParts}
          parts={requestParts}
          submittedUnavailable={submittedUnavailable}
        />
      </div>
      
      {/* Action Buttons */}
      {getActionButtons()}
      
      {/* Confirmation Modal */}
      <ConfirmRequestModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRequest}
        title="Confirm Spare Part Request"
        description="Confirming this request will notify the requester that the spare parts are ready for pickup."
        confirmButtonText="Confirm Request"
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