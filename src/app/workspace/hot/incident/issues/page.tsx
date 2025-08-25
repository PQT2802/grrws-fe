"use client";

import { useState, useCallback, useRef } from "react";
import IssueListCpn, { IssueListCpnRef } from "@/components/HOTIncidentTracking/IssueListCpn/IssueListCpn";
import { Issue } from "@/types/incident.type";
import { toast } from "sonner";

export default function IssuesPage() {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const issueListRef = useRef<IssueListCpnRef>(null);

  const handleEditIssue = useCallback((issue: Issue) => {
    toast.info(`Edit functionality for "${issue.displayName}" will be implemented when the API is available.`);
  }, []);

  const handleViewIssue = useCallback((issue: Issue) => {
    toast.info(`View details for "${issue.displayName}" will be implemented when the API is available.`);
  }, []);

  const handleDeleteIssue = useCallback((issue: Issue) => {
    toast.info(`Delete functionality for "${issue.displayName}" will be implemented when the API is available.`);
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