import http from "@/lib/http";
import { AuthResponse, AuthUser, LoginRequest } from "@/types/auth.type";

export const authService = {
  // ✅ Login - calls sign-in endpoint
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    return http.post<AuthResponse>("/api/auth/sign-in", data, {
      useInternalRoute: true,
      isPublic: true,
    });
  },

  // ✅ Get user info - calls auth info endpoint (matches your route)
  getCurrentUser: async (): Promise<AuthUser> => {
    return http.get<AuthUser>("/api/auth/info", {
      // ✅ Changed to match your route
      useInternalRoute: true,
    });
  },

  logout: async (): Promise<{ message: string }> => {
    return http.post<{ message: string }>(
      "/api/auth/logout",
      {},
      {
        useInternalRoute: true,
      }
    );
  },

  refreshToken: async (): Promise<AuthResponse> => {
    return http.post<AuthResponse>(
      "/api/auth/refresh",
      {},
      {
        useInternalRoute: true,
      }
    );
  },
};

export default authService;
