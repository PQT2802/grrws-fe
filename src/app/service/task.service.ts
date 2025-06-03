import http from "@/lib/http";
import {
  CREATE_TASK_WEB,
  CREATE_TASK_FROM_ERRORS_WEB,
  CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB,
  CREATE_SIMPLE_TASK_WEB,
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

  // ✅ Create task from errors (repair tasks) - /api/Task/create-from-errors
  createTaskFromErrors = async (
    data: CREATE_TASK_FROM_ERRORS_WEB
  ): Promise<string> => {
    console.log("🔧 TaskService createTaskFromErrors called with:", data);

    const taskId = await http.post<string>(
      `/api/task/create-from-errors`,
      data,
      {
        useInternalRoute: true,
      }
    );

    console.log("✅ Repair task created, received ID:", taskId);
    return taskId;
  };

  // ✅ NEW: Create task from technical issues (warranty tasks) - /api/Task/create-from-technical-issue
  createTaskFromTechnicalIssue = async (
    data: CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB
  ): Promise<string> => {
    console.log(
      "🔧 TaskService createTaskFromTechnicalIssue called with:",
      data
    );

    const taskId = await http.post<string>(
      `/api/task/create-from-technical-issue`,
      data,
      {
        useInternalRoute: true,
      }
    );

    console.log("✅ Warranty task created, received ID:", taskId);
    return taskId;
  };

  // ✅ Create simple task (replace tasks) - /api/Task/create-simple
  createSimpleTask = async (data: CREATE_SIMPLE_TASK_WEB): Promise<string> => {
    console.log("🔧 TaskService createSimpleTask called with:", data);

    const taskId = await http.post<string>(`/api/task/create-simple`, data, {
      useInternalRoute: true,
    });

    console.log("✅ Simple task created, received ID:", taskId);
    return taskId;
  };

  // ✅ LEGACY: Create task from errors (old format) - /api/Task/create-task
  createTaskFromErrorsLegacy = async (
    data: CREATE_TASK_WEB
  ): Promise<string> => {
    console.log("🔧 TaskService createTaskFromErrorsLegacy called with:", data);

    const taskId = await http.post<string>(
      `/api/task/create-task-legacy`,
      data,
      {
        useInternalRoute: true,
      }
    );

    console.log("✅ Legacy task created, received ID:", taskId);
    return taskId;
  };

  // ✅ Get tasks for a specific request
  getTasksByRequestId = async (requestId: string): Promise<any> => {
    return http.get(`/api/task/${requestId}`, {
      useInternalRoute: true,
    });
  };
}

export default new TaskService();
