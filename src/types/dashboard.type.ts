export interface TASK_STATISTICS {
  warrantyTasksPercentage: number;
  repairTasksPercentage: number;
  replaceTasksPercentage: number;
  totalWarrantyTasks: number;
  totalRepairTasks: number;
  totalReplaceTasks: number;
  totalTasks: number;
  totalCompletedTasks: number;
  totalPendingTasks: number;
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
  totalTasks: number;
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

export interface DASHBOARD_RESPONSE<T> {
  data: T;
}