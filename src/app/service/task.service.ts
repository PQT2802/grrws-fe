import http from "@/lib/http";
import { CREATE_TASK_WEB, SPAREPART_WEB } from "@/types/task.type";

export const taskService = {
  // ✅ Get spare parts for specific error IDs
  getSpareParts: async (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
    return http.post<SPAREPART_WEB[]>(
      `/api/error/spareparts`,
      { errorIds },
      {
        useInternalRoute: true,
      }
    );
  },

  // ✅ Create a new task from selected errors
  createTaskFromErrors: async (taskData: CREATE_TASK_WEB): Promise<any> => {
    return http.post(`/api/task/create-from-errors`, taskData, {
      useInternalRoute: true,
    });
  },

  // ✅ Get tasks for a specific request
  getTasksByRequestId: async (requestId: string): Promise<any> => {
    return http.get(`/api/task/${requestId}`, {
      useInternalRoute: true,
    });
  },
};

export default taskService;
