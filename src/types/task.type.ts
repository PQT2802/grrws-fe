export interface CREATE_TASK_WEB {
  RequestId: string;
  TaskType: string; // e.g., "Repair", "Maintenance"
  StartDate: string; // ISO string format
  ErrorIds: string[]; // List of error IDs
  AssigneeId: string; // User ID of the assignee
  SparepartIds: string[]; // List of spare part IDs
}
// export interface CREATE_SIMPLE_TASK_WEB {
//   RequestId: string;
//   TaskType: string; // e.g., "Repair", "Maintenance"
//   StartDate: string; // ISO
//   AssigneeId: string; // User ID of the assignee
//   SparepartIds: string[]; // List of spare part IDs
// }

export interface SPAREPART_WEB {
  spartpartId: string;
  spartpartName: string;
  errorName: string;
  errorCode: string;
  quantityNeed: number;
  stockQuatity: number;
  unit: string;
}
// ✅ Updated CREATE_SIMPLE_TASK_WEB to match your new C# class
export interface CREATE_SIMPLE_TASK_WEB {
  RequestId: string;
  TaskType: string; // Default: "Replace"
  StartDate: string; // ISO string format
  AssigneeId: string; // User ID of the assignee

  // Device replacement details
  DeviceToRemoveId: string; // Device to be brought to repair place
  ReplacementDeviceId?: string; // New device to set up (optional if not yet assigned)
  TaskDescription?: string; // Additional notes

  // Location details
  InstallationLocation: string; // Where the replacement will happen

  // Replacement actions
  BringDeviceToRepairPlace: boolean; // Action 1 - Default: true
  SetupReplacementDevice: boolean; // Action 2 - Default: true
}
export interface CREATE_TASK_FROM_ERRORS_WEB {
  RequestId: string;
  TaskType: string; // Default: "Repair"
  StartDate: string; // ISO string format
  AssigneeId: string; // User ID of the assignee
  ErrorIds: string[]; // Required - List of error IDs
  SparepartIds?: string[]; // Optional - ONLY for errors
}
export interface CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB {
  RequestId: string;
  TaskType: string; // Default: "Warranty"
  StartDate: string; // ISO string format
  AssigneeId: string; // User ID of the assignee
  TechnicalIssueIds: string[]; // Required - List of technical issue IDs
  // NO SparepartIds - warranty tasks don't use spareparts
}
