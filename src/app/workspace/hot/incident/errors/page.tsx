"use client";

import { useState, useCallback, useRef } from "react";
import ErrorListCpn, { ErrorListCpnRef } from "@/components/HOTIncidentTracking/ErrorListCpn/ErrorListCpn";
import { ErrorIncident } from "@/types/incident.type";
import { toast } from "sonner";

export default function ErrorsPage() {
  const [selectedError, setSelectedError] = useState<ErrorIncident | null>(null);
  const errorListRef = useRef<ErrorListCpnRef>(null);

  const handleEditError = useCallback((error: ErrorIncident) => {
    toast.info(`Edit functionality for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  const handleViewError = useCallback((error: ErrorIncident) => {
    toast.info(`View details for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteError = useCallback((error: ErrorIncident) => {
    toast.info(`Delete functionality for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ErrorListCpn
        ref={errorListRef}
        onEditError={handleEditError}
        onDeleteError={handleDeleteError}
        onViewError={handleViewError}
      />
    </div>
  );
}