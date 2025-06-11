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
}
export interface CREATE_INSTALL_TASK {
  RequestId: string;
  StartDate: string; // ISO string format
  AssigneeId: string;
  NewDeviceId: string; // New device ID to be installed
}
