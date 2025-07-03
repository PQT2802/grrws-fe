export interface TASK_STATISTICS {
  warrantyTasksPercentage: number;
  repairTasksPercentage: number;
  replaceTasksPercentage: number;
  warrantySubmissionTasksPercentage: number;
  warrantyReturnTasksPercentage: number;
  uninstallationTasksPercentage: number;
  installationTasksPercentage: number;
  storageReturnTasksPercentage: number;
  totalWarrantyTasks: number;
  totalRepairTasks: number;
  totalReplaceTasks: number;
  totalWarrantySubmissionTasks: number;
  totalWarrantyReturnTasks: number;
  totalUninstallationTasks: number;
  totalInstallationTasks: number;
  totalStorageReturnTasks: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalPendingTasks: number;
  totalInProgressTasks: number;
}

export interface DEVICE_STATISTICS {
  totalDevices: number;
  totalActiveDevices: number;
  totalInUseDevices: number;
  totalInRepairDevices: number;
  totalInWarrantyDevices: number;
  totalDecommissionedDevices: number;
  totalDevicesWarrantyValid: number;
  totalDevicesWarrantyExpired: number;
}

export interface TASK_REQUEST_REPORT_TOTAL {
  totalMachines: number;
  totalRequests: number;
  totalReports: number;
}

export interface USER_COUNT_BY_ROLE {
  totalUsers: number;
  totalMechanics: number;
  totalStockKeepers: number;
  totalAdmins: number;
  totalHeadsOfDepartment: number;
  totalHeadsOfTechnical: number;
}

export interface TASK_COMPLETION_COUNT {
  totalTasksThisWeek: number;
  totalTasksThisMonth: number;
}

export interface TOP_ERROR_DEVICE {
  deviceId: string;
  deviceName: string;
  errorCount: number;
}

export interface TOP_MECHANIC {
  mechanicId: string;
  mechanicName: string;
  completedTaskCount: number;
}

export interface MONTHLY_REQUEST_COUNT {
  monthYear: string;
  requestCount: number;
}

export interface DASHBOARD_RESPONSE<T> {
  data: T;
}

export interface REQUEST_ITEM {
  id: string;
  reportId: string | null; 
  deviceId: string;
  deviceName: string;
  deviceCode: string;
  positionIndex: number;
  zoneName: string;
  areaName: string;
  requestDate: string;
  requestTitle: string;
  description: string;
  status: string;
  priority: string;
  createdDate: string;
  createdBy: string;
  issues: {
    id: string;
    displayName: string;
    imageUrls: string[];
  }[];
}

export interface REQUEST_WITH_REPORT extends REQUEST_ITEM {
  reportId: string; 
}

export interface REQUEST_WITHOUT_REPORT extends Omit<REQUEST_ITEM, 'reportId'> {
  reportId: null;
}

// Paginated response for all requests
export interface ALL_REQUESTS_RESPONSE {
  data: {
    data: REQUEST_ITEM[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
}

export interface REQUESTS_WITH_REPORT_RESPONSE {
  data: REQUEST_WITH_REPORT[];
}