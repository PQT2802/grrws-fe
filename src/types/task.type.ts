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
  AssigneeId: string;
  TaskGroupId?: string; // Task group ID for installation
  NewDeviceId: string; // New device ID to be installed
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
