"use client";

import { useState, useCallback, useRef } from "react";
import IssueListCpn, { IssueListCpnRef } from "@/components/HOTIncidentTracking/IssueListCpn/IssueListCpn";
import { ISSUE_WEB } from "@/types/error.type";
import { toast } from "sonner";

export default function IssuesPage() {
  const [selectedIssue, setSelectedIssue] = useState<ISSUE_WEB | null>(null);
  const issueListRef = useRef<IssueListCpnRef>(null);

  const handleEditIssue = useCallback((issue: ISSUE_WEB) => {
    toast.info(`Edit functionality for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  const handleViewIssue = useCallback((issue: ISSUE_WEB) => {
    toast.info(`View details for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteIssue = useCallback((issue: ISSUE_WEB) => {
    toast.info(`Delete functionality for "${issue.title}" will be implemented when the API is available.`);
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6">
      <IssueListCpn
        ref={issueListRef}
        onEditIssue={handleEditIssue}
        onDeleteIssue={handleDeleteIssue}
        onViewIssue={handleViewIssue}
      />
    </div>
  );
}