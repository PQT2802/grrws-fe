"use client";

import { useState, useCallback, useRef } from "react";
import ErrorListCpn, { ErrorListCpnRef } from "@/components/HOTIncidentTracking/ErrorListCpn/ErrorListCpn";
import { ERROR_LOG_WEB } from "@/types/error.type";
import { toast } from "sonner";

export default function ErrorsPage() {
  const [selectedError, setSelectedError] = useState<ERROR_LOG_WEB | null>(null);
  const errorListRef = useRef<ErrorListCpnRef>(null);

  const handleEditError = useCallback((error: ERROR_LOG_WEB) => {
    toast.info(`Edit functionality for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  const handleViewError = useCallback((error: ERROR_LOG_WEB) => {
    toast.info(`View details for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteError = useCallback((error: ERROR_LOG_WEB) => {
    toast.info(`Delete functionality for error "${error.errorCode}" will be implemented when the API is available.`);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <ErrorListCpn
        ref={errorListRef}
        onEditError={handleEditError}
        onDeleteError={handleDeleteError}
        onViewError={handleViewError}
      />
    </div>
  );
}