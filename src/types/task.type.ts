export interface SPAREPART_WEB {
  spartpartId: string;
  spartpartName: string;
  errorName: string;
  errorCode: string;
  quantityNeed: number;
  stockQuatity: number;
  unit: string;
}
export interface CREATE_REPAIR_TASK {
  RequestId: string;
  StartDate: string; // ISO string format
  AssigneeId: string; // User ID of the assignee
  ErrorGuidelineIds: string[]; // Required - List of error IDs
}

export interface CREATE_SINGLE_TASK {
  DeviceId: string; // Device ID to which the task is related
  AssigneeId?: string | null; // User ID of the assignee, can be null if not assigned yet
  StartDate: string; // ISO string format
  TaskType: "Repair" | "Warranty" | "Replacement"; // Type of the task (e.g., "Uninstallation", "Installation", "Repair")
}

export interface CREATE_WARRANTY_TASK {
  RequestId: string;
  StartDate: string; // ISO string format
  DeviceWarrantyId: string; // Device warranty ID
  AssigneeId: string; // User ID of the assignee
  TechnicalIssueIds: string[]; // Required - List of technical issue IDs
}
export interface CREATE_UNINSTALL_TASK {
  RequestId: string;
  StartDate: string; // ISO string format
  AssigneeId: string;
  TaskGroupId?: string; // Task group ID for uninstallation
}
export interface CREATE_INSTALL_TASK {
  RequestId: string;
  StartDate: string; // ISO string format
  AssigneeId?: string | null; // User ID of the assignee, can be null if not assigned yet
  TaskGroupId?: string; // Task group ID for installation
  NewDeviceId: string; // New device ID to be installed\
  IsReintstall?: boolean; // Indicates if this is a reinstallation task
}

export interface TASK_GROUP_WEB {
  taskGroupId: string;
  groupName: string;
  groupType: string; // "Replacement", "Repair", "Warranty", etc.
  createdDate: string;
  createdByName: string | null;
  requestId: string;
  tasks: TASK_IN_GROUP[];
}

export interface TASK_IN_GROUP {
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: string; // "Uninstallation", "Installation", "Repair", etc.
  priority: string; // "Low", "Medium", "High"
  status: string; // "Pending", "In Progress", "Completed"
  orderIndex: number;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string;
  assigneeId: string;
  createdDate: string;
}

export interface TASK_GROUP_RESPONSE {
  data: TASK_GROUP_WEB[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface SINGLE_TASK_WEB {
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: string;
  priority: string;
  status: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string;
  assigneeId: string;
  createdDate: string;
  modifiedDate: string | null;
  requestId: string;
}

export interface SINGLE_TASK_RESPONSE {
  data: SINGLE_TASK_WEB[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
export interface UNINSTALL_TASK_DETAIL {
  deviceName: string;
  deviceCode: string;
  location: string;
  taskGroupName: string;
  taskId: string;
  deviceId: string;
  taskType: string;
  taskName: string;
  taskDescription: string;
  priority: string;
  status: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string | null;
}

export interface INSTALL_TASK_DETAIL {
  deviceName: string;
  deviceCode: string;
  location: string;
  taskGroupName: string;
  taskId: string;
  deviceId: string;
  taskType: string;
  taskName: string;
  taskDescription: string;
  priority: string;
  status: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string | null;
  stockOutDeviceId?: string;
  stockInDeviceId?: string;
}

export interface WARRANTY_TASK_DETAIL {
  claimNumber: string;
  warrantyProvider: string;
  warrantyCode: string;
  contractNumber: string | null;
  claimStatus: string;
  startDate: string;
  expectedReturnDate: string | null;
  actualReturnDate: string | null;
  location: string;
  resolution: string | null;
  issueDescription: string;
  warrantyNotes: string | null;
  claimAmount: number | null;
  hotNumber: string;
  taskId: string;
  deviceId: string;
  taskType: string;
  taskName: string;
  taskDescription: string;
  priority: string;
  status: string;
  startTime: string | null;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string | null;
  warrantyClaimId: string;
  isUninstallDevice: boolean; // Indicates if the task involves uninstalling a device
  documents: DOCUMENT[]; // List of documents related to the warranty claim
}

export interface DOCUMENT {
  docymentType: string; // Type of document (e.g., "Warranty Claim", "Repair Report")
  documentName: string; // Name of the document
  documentUrl: string; // URL to access the document
}

export interface CreateWarrantyReturn {
  WarrantyClaimId: string;
  AssigneeId: string;
  ActualReturnDate: string; // ISO date string
  IsEarlyReturn: boolean;
  WarrantyNotes: string;
  IsWarrantyFailed: boolean; // Indicates if the warranty claim failed
  IsReInstallOldDevice: boolean; // Indicates if the old device needs to be reinstalled
}
export interface CreateWarrantyReturnAfterDelayed {
  WarrantyClaimId: string;
  AssigneeId: string;
  ActualReturnDate: string; // ISO date string
  IsEarlyReturn: boolean;
  WarrantyNotes: string;
  IsWarrantyFailed: boolean; // Indicates if the warranty claim failed
}

export interface STAFF_TASK {
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskType: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string;
  assigneeId: string;
  createdDate: string;
  modifiedDate: string | null;
  requestId: string;
  isUninstallDevice: boolean;
}

export interface STAFF_TASK_RESPONSE {
  data: STAFF_TASK[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

// Define allowed task types
export type TaskType =
  | "Warranty"
  | "WarrantySubmission"
  | "WarrantyReturn"
  | "Repair"
  | "Replacement"
  | "Installation"
  | "Uninstallation";

// Task type mapping for tabs with proper typing
export const TASK_TYPE_MAPPING: Record<string, TaskType[]> = {
  warranty: ["Warranty", "WarrantySubmission", "WarrantyReturn"],
  repair: ["Repair"],
  replace: ["Replacement"],
  install_uninstall: ["Installation", "Uninstallation"],
};

export type TaskTabType =
  | "all"
  | "warranty"
  | "repair"
  | "replace"
  | "install_uninstall";

export interface REPAIR_TASK_DETAIL {
  taskId: string;
  taskType: string;
  taskName: string;
  taskDescription: string;
  priority: string;
  isUninstall: boolean; 
  status: string;
  startTime: string;
  expectedTime: string;
  endTime: string | null;
  assigneeName: string;
  isInstall: boolean;
  isSigned: boolean;
  errorDetails: ErrorDetail[];
  machineActionConfirmations: MachineActionConfirmation[];
}
export interface MachineActionConfirmation {
  confirmationId: string;
  confirmationCode: string;
  startDate: string | null;
  completedDate: string | null;
  requestedById: string;
  deviceId: string;
  taskId: string;
  status: string;
  actionType: string;
  reason: string;
  verificationToken: string | null;
  tokenExpiration: string | null;
  signerId: string | null;
  signerRole: string | null;
  signatureBase64: string | null;
  isSigned: boolean;
  assigneeId: string | null;
  mechanicConfirm: boolean;
  approvedById: string | null;
  approvedDate: string | null;
  stockkeeperConfirm: boolean;
  machineId: string;
  notes: string;
  deviceCondition: string | null;
  sparePartUsages: SparePartUsage[];
}

export interface ErrorDetail {
  errorId: string;
  errorCode: string;
  errorName: string;
  isDeleted: boolean;
  isFixed: boolean;
  spareParts: SparePartUsage[];
}

export interface SparePartUsage {
  sparepartId: string;
  sparepartName: string;
  quantityNeeded: number;
}

/////////////////////////////////////////////////////////////////////////////////////
