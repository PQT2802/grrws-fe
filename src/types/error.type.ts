// ===== EXISTING ERROR TYPES =====
export interface CREATE_ERROR_DETAIL {
  ErrorId: string; // The ID of the request this error is associated with
  RequestId: string; // The ID of the error being created
}
export interface AddError {
  ErrorId: string[]; // The ID of the request this error is associated with
  RequestId: string; // The ID of the error being created
}
export interface ErrorFixStep {
  id: string;
  stepDescription: string;
  stepOrder: number;
}

export interface ErrorSparepart {
  sparepartId: string;
  quantityNeeded: number;
}

export interface ErrorGuideline {
  id: string;
  errorId?: string; // ✅ Add optional errorId field
  title: string;
  estimatedRepairTime: string;
  priority: string | number; // ✅ Allow both string and number
  errorFixSteps: ErrorFixStep[];
  errorSpareparts: ErrorSparepart[];
}

//INCIDENT TRACKING

// Issue Management Types
export interface ISSUE_WEB {
  id: string;
  title: string;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "InProgress" | "Resolved" | "Closed";
  reportedBy: string;
  reportedByEmail?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  reportedDate: string;
  resolvedDate?: string;
  category: string;
  location?: string;
  estimatedResolutionTime?: string;
  actualResolutionTime?: string;
  attachments?: string[];
  comments?: IssueComment[];
  relatedDeviceId?: string;
  relatedMachineId?: string;
  tags?: string[];
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

// Technical Issue Management Types
export interface TECHNICAL_ISSUE_WEB {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status:
    | "Reported"
    | "InvestigationStarted"
    | "FixInProgress"
    | "Testing"
    | "Resolved"
    | "Closed";
  deviceId?: string;
  deviceName?: string;
  deviceCode?: string;
  machineId?: string;
  machineName?: string;
  machineCode?: string;
  reportedBy: string;
  reportedByEmail?: string;
  assignedTo?: string;
  assignedToEmail?: string;
  reportedDate: string;
  resolvedDate?: string;
  systemComponent: string;
  errorCode?: string;
  rootCause?: string;
  solution?: string;
  preventionMeasures?: string;
  downTime?: number; // in minutes
  estimatedCost?: number;
  actualCost?: number;
  sparepartsUsed?: TechnicalIssueSparePart[];
  workLog?: TechnicalIssueWorkLog[];
  affectedUsers?: number;
  businessImpact?: "Low" | "Medium" | "High" | "Critical";
}

export interface TechnicalIssueSparePart {
  id: string;
  technicalIssueId: string;
  sparepartId: string;
  sparepartName: string;
  quantityUsed: number;
  cost: number;
}

export interface TechnicalIssueWorkLog {
  id: string;
  technicalIssueId: string;
  workerId: string;
  workerName: string;
  workDescription: string;
  hoursSpent: number;
  workDate: string;
  workType:
    | "Investigation"
    | "Diagnosis"
    | "Repair"
    | "Testing"
    | "Documentation";
}

// Error Log Management Types
export interface ERROR_LOG_WEB {
  id: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  severity: "Info" | "Warning" | "Error" | "Critical" | "Fatal";
  source: string; // Application, Database, Network, Hardware, etc.
  sourceDetails?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  occurredAt: string;
  resolvedAt?: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  status:
    | "New"
    | "Acknowledged"
    | "Investigating"
    | "Resolved"
    | "Ignored"
    | "Archived";
  category: string;
  subcategory?: string;
  environment: "Development" | "Testing" | "Staging" | "Production";
  serverName?: string;
  applicationVersion?: string;
  affectedFeature?: string;
  affectedEndpoint?: string;
  requestId?: string;
  correlationId?: string;
  frequency: number; // How many times this error occurred
  firstOccurred?: string;
  lastOccurred?: string;
  relatedErrorIds?: string[];
  relatedDeviceId?: string;
  relatedMachineId?: string;
  resolution?: string;
  preventionMeasures?: string;
  tags?: string[];
  customData?: Record<string, any>;
}

// Common Filter and Search Types
export interface IncidentFilter {
  search?: string;
  status?: string[];
  priority?: string[];
  severity?: string[];
  category?: string[];
  assignedTo?: string[];
  reportedBy?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  environment?: string[];
  source?: string[];
}

export interface IncidentPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface IncidentListResponse<T> {
  data: T[];
  pagination: IncidentPagination;
  filters?: IncidentFilter;
}

// Export and Import Types
export interface IncidentExportOptions {
  format: "pdf" | "excel" | "csv";
  includeDetails: boolean;
  includeComments: boolean;
  includeAttachments: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: IncidentFilter;
}

// Statistics and Dashboard Types
export interface IncidentStatistics {
  totalIssues: number;
  openIssues: number;
  inProgressIssues: number;
  resolvedIssues: number;
  totalTechnicalIssues: number;
  urgentTechnicalIssues: number;
  totalErrorLogs: number;
  criticalErrorLogs: number;
  averageResolutionTime: number; // in hours
  mostCommonCategories: CategoryStats[];
  trendData: IncidentTrendData[];
}

export interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

export interface IncidentTrendData {
  date: string;
  issues: number;
  technicalIssues: number;
  errorLogs: number;
}
