import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api-client";
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

  // ✅ Get user info - calls user info endpoint (NOT sign-in!)
  getCurrentUser: async (): Promise<AuthUser> => {
    return http.get<AuthUser>("/api/user/info", {
      // ✅ Changed endpoint
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

export async function POST(req: Request) {
  try {
    console.log(req);
    const body = await req.json();

    // ✅ Route calls external backend via API client
    const authResponse = await apiClient.auth.signIn(body);

    return NextResponse.json(authResponse, { status: 200 });
  } catch (error: any) {
    console.error("Login failed:", error.message);
    return NextResponse.json({ error: "Login failed" }, { status: 401 });
  }
}

export async function GET(req: Request) {
  try {
    console.log("🚀 API Route Called: /api/User/user-infor");

    // Get authorization header
    const authorization = req.headers.get("authorization");
    console.log("🔑 Authorization header:", authorization);

    if (!authorization) {
      return NextResponse.json(
        { error: "No authorization token provided" },
        { status: 401 }
      );
    }

    // ✅ Call external backend to get user info
    console.log("🔄 Calling backend API for user info...");
    const userInfo = await apiClient.user.getInfo();
    console.log("✅ Backend user info response:", userInfo);

    return NextResponse.json(userInfo, { status: 200 });
  } catch (error: any) {
    console.error("❌ Get user info failed:", error.message);
    console.error("❌ Full error:", error);

    return NextResponse.json(
      {
        error: "Failed to get user information",
        details: error.message,
        backend: process.env.NEXT_PUBLIC_API_URL,
      },
      { status: 401 }
    );
  }
}
