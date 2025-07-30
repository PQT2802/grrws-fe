import http from "@/lib/http";
import {
  CREATE_REPAIR_TASK,
  CREATE_WARRANTY_TASK,
  CREATE_UNINSTALL_TASK,
  CREATE_INSTALL_TASK,
  SPAREPART_WEB,
} from "@/types/task.type";

class TaskService {
  // ✅ Get spare parts for specific error IDs
  getSpareParts = async (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
    return http.post<SPAREPART_WEB[]>(
      `/api/error/spareparts`,
      { errorIds },
      {
        useInternalRoute: true,
      }
    );
  };

  // ✅ NEW: Create repair task - /api/Task/repair-task
  createRepairTask = async (data: CREATE_REPAIR_TASK): Promise<string> => {
    console.log("🔧 TaskService createRepairTask called with:", data);

    const taskId = await http.post<string>(`/api/task/repair-task`, data, {
      useInternalRoute: true,
    });

    console.log("✅ Repair task created, received ID:", taskId);
    return taskId;
  };

  // ✅ NEW: Create warranty task - /api/Task/warranty-task/submit
  createWarrantyTask = async (data: CREATE_WARRANTY_TASK): Promise<string> => {
    console.log("🔧 TaskService createWarrantyTask called with:", data);

    const taskId = await http.post<string>(`/api/task/warranty-task`, data, {
      useInternalRoute: true,
    });

    console.log("✅ Warranty task created, received ID:", taskId);
    return taskId;
  };

  // ✅ NEW: Create uninstall task - /api/Task/uninstall-task
  createUninstallTask = async (
    data: CREATE_UNINSTALL_TASK
  ): Promise<string> => {
    console.log("🔧 TaskService createUninstallTask called with:", data);

    const taskId = await http.post<string>(`/api/task/uninstall-task`, data, {
      useInternalRoute: true,
    });

    console.log("✅ Uninstall task created, received ID:", taskId);
    return taskId;
  };

  // ✅ NEW: Create install task - /api/Task/install-task
  createInstallTask = async (data: CREATE_INSTALL_TASK): Promise<string> => {
    console.log("🔧 TaskService createInstallTask called with:", data);

    const taskId = await http.post<string>(`/api/task/install-task`, data, {
      useInternalRoute: true,
    });

    console.log("✅ Install task created, received ID:", taskId);
    return taskId;
  };

  // ✅ Get tasks for a specific request
  getTasksByRequestId = async (requestId: string): Promise<any> => {
    return http.get(`/api/task/${requestId}`, {
      useInternalRoute: true,
    });
  };
}

// eslint-disable-next-line import/no-anonymous-default-export
export default new TaskService();
