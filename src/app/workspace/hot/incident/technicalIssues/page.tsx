"use client";

import { useState, useCallback, useRef } from "react";
import TechnicalIssueListCpn, { 
  TechnicalIssueListCpnRef
} from "@/components/HOTIncidentTracking/TechnicalIssueListCpn/TechnicalIssueListCpn";
import { TECHNICAL_ISSUE_WEB } from "@/types/error.type";
import { toast } from "sonner";

export default function TechnicalIssuesPage() {
  const [selectedTechnicalIssue, setSelectedTechnicalIssue] = useState<TECHNICAL_ISSUE_WEB | null>(null);
  const technicalIssueListRef = useRef<TechnicalIssueListCpnRef>(null);

  const handleEditTechnicalIssue = useCallback((issue: TECHNICAL_ISSUE_WEB) => {
    toast.info(`Edit functionality for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  const handleViewTechnicalIssue = useCallback((issue: TECHNICAL_ISSUE_WEB) => {
    toast.info(`View details for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteTechnicalIssue = useCallback((issue: TECHNICAL_ISSUE_WEB) => {
    toast.info(`Delete functionality for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <TechnicalIssueListCpn
        ref={technicalIssueListRef}
        onEditTechnicalIssue={handleEditTechnicalIssue}
        onDeleteTechnicalIssue={handleDeleteTechnicalIssue}
        onViewTechnicalIssue={handleViewTechnicalIssue}
      />
    </div>
  );
}