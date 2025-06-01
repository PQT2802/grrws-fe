export interface CREATE_TASK_WEB {
  RequestId: string;
  TaskType: string; // e.g., "Repair", "Maintenance"
  StartDate: string; // ISO string format
  ErrorIds: string[]; // List of error IDs
  AssigneeId: string; // User ID of the assignee
  SparepartIds: string[]; // List of spare part IDs
}

export interface SPAREPART_WEB {
  spartpartId: string;
  spartpartName: string;
  errorName: string;
  errorCode: string;
  quantityNeed: number;
  stockQuatity: number;
  unit: string;
}
