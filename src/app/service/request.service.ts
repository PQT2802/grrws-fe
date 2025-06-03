import http from "@/lib/http";
import {
  REQUEST_SUMMARY,
  REQUEST_DETAIL_WEB,
  ERROR_FOR_REQUEST_DETAIL_WEB,
  TASK_FOR_REQUEST_DETAIL_WEB,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";

export const requestService = {
  // ✅ Get request summary - calls request summary endpoint
  getRequestSummary: async (): Promise<REQUEST_SUMMARY> => {
    return http.get<REQUEST_SUMMARY>("/api/request", {
      useInternalRoute: true,
    });
  },

  // ✅ Get request detail by ID
  getRequestDetail: async (requestId: string): Promise<REQUEST_DETAIL_WEB> => {
    return http.get<REQUEST_DETAIL_WEB>(`/api/request/${requestId}`, {
      useInternalRoute: true,
    });
  },

  // ✅ Get errors for a specific request
  getErrorsByRequestId: async (
    requestId: string
  ): Promise<ERROR_FOR_REQUEST_DETAIL_WEB[]> => {
    return http.get<ERROR_FOR_REQUEST_DETAIL_WEB[]>(`/api/error/${requestId}`, {
      useInternalRoute: true,
    });
  },

  // ✅ Get tasks for a specific request
  getTasksByRequestId: async (
    requestId: string
  ): Promise<TASK_FOR_REQUEST_DETAIL_WEB[]> => {
    return http.get<TASK_FOR_REQUEST_DETAIL_WEB[]>(`/api/task/${requestId}`, {
      useInternalRoute: true,
    });
  },

  // ✅ NEW: Get technical issues for a specific request
  getTechnicalIssuesByRequestId: async (
    requestId: string
  ): Promise<TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]> => {
    console.log(
      "🔧 RequestService getTechnicalIssuesByRequestId called with requestId:",
      requestId
    );

    const technicalIssues = await http.get<
      TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
    >(`/api/technical-issue/${requestId}`, {
      useInternalRoute: true,
    });

    console.log("✅ Technical issues fetched:", technicalIssues);
    return technicalIssues;
  },

  // ✅ Create task from selected errors
  createTaskFromErrors: async (
    requestId: string,
    errors: ERROR_FOR_REQUEST_DETAIL_WEB[]
  ): Promise<any> => {
    return http.post(
      `/api/task/${requestId}`,
      {
        errors: errors,
      },
      {
        useInternalRoute: true,
      }
    );
  },
};

export default requestService;
