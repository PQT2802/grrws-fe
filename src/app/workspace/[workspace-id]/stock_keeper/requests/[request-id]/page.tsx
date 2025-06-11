'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from '../components/StatusBadge';
import PartsTable from '../components/PartsTable';
import UnavailablePartsForm from '../components/UnavailablePartsForm';
import UnavailablePartsDisplay from '../components/UnavailablePartsDisplay';
import { RequestPart, UnavailablePart } from "../../type";
import { sparePartService } from '@/app/service/sparePart.service';
import { SPAREPART_REQUEST_DETAIL } from "@/types/sparePart.type";
import { Skeleton } from "@/components/ui/skeleton";

export default function RequestDetailPage({ params }: { params: Promise<{ "request-id": string }> }) {
  const router = useRouter();
  // Use React.use() to unwrap the Promise
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];
  
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<SPAREPART_REQUEST_DETAIL | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Convert API data to RequestPart format
  const [requestParts, setRequestParts] = useState<RequestPart[]>([]);
  
  // State for unavailable parts
  const [unavailableParts, setUnavailableParts] = useState<UnavailablePart[]>([]);
  const [showUnavailableForm, setShowUnavailableForm] = useState(false);
  const [submittedUnavailable, setSubmittedUnavailable] = useState(false);
  
  // State for form values
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [restockDate, setRestockDate] = useState("");
  
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
          isTakenFromStock: usage.isTakenFromStock
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
  
  // Handle form submission
  const handleUnavailableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newUnavailableParts: UnavailablePart[] = selectedPartIds.map(id => ({
      id,
      reason,
      restockDate,
    }));
    
    setUnavailableParts([...unavailableParts, ...newUnavailableParts]);
    setSubmittedUnavailable(true);
    toast.success("Parts marked as unavailable");
    
    // Reset form
    setSelectedPartIds([]);
    setReason("");
    setRestockDate("");
    setShowUnavailableForm(false);
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
          
          {!submittedUnavailable && !showUnavailableForm && (
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
      <div className="flex justify-end">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm mr-2"
        >
          Back to Requests
        </button>
        <button
          className="px-4 py-2 bg-primary text-white rounded text-sm"
          onClick={() => {
            // Here you would implement the actual status update API call
            toast.success(`${requestDetail?.requestCode} marked as delivered`);
          }}
        >
          Mark as Delivered
        </button>
      </div>
    </div>
  );
}