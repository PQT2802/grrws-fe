'use client';

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import StatusBadge from '../components/StatusBadge';
import PartsTable from '../components/PartsTable';
import UnavailablePartsForm from '../components/UnavailablePartsForm';
import UnavailablePartsDisplay from '../components/UnavailablePartsDisplay';
import { RequestDetail, UnavailablePart } from "../../type";

// Mock data for a single request
const mockRequestDetail: RequestDetail = {
  id: "REQ-001",
  date: "2025-06-08",
  requestedBy: "Nguyen Van A (Mechanic)",
  parts: [
    { id: "P-001", name: "Needle Bar", requested: 2 },
    { id: "P-002", name: "Thread Guide", requested: 1 },
    { id: "P-003", name: "Presser Foot", requested: 3 },
  ],
  status: "Pending",
};

export default function RequestDetailPage({ params }: { params: Promise<{ "request-id": string }>}) {
  const router = useRouter();
  const {"request-id": requestId} = React.use(params);
  
  // State for unavailable parts
  const [unavailableParts, setUnavailableParts] = useState<UnavailablePart[]>([]);
  const [showUnavailableForm, setShowUnavailableForm] = useState(false);
  const [submittedUnavailable, setSubmittedUnavailable] = useState(false);
  
  // State for form values
  const [selectedPartIds, setSelectedPartIds] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [restockDate, setRestockDate] = useState("");
  
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
            <h1 className="text-xl font-bold">Request Detail: {requestId}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              View and manage request information
            </p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm text-gray-500">Status:</span>
            <StatusBadge status={mockRequestDetail.status} />
          </div>
        </div>
      </div>
      
      {/* Request Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Request Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Requested by</p>
            <p className="font-medium">{mockRequestDetail.requestedBy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Request Date</p>
            <p className="font-medium">{mockRequestDetail.date}</p>
          </div>
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
          parts={mockRequestDetail.parts}
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
          parts={mockRequestDetail.parts}
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
          onClick={() => alert("Status updated!")}
        >
          Mark as Delivered
        </button>
      </div>
    </div>
  );
}