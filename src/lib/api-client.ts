import http from "@/lib/http";
import { AuthUser } from "@/types/auth.type";
import { REQUEST_SUMMARY } from "@/types/request.type";
import { CREATE_TASK_WEB, SPAREPART_WEB } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { create } from "domain";

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

    getMechanic: (): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>("/api/User/role?role=3"); // ✅ Auto token
    },
    getUsersByRole: (role: number): Promise<GET_MECHANIC_USER> => {
      return http.get<GET_MECHANIC_USER>(`/api/User/role?role=${role}`); // ✅ Auto token
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
      console.log(
        "🔥 API CLIENT: getRequestDetail called with requestId:",
        requestId
      );
      console.log(
        "🔥 API CLIENT: About to call:",
        `/api/Request/detail/${requestId}`
      );
      return http.get(`/api/Request/detail/${requestId}`); // ✅ Auto token
    },
    getErrorOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/errors/${requestId}`); // ✅ Auto token
    },
    getTaskOfRequest: (requestId: string): Promise<any> => {
      return http.get(`/api/Request/tasks/${requestId}`); // ✅ Auto token
    },
  };
  task = {
    // Get spare parts for a specific request
    getSpareParts: (errorIds: string[]): Promise<SPAREPART_WEB[]> => {
      console.log(
        "🔥 API CLIENT: getSpareParts called with errorIds:",
        errorIds
      );
      console.log(
        "🔥 API CLIENT: About to call:",
        "/api/Error/spare-parts/list"
      );
      // ✅ Send error IDs as direct array, not wrapped in object
      return http.post<SPAREPART_WEB[]>(
        "/api/Error/spare-parts/list",
        errorIds // ✅ Direct array: ["id1", "id2"] instead of { errorIds: ["id1", "id2"] }
      );
    },

    // Create a new task from errors
    createTaskFromErrors: (data: CREATE_TASK_WEB): Promise<any> => {
      console.log(
        "🔥 API CLIENT: createTaskFromErrors called with data:",
        data
      );
      console.log(
        "🔥 API CLIENT: About to call:",
        "/api/Task/create-from-errors"
      );
      return http.post("/api/Task/create-task", data); // ✅ Auto token
    },
  };
}

export const apiClient = new APIClient();
