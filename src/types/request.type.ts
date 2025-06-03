export interface REQUEST_SUMMARY {
  requestId: string;
  requestTitle: string;
  piority: string;
  status: string;
  requestDate: Date;
}
export interface REQUEST_DETAIL_WEB {
  requestId: string;
  requestTitle: string;
  priority: string; // "1": Low, "2": Medium, "3": High
  status: string; // e.g., Pending, Approved, Denied
  requestDate: string; // ISO 8601 format
  isWarranty: boolean;
  remainingWarratyDate: number;
  deviceId: string;
  deviceName: string;
  location: string;
  issues: ISSUE_FOR_REQUEST_DETAIL_WEB[];
}

export interface ISSUE_FOR_REQUEST_DETAIL_WEB {
  issueId: string;
  displayName: string;
  status: string; // e.g., Open, In Progress, Closed
  images: string[];
}

export interface ERROR_FOR_REQUEST_DETAIL_WEB {
  errorId: string;
  errorCode: string;
  name: string;
  severity?: string | null;
  status: string; // Indicates if the error has been processed
}

export interface TASK_FOR_REQUEST_DETAIL_WEB {
  taskId: string;
  taskType: string;
  status: string; // e.g., Pending, In Progress, Completed
  startTime?: string | null;
  assigneeName: string;
  expectedTime?: string | null;
  numberOfErrors?: number | null;
}
export interface TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB {
  technicalIssueId: string; // Guid → string
  symptomCode: string;
  name: string;
  description?: string; // Optional string
  isCommon: boolean;
  status: string; // Indicates if the technical issue has been processed (Unassigned/Assigned)
}
