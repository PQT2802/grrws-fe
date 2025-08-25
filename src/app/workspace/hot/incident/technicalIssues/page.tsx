"use client";

import { useState, useCallback, useRef } from "react";
import TechnicalIssueListCpn, { 
  TechnicalIssueListCpnRef
} from "@/components/HOTIncidentTracking/TechnicalIssueListCpn/TechnicalIssueListCpn";
import { TechnicalIssue } from "@/types/incident.type";
import { toast } from "sonner";

export default function TechnicalIssuesPage() {
  const [selectedTechnicalIssue, setSelectedTechnicalIssue] = useState<TechnicalIssue | null>(null);
  const technicalIssueListRef = useRef<TechnicalIssueListCpnRef>(null);

  const handleEditTechnicalIssue = useCallback((issue: TechnicalIssue) => {
    toast.info(`Edit functionality for "${issue.name}" will be implemented when the API is available.`);
  }, []);

  const handleViewTechnicalIssue = useCallback((issue: TechnicalIssue) => {
    toast.info(`View details for "${issue.name}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteTechnicalIssue = useCallback((issue: TechnicalIssue) => {
    toast.info(`Delete functionality for "${issue.name}" will be implemented when the API is available.`);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <TechnicalIssueListCpn
        ref={technicalIssueListRef}
        onEditTechnicalIssue={handleEditTechnicalIssue}
        onDeleteTechnicalIssue={handleDeleteTechnicalIssue}
        onViewTechnicalIssue={handleViewTechnicalIssue}
      />
    </div>
  );
}