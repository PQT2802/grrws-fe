import http from "@/lib/http";
import { AuthUser } from "@/types/auth.type";
import {
  SUGGEST_OBJECT_REQUEST,
  SUGGEST_OBJECT_RESPONSE,
} from "@/types/comon.type";
import { DEVICE_WEB, MACHINE_WEB } from "@/types/device.type";
import {
  AddError,
  AddTaskErrorPayload,
  CREATE_ERROR_DETAIL,
  ErrorGuideline,
} from "@/types/error.type";
import {
  REQUEST_SUMMARY,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import {
  CREATE_INSTALL_TASK,
  CREATE_REPAIR_TASK,
  CREATE_REPAIR_TASK_V2,
  CREATE_SINGLE_TASK,
  CREATE_UNINSTALL_TASK,
  CREATE_WARRANTY_TASK,
  CreateWarrantyReturn,
  CreateWarrantyReturnAfterDelayed,
  INSTALL_TASK_DETAIL,
  REPAIR_TASK_DETAIL,
  REPLACEMENT_TASK,
  SPAREPART_WEB,
  STAFF_TASK_RESPONSE,
  TASK_GROUP_RESPONSE,
  UNINSTALL_TASK_DETAIL,
  WARRANTY_TASK_DETAIL,
} from "@/types/task.type";
import { CREATE_USER_REQUEST, GET_MECHANIC_USER } from "@/types/user.type";
import {
  WARRANTY_HISTORY_LIST,
  WARRANTY_LIST,
  WarrantyInfo,
} from "@/types/warranty.type";
import {
  DASHBOARD_RESPONSE,
  TASK_STATISTICS,
  DEVICE_STATISTICS,
  TASK_REQUEST_REPORT_TOTAL,
  USER_COUNT_BY_ROLE,
  TASK_COMPLETION_COUNT,
  REQUEST_WITH_REPORT,
  REQUEST_ITEM,
  ALL_REQUESTS_RESPONSE,
  TOP_ERROR_DEVICE,
  TOP_MECHANIC,
  MONTHLY_REQUEST_COUNT,
  HOTDashboardFilteredStatsDTO,
} from "@/types/dashboard.type";
import { create } from "domain";
import {
  NOTIFICATION_RESPONSE,
  NotificationResponse,
} from "@/types/notification.type";
import { IssueResponse, TechnicalIssueResponse, ErrorIncidentResponse, ErrorIncident } from "@/types/incident.type";

class APIClient {
  // Auth methods - these are public (no token needed)
  auth = {
    signIn: (data: any) => http.postPublic("/api/Auth/sign-in", data), // ✅ Public
    signUp: (data: any) => http.postPublic("/api/Auth/sign-up", data), // ✅ Public
    refreshToken: (data: any) =>
      http.postPublic("/api/Auth/refresh-token", data), // ✅ Public
    logout: () => http.post("/api/Auth/logout", {}), // ✅ Requires auth
  };
  // User methods - these require authentication
  user = {
    getInfo: (): Promise<AuthUser> => {
      return http.get<AuthUser>("/api/User/user-infor"); // ✅ Auto token
    },

    // ✅ Method that accepts explicit token (for server-side)
    getInfoWithToken: (token: string): Promise<AuthUser> => {
      return http.get<AuthUser>("/api/User/user-infor", { jwtToken: token });
    },

    updateProfile: (data: any) => http.put("/api/User/update-profile", data), // ✅ Auto token
    changePassword: (data: any) => http.put("/api/User/change-password", data), // ✅ Auto token

    getMechanic: (): Promise<GET_MECHANIC_USER[]> => {
      return http.get<GET_MECHANIC_USER[]>("/api/User/role?role=3"); // ✅ Auto token
    },
    getUsersByRole: (role: number): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>(`/api/User/role?role=${role}`);
    },

    getUsersList: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      return http.get(
        `/api/User/users/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    createUser: (data: CREATE_USER_REQUEST): Promise<any> => {
      const payload = {
        ...data,
        Role: Number(data.Role),
      };

      console.log("Creating user with final payload:", JSON.stringify(payload));
      return http.post("/api/User", payload);
    },

    getUserById: (userId: string): Promise<any> => {
      return http.get(`/api/User?requestId=${userId}`);
    },

    updateUser: (data: any): Promise<any> => {
      console.log("Updating user with payload:", JSON.stringify(data));
      return http.put("/api/User", data);
    },

    deleteUser: (userId: string): Promise<any> => {
      console.log("Disabling user with ID:", userId);
      return http.delete(`/api/User?requestId=${userId}`);
    },
  };
  // Workspace methods (when you add them) - these require authentication
  // workspace = {
  //   getAll: () => http.get('/api/Workspace'), // ✅ Auto token
  //   getById: (id: string) => http.get(`/api/Workspace/${id}`), // ✅ Auto token
  //   create: (data: any) => http.post('/api/Workspace', data), // ✅ Auto token
  //   update: (id: string, data: any) => http.put(`/api/Workspace/${id}`, data), // ✅ Auto token
  //   delete: (id: string) => http.delete(`/api/Workspace/${id}`), // ✅ Auto token
  //   join: (data: any) => http.post('/api/Workspace/join', data), // ✅ Auto token
  // };
  request = {
    getRequestSummary: (): Promise<REQUEST_SUMMARY> => {
      return http.get<REQUEST_SUMMARY>("/api/Request/get-summary"); // ✅ Auto token
    },
    getRequestDetail: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/detail/${requestId}`); // ✅ Auto token
    },
    getRequestByDeviceId: (deviceId: string): Promise<any> => {
      console.log(
        `🔍 API Client: Fetching requests for device ID: ${deviceId}`
      );
      return http.get(`/api/Request/deviceId?id=${deviceId}`);
    },
    getErrorOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/errors/${requestId}`); // ✅ Auto token
    },
    getTaskOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/tasks/${requestId}`); // ✅ Auto token
    },
    getTechnicalIssueOfRequest: (
      requestId: string
    ): Promise<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]> => {
      return http.get<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]>(
        `/api/Request/technical-issues/${requestId}`
      );
    },
  };
  task = {
    getSpareParts: (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
      return http.post<SPAREPART_WEB[]>(
        "/api/Error/spare-parts/list",
        errorIds
      );
    },
    createRepairTask: (data: CREATE_REPAIR_TASK): Promise<any> => {
      return http.post("/api/Task/repair-task", data);
    },
    createRepairTaskV2: (data: CREATE_REPAIR_TASK_V2): Promise<any> => {
      return http.post("/api/Task/single-task", data);
    },
    createWarrantyTask: (data: CREATE_WARRANTY_TASK): Promise<any> => {
      return http.post("/api/Task/warranty-task/submit", data);
    },
    createUninstallTask: (data: CREATE_UNINSTALL_TASK): Promise<any> => {
      return http.post("/api/Task/uninstall", data);
    },
    createInstallTask: (data: CREATE_INSTALL_TASK): Promise<any> => {
      return http.post("/api/Task/install", data);
    },
    createSingleTask: (data: CREATE_SINGLE_TASK): Promise<any> => {
      return http.post("/api/Task/single-task", data);
    },
    createRepairTaskAfterWarranty: (requestId: string): Promise<any> => {
      return http.post(
        `/api/Task/repair-after-warranty?requestId=${requestId}`,
        {}
      );
    },

    createWarrantyReturnTask: (data: CreateWarrantyReturn): Promise<any> => {
      return http.post("/api/Task/warranty-task/return", data);
    },
    createWarrantyReturnTaskAfterDelayed: (
      data: CreateWarrantyReturnAfterDelayed
    ): Promise<any> => {
      return http.post("/api/Task/delayed-return/create", data);
    },
    createReplacementTask: (data: REPLACEMENT_TASK): Promise<any> => {
      return http.post("/api/Task/install-without-request", data);
    },
    getTaskGroups: (
      requestId: string,
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      return http.get(
        `/api/Task/groups/request/${requestId}?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },
    // New methods for single tasks and all task groups
    getSingleTasks: (
      pageNumber: number = 1,
      pageSize: number = 10,
      taskType?: string,
      status?: string,
      priority?: string,
      order?: string
    ): Promise<any> => {
      const params = new URLSearchParams({
        PageNumber: pageNumber.toString(),
        PageSize: pageSize.toString(),
      });

      // Only append parameters if they have actual values (not undefined and not "all")
      if (taskType && taskType !== "all") {
        params.append("TaskType", taskType);
      }
      if (status && status !== "all") {
        params.append("Status", status);
      }
      if (priority && priority !== "all") {
        params.append("Priority", priority);
      }
      if (order) {
        params.append("Order", order);
      }

      return http.get(`/api/Task/single-tasks?${params.toString()}`);
    },
    getAllTaskGroups: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<TASK_GROUP_RESPONSE> => {
      return http.get<TASK_GROUP_RESPONSE>(
        `/api/Task/groups?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },
    applySuggestedGroupTasks: (taskGroupId: string): Promise<any> => {
      return http.post(
        `/api/Task/apply-suggested-group-assignments/${taskGroupId}`,
        {}
      );
    },

    getUninstallTaskDetail: (
      taskId: string
    ): Promise<UNINSTALL_TASK_DETAIL> => {
      return http.get<UNINSTALL_TASK_DETAIL>(
        `/api/Task/uninstall-task/${taskId}`
      );
    },

    getInstallTaskDetail: (taskId: string): Promise<INSTALL_TASK_DETAIL> => {
      return http.get<INSTALL_TASK_DETAIL>(`/api/Task/install-task/${taskId}`);
    },

    getWarrantyTaskDetail: (taskId: string): Promise<WARRANTY_TASK_DETAIL> => {
      return http.get<WARRANTY_TASK_DETAIL>(
        `/api/Task/warranty-task-submit/${taskId}`
      );
    },
    getWarrantyReturnTaskDetail: (
      taskId: string
    ): Promise<WARRANTY_TASK_DETAIL> => {
      return http.get<WARRANTY_TASK_DETAIL>(
        `/api/Task/warranty-task-return/${taskId}`
      );
    },
    getRepairTaskDetail: (taskId: string): Promise<REPAIR_TASK_DETAIL> => {
      return http.get<REPAIR_TASK_DETAIL>(`/api/Task/repair-task/${taskId}`);
    },

    getSuggestedMechanics: (
      pageSize: number = 5,
      pageIndex: number = 0
    ): Promise<{
      statusCode: number;
      title: string;
      type: string;
      extensions: {
        message: string;
        data: {
          mechanicId: string;
          fullName: string;
          averageCompletionTime: string;
          expectedTime: string;
          message: string;
        }[];
      };
    }> => {
      return http.get(
        `/api/Task/mechanicshift/suggest?pageSize=${pageSize}&pageIndex=${pageIndex}`
      );
    },

    updateWarrantyClaim: (formData: FormData): Promise<any> => {
      return http.put("/api/Task/warranty-claim/update", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    },

    returnWarrantyTask: (data: {
      WarrantyClaimId: string;
      AssigneeId: string;
      ActualReturnDate: string;
      WarrantyNotes?: string;
    }): Promise<any> => {
      return http.post("/api/Task/warranty-task/return", data);
    },
    getAllSingleTasks: (
      pageNumber: number = 1,
      pageSize: number = 10,
      taskType?: string,
      status?: string,
      priority?: string
    ): Promise<STAFF_TASK_RESPONSE> => {
      const params = new URLSearchParams();
      params.append("pageNumber", pageNumber.toString());
      params.append("pageSize", pageSize.toString());

      if (taskType) params.append("taskType", taskType);
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);

      console.log(`Fetching single tasks with params: ${params.toString()}`);
      return http.get<STAFF_TASK_RESPONSE>(
        `/api/Task/single-tasks?${params.toString()}`
      );
    },
    disableTask: (taskId: string, unassignStaff: boolean = true): Promise<any> => {
      console.log(`🛑 Disabling task ${taskId} with unassignStaff=${unassignStaff}`);
      return http.put(`/api/Task/disable-task/${taskId}?unassignStaff=${unassignStaff}`, {});
    },
  };
  error = {
    getSuggestedErrors: (
      request: SUGGEST_OBJECT_REQUEST
    ): Promise<SUGGEST_OBJECT_RESPONSE[]> => {
      return http.get(
        `/api/Error/suggestions?query=${request.query}&maxResults=${request.maxResults}`
      ); // ✅ Auto token
    },
    addError: (errors: AddError): Promise<any> => {
      return http.post("/api/ErrorDetail", errors);
    },
    addTaskErrors: (payload: AddTaskErrorPayload): Promise<any> => {
      return http.put("/api/ErrorDetail/error-detail/task", payload);
    },

    addErrors: (
      taskId: string,
      payload: { ErrorIds: string[] }
    ): Promise<any> => {
      return http.post(`/api/Task/repair-task/${taskId}/add-errors`, payload);
    },
    getErrorsByDeviceId: (deviceId: string): Promise<ErrorIncident[]> => {
      return http.get<ErrorIncident[]>(`/api/Error/mapped-by-ti/${deviceId}`);
    },

    // createErrorDetail: (errorDetail: CREATE_ERROR_DETAIL): Promise<any> => {
    //   return http.post("/api/Error/create-error-detail", errorDetail);
    // },
    // getErrorGuidelines: (errorId: string): Promise<ErrorGuideline[]> => {
    //   return http.get(`/api/ErrorGuideline/by-error/${errorId}`);
    // },
    createError: (data: {
      Name: string;
      Description: string;
      EstimatedRepairTime: string;
      IsCommon: boolean;
      OccurrenceCount: number;
      Severity: string;
      IsPendingConfirmation: boolean;
      ConfirmedById?: string;
      ConfirmedDate?: string;
      IssueIds: string[];
      TechnicalSymptomIds: string[];
      SparepartMappings: Array<{
        SparepartId: string;
        QuantityNeeded: number;
      }>;
    }): Promise<any> => {
      console.log("Creating new error with data:", data);
      return http.post("/api/Error/create", data);
    },
  };
  warranty = {
    getWarrantyHistory: (
      deviceId: string
    ): Promise<WARRANTY_HISTORY_LIST[]> => {
      return http.get<WARRANTY_HISTORY_LIST[]>(
        `/api/DeviceWarranty/history/${deviceId}`
      );
    },
    getDeviceWarranties: (deviceId: string): Promise<WarrantyInfo[]> => {
      return http.get<WarrantyInfo[]>(
        `/api/DeviceWarranty/Warranties/${deviceId}`
      );
    },
  };

  device = {
    getDevices: (
      pageNumber: number,
      pageSize: number,
      filters?: {
        deviceName?: string;
        deviceCode?: string;
        status?: string;
        positionId?: string;
      }
    ): Promise<DEVICE_WEB[]> => {
      const query = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
        ...(filters?.deviceName ? { deviceName: filters.deviceName } : {}),
        ...(filters?.deviceCode ? { deviceCode: filters.deviceCode } : {}),
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.positionId ? { positionId: filters.positionId } : {}),
      });

      return http.get(`/api/Device/search?${query.toString()}`);
    },

    getDeviceById: (deviceId: string): Promise<DEVICE_WEB> => {
      return http.get<DEVICE_WEB>(`/api/Device/${deviceId}`);
    },

    // Import devices from Excel file
    importDevice: async (formData: FormData): Promise<any> => {
      console.log("Importing device from Excel file");
      try {
        const response = await http.post("/api/Device/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing devices:", error);
        throw error;
      }
    },

    // Delete device
    deleteDevice: async (deviceId: string): Promise<any> => {
      console.log(`Deleting device with ID: ${deviceId}`);
      try {
        const response = await http.delete(`/api/Device/${deviceId}`);
        return response;
      } catch (error) {
        console.error("Error deleting device:", error);
        throw error;
      }
    },
  };

  machine = {
    getMachines: (
      pageNumber: number,
      pageSize: number
    ): Promise<MACHINE_WEB[]> => {
      return http.get(
        `/api/Machine/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    // Add new method for machine replacement requests
    getReplacementRequests: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      console.log("Getting machine replacement requests");
      return http.get(
        `/api/RequestMachineReplacement/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    getReplacementRequestById: (requestId: string): Promise<any> => {
      console.log(`Getting machine replacement request by ID: ${requestId}`);
      return http.get(`/api/RequestMachineReplacement/${requestId}`);
    },

    // Confirm device available for machine replacement request
    confirmDeviceAvailable: (requestId: string): Promise<any> => {
      console.log(
        `Confirming device available for machine replacement request: ${requestId}`
      );
      return http.put(
        `/api/RequestMachineReplacement/confirm-had-device/${requestId}`,
        {}
      );
    },

    // Import machines from Excel file
    importMachine: async (formData: FormData): Promise<any> => {
      console.log("Importing machine from Excel file");
      try {
        const response = await http.post("/api/Machine/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing machines:", error);
        throw error;
      }
    },

    // Delete machine
    deleteMachine: async (machineId: string): Promise<any> => {
      console.log(`Deleting machine with ID: ${machineId}`);
      try {
        const response = await http.delete(`/api/Machine/delete/${machineId}`);
        return response;
      } catch (error) {
        console.error("Error deleting machine:", error);
        throw error;
      }
    },

    // Replace device in machine replacement request
    replaceDevice: (data: {
      RequestMachineId: string;
      Reason: string;
      Notes?: string;
      DeviceId: string;
    }): Promise<any> => {
      console.log(
        `Replacing device for machine replacement request with data:`,
        data
      );
      return http.put(`/api/RequestMachineReplacement`, data);
    },

    // Get active devices by machine ID for replacement selection
    getActiveDevicesByMachineId: (machineId: string): Promise<DEVICE_WEB[]> => {
      console.log(`Getting active devices for machine ID: ${machineId}`);
      return http.get<DEVICE_WEB[]>(
        `/api/Device/by-machine/${machineId}?status=Active`
      );
    },
  };

  sparePart = {
    getRequests: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      console.log("Getting all spare part requests");
      return http.get(
        `/api/SparePartUsage/requests?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    getRequestById: (requestId: string): Promise<any> => {
      console.log(`Getting spare part request by ID: ${requestId}`);
      return http.get(`/api/SparePartUsage/requests/${requestId}`);
    },

    getInventory: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<SPAREPART_INVENTORY_ITEM[]> => {
      return http.get<SPAREPART_INVENTORY_ITEM[]>(
        `/api/Sparepart?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    importSparePart: async (formData: FormData): Promise<any> => {
      console.log("Importing spare parts from Excel file");
      try {
        const response = await http.post("/api/Sparepart/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing spare parts:", error);
        throw error;
      }
    },

    updateSparePart: async (id: string, jsonData: any): Promise<any> => {
      console.log(`Updating spare part with ID ${id} to external API`);
      try {
        console.log("Sending update data:", jsonData);
        const response = await http.put(`/api/Sparepart/${id}`, jsonData);
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    getPartById: async (id: string): Promise<any> => {
      console.log(`API Client: Getting spare part by ID: ${id}`);
      return http.get(`/api/Sparepart/${id}`);
    },

    updateStockQuantity: async (
      sparePartId: string,
      stockQuantity: number
    ): Promise<any> => {
      console.log(
        `Updating stock quantity for spare part with ID: ${sparePartId}`
      );
      try {
        const response = await http.put(
          "/api/Sparepart/update-stock-quantity",
          {
            SparepartId: sparePartId,
            StockQuantity: stockQuantity,
          }
        );
        return response;
      } catch (error) {
        console.error("Error in external API call:", error);
        throw error;
      }
    },

    // Update request status
    updateStatus: async (
      requestId: string,
      confirmedById: string,
      notes: string
    ): Promise<any> => {
      console.log(`Updating request status to Confirmed: ${requestId}`);
      return http.put("/api/SparePartUsage/update-status", {
        RequestTakeSparePartUsageId: requestId,
        Status: "Confirmed",
        ConfirmedById: confirmedById,
        Notes: notes,
      });
    },

    // Update insufficient status (mark parts as unavailable)
    updateInsufficientStatus: async (
      requestId: string,
      sparePartIds: string[],
      expectedAvailabilityDate: string,
      notes: string
    ): Promise<any> => {
      console.log(
        `Marking spare parts as unavailable for request: ${requestId}`
      );
      return http.put("/api/SparePartUsage/update-insufficient-status", {
        RequestTakeSparePartUsageId: requestId,
        SparePartIds: sparePartIds,
        ExpectedAvailabilityDate: expectedAvailabilityDate,
        Notes: notes,
      });
    },

    // Mark spare parts as taken from stock (delivered)
    updateTakenFromStock: async (sparePartUsageIds: string[]): Promise<any> => {
      console.log(
        `Marking spare parts as delivered: ${sparePartUsageIds.join(", ")}`
      );
      return http.put("/api/SparePartUsage/update-taken-from-stock", {
        SparePartUsageIds: sparePartUsageIds,
        IsTakenFromStock: true,
      });
    },
  };

  // NEW: Machine Action Confirmation API
  machineActionConfirmation = {
    getAll: (
      pageNumber: number = 1,
      pageSize: number = 10,
      isAscending: boolean = true,
      status?: string,
      actionType?: string
    ): Promise<any> => {
      console.log(
        `Getting machine action confirmations (page ${pageNumber}, size ${pageSize})`
      );

      const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
        isAscending: isAscending.toString(),
      });

      if (status && status !== "all") {
        params.append("status", status);
      }

      if (actionType && actionType !== "all") {
        params.append("actionType", actionType);
      }

      return http.get(
        `/api/MachineActionConfirmation/search?${params.toString()}`
      );
    },

    getById: (requestId: string): Promise<any> => {
      console.log(`Getting machine action confirmation by ID: ${requestId}`);
      return http.get(`/api/MachineActionConfirmation/${requestId}`);
    },

    // Update confirmation status
    updateConfirmation: async (
      requestId: string,
      data: {
        mechanicConfirm?: boolean;
        stockkeeperConfirm?: boolean;
        notes?: string;
      }
    ): Promise<any> => {
      console.log(`Updating machine action confirmation: ${requestId}`);
      return http.put(`/api/MachineActionConfirmation/${requestId}`, data);
    },
  };

  dashboard = {
    getTechnicalHeadStats: (): Promise<any> => {
      return http.get("/api/Dashboard/technical-head-stats");
    },

    getTaskStatistics: (): Promise<DASHBOARD_RESPONSE<TASK_STATISTICS>> => {
      console.log("Fetching task statistics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_STATISTICS>>(
        "/api/Dashboard/get-task-statistics"
      );
    },

    getDeviceStatistics: (): Promise<DASHBOARD_RESPONSE<DEVICE_STATISTICS>> => {
      console.log("Fetching device statistics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<DEVICE_STATISTICS>>(
        "/api/Dashboard/get-device-statistics"
      );
    },

    getTaskRequestReportTotal: (): Promise<
      DASHBOARD_RESPONSE<TASK_REQUEST_REPORT_TOTAL>
    > => {
      console.log("Fetching task/request/report totals from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_REQUEST_REPORT_TOTAL>>(
        "/api/Dashboard/get-total-task-request-report"
      );
    },

    getUserCountByRole: (): Promise<DASHBOARD_RESPONSE<USER_COUNT_BY_ROLE>> => {
      console.log("Fetching user counts by role from dashboard API");
      return http.get<DASHBOARD_RESPONSE<USER_COUNT_BY_ROLE>>(
        "/api/Dashboard/get-total-user-by-role"
      );
    },

    getTaskCompletionCount: (): Promise<
      DASHBOARD_RESPONSE<TASK_COMPLETION_COUNT>
    > => {
      console.log("Fetching task completion counts from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TASK_COMPLETION_COUNT>>(
        "/api/Dashboard/get-task-completion-count-by-week-and-month"
      );
    },

    // New API methods for the 3 charts
    getTopErrorDevices: (): Promise<DASHBOARD_RESPONSE<TOP_ERROR_DEVICE[]>> => {
      console.log("Fetching top 5 most error-prone devices from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TOP_ERROR_DEVICE[]>>(
        "/api/Dashboard/get-top-5-most-error-devices"
      );
    },

    getTopMechanics: (): Promise<DASHBOARD_RESPONSE<TOP_MECHANIC[]>> => {
      console.log("Fetching top 3 best mechanics from dashboard API");
      return http.get<DASHBOARD_RESPONSE<TOP_MECHANIC[]>>(
        "/api/Dashboard/get-top-3-mechanics"
      );
    },

    getMonthlyRequestCount: (): Promise<
      DASHBOARD_RESPONSE<MONTHLY_REQUEST_COUNT[]>
    > => {
      console.log(
        "Fetching monthly request count for last 6 months from dashboard API"
      );
      return http.get<DASHBOARD_RESPONSE<MONTHLY_REQUEST_COUNT[]>>(
        "/api/Dashboard/get-monthly-request-count-for-last-6-months"
      );
    },

    // Updated method to get all requests with pagination
    getAllRequests: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<ALL_REQUESTS_RESPONSE> => {
      console.log(
        `Fetching all requests from API (page ${pageNumber}, size ${pageSize})`
      );
      return http.get<ALL_REQUESTS_RESPONSE>(
        `/api/Request?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    // Keep the old method for backward compatibility
    getRequestsWithReport: (): Promise<
      DASHBOARD_RESPONSE<REQUEST_WITH_REPORT[]>
    > => {
      console.log("Fetching requests with reports from dashboard API");
      return http.get<DASHBOARD_RESPONSE<REQUEST_WITH_REPORT[]>>(
        "/api/Dashboard/get-requests-contain-report"
      );
    },

    getFilterdStats:(areaId:string, startDate:string,endDate:string):Promise<HOTDashboardFilteredStatsDTO>=>{
      console.log(`Fetching filtered stats for area ${areaId} from ${startDate} to ${endDate}`);
      return http.get<HOTDashboardFilteredStatsDTO>(`/api/Dashboard/filtered-stats?areaId=${areaId}&startDate=${startDate}&endDate=${endDate}`);
    }

  };
  Notification = {
    getNotifications: (
      skip: number = 0,
      take: number = 20,
      search?: string,
      type?: string,
      isRead?: boolean,
      fromDate?: string,
      toDate?: string
    ): Promise<NotificationResponse> => {
      console.log(`Fetching notifications (skip=${skip}, take=${take})`);

      const params = new URLSearchParams();
      params.append("skip", skip.toString());
      params.append("take", take.toString());

      if (search) params.append("search", search);
      if (type) params.append("type", type);
      if (isRead !== undefined) params.append("isRead", isRead.toString());
      if (fromDate) params.append("fromDate", fromDate);
      if (toDate) params.append("toDate", toDate);

      return http.get<NotificationResponse>(
        `/api/notifications?${params.toString()}`
      );
    },
    markAsRead: (notificationId: string) => {
      console.log(`Marking notification ${notificationId} as read`);
      return http.put(`/api/notifications/${notificationId}/mark-read`, {});
    },
    getUnreadCount: (): Promise<{ unreadCount: number }> => {
      console.log("Fetching unread notification count");
      return http.get<{ unreadCount: number }>(
        "/api/notifications/unread-count"
      );
    },
  };
  location = {
    // Area APIs
    getAreas: (pageNumber: number = 1, pageSize: number = 10): Promise<any> => {
      console.log(`Fetching areas (page ${pageNumber}, size ${pageSize})`);
      return http.get(
        `/api/Area/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    // Import areas from Excel file
    importAreas: async (formData: FormData): Promise<any> => {
      console.log("Importing areas from Excel file");
      try {
        const response = await http.post("/api/Area/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing areas:", error);
        throw error;
      }
    },

    // Delete area
    deleteArea: async (areaId: string): Promise<any> => {
      console.log(`Deleting area with ID: ${areaId}`);
      try {
        const response = await http.delete(`/api/Area/${areaId}`);
        return response;
      } catch (error) {
        console.error("Error deleting area:", error);
        throw error;
      }
    },

    // Zone APIs
    getZones: (pageNumber: number = 1, pageSize: number = 10): Promise<any> => {
      console.log(`Fetching zones (page ${pageNumber}, size ${pageSize})`);
      return http.get(
        `/api/Zone/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    getZonesByAreaId: (
      areaId: string,
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      console.log(
        `Fetching zones for area ${areaId} (page ${pageNumber}, size ${pageSize})`
      );
      return http.get(
        `/api/Area/${areaId}/zones?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    // Import zones from Excel file
    importZones: async (formData: FormData): Promise<any> => {
      console.log("Importing zones from Excel file");
      try {
        const response = await http.post("/api/Zone/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing zones:", error);
        throw error;
      }
    },

    // Delete zone
    deleteZone: async (zoneId: string): Promise<any> => {
      console.log(`Deleting zone with ID: ${zoneId}`);
      try {
        const response = await http.delete(`/api/Zone/${zoneId}`);
        return response;
      } catch (error) {
        console.error("Error deleting zone:", error);
        throw error;
      }
    },

    // Position APIs
    getPositions: (
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      console.log(`Fetching positions (page ${pageNumber}, size ${pageSize})`);
      return http.get(
        `/api/Position/search?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    getPositionsByZoneId: (
      zoneId: string,
      pageNumber: number = 1,
      pageSize: number = 10
    ): Promise<any> => {
      console.log(
        `Fetching positions for zone ${zoneId} (page ${pageNumber}, size ${pageSize})`
      );
      return http.get(
        `/api/Zone/${zoneId}/positions-and-devices?pageNumber=${pageNumber}&pageSize=${pageSize}`
      );
    },

    getPositionsByAreaId: (areaId: string): Promise<any> => {
      console.log(`Fetching positions for area ${areaId}`);
      return http.get(`/api/Position/by-area/${areaId}`);
    },

    // Import positions from Excel file
    importPositions: async (formData: FormData): Promise<any> => {
      console.log("Importing positions from Excel file");
      try {
        const response = await http.post("/api/Position/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response;
      } catch (error) {
        console.error("Error importing positions:", error);
        throw error;
      }
    },

    // Delete position
    deletePosition: async (positionId: string): Promise<any> => {
      console.log(`Deleting position with ID: ${positionId}`);
      try {
        const response = await http.delete(`/api/Position/${positionId}`);
        return response;
      } catch (error) {
        console.error("Error deleting position:", error);
        throw error;
      }
    },
  };

  incident = {
    // Issue APIs
    getIssues: (
      pageIndex: number = 1,
      pageSize: number = 10,
      searchByName?: string
    ): Promise<IssueResponse> => {
      const params = new URLSearchParams({
        pageIndex: pageIndex.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchByName) {
        params.append('searchByName', searchByName);
      }

      console.log(`Fetching issues: ${params.toString()}`);
      return http.get<IssueResponse>(`/api/Issue/all?${params.toString()}`);
    },

    // Technical Issue APIs
    getTechnicalIssues: (
      pageNumber: number = 1,
      pageSize: number = 10,
      searchByName?: string
    ): Promise<TechnicalIssueResponse> => {
      const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchByName) {
        params.append('searchByName', searchByName);
      }

      console.log(`Fetching technical issues: ${params.toString()}`);
      return http.get<TechnicalIssueResponse>(`/api/TechinicalSymtom/all?${params.toString()}`);
    },

    // Error APIs
    getErrors: (
      pageNumber: number = 1,
      pageSize: number = 10,
      searchByName?: string
    ): Promise<ErrorIncidentResponse> => {
      const params = new URLSearchParams({
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
      });

      if (searchByName) {
        params.append('searchByName', searchByName);
      }

      console.log(`Fetching errors: ${params.toString()}`);
      return http.get<ErrorIncidentResponse>(`/api/Error/all?${params.toString()}`);
    },
  }
}

export const apiClient = new APIClient();
