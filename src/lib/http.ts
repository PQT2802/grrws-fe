import config from "@/config/config";

// Success response structure (200)
export interface ApiResponse<T> {
  statusCode: number;
  title: string;
  type: string;
  extensions: {
    message: string;
    data: T;
  };
}

// Error response structure (non-200)
export interface ApiErrorResponse {
  status: number;
  title: string;
  type: string;
  errors: Array<{
    code: string;
    description: string;
    type: string;
  }>;
}

type RequestOptions = {
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: FormData | object;
  headers?: Record<string, string>;
  apiKey?: string;
  jwtToken?: string;
  isPublic?: boolean;
  useInternalRoute?: boolean;
};

// ✅ Helper function to get token from different sources
const getAuthToken = (providedToken?: string): string | null => {
  // 1. Use explicitly provided token first
  if (providedToken) {
    console.log("🔑 Using explicitly provided token");
    return providedToken;
  }

  // 2. Try to get from localStorage (client-side)
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      console.log("🔑 Using token from localStorage");
      return token;
    }
  }

  // 3. For server-side, we'll handle this in the API route
  if (typeof window === "undefined") {
    console.log(
      "🖥️ Server-side: token should be passed explicitly via jwtToken option"
    );
  }

  return null;
};

const fetchData = async <T>(
  url: string,
  options: RequestOptions
): Promise<T> => {
  const {
    method = "GET",
    body,
    headers = {},
    useInternalRoute = false,
    jwtToken,
    isPublic = false,
  } = options;

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  // ✅ Automatically add Authorization header for all non-public requests
  if (!isPublic) {
    const token = getAuthToken(jwtToken);
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
      console.log("🔑 Authorization header added successfully");
    } else {
      console.log(
        "⚠️ No auth token found - request will be made without Authorization header"
      );
    }
  } else {
    console.log("🌐 Public request - skipping Authorization header");
  }

  // Set up request body
  let requestBody: string | FormData | undefined;
  if (body instanceof FormData) {
    requestBody = body;
    delete requestHeaders["Content-Type"];
  } else if (body) {
    requestBody = JSON.stringify(body);
  }

  // Build URL
  let fullUrl: string;
  if (useInternalRoute) {
    // Internal Next.js API routes
    if (typeof window === "undefined") {
      // Server-side: use localhost
      fullUrl = `http://localhost:3000${url}`;
    } else {
      // Client-side: use current origin
      fullUrl = `${window.location.origin}${url}`;
    }
  } else {
    // External backend
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://103.211.201.236:5000";
    fullUrl = `${baseUrl}${url}`;
  }

  // ✅ Debug logging
  // console.log("🌐 HTTP Client Debug Info:");
  // console.log("  📍 Original endpoint:", url);
  // console.log("  🔗 Base URL:", process.env.NEXT_PUBLIC_API_URL);
  // console.log("  🎯 Final URL:", fullUrl);
  // console.log("  📋 Use internal route:", useInternalRoute);
  // console.log("  🔑 Headers:", requestHeaders);
  // console.log("  🖥️ Is server-side:", typeof window === "undefined");
  // console.log("  📦 Body:", requestBody);
  // console.log("  ⚙️ Method:", method);
  // console.log("  🔒 Is public:", isPublic);

  try {
    console.log("🚀 Making fetch request to:", fullUrl);
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: requestBody,
      cache: "no-store",
      next: {
        revalidate: 0,
      },
    });

    console.log("📥 Response received:");
    console.log("  📊 Status:", response.status);
    console.log("  📊 Status Text:", response.statusText);
    console.log(
      "  📋 Response Headers:",
      Object.fromEntries(response.headers.entries())
    );
    // console.log("  🔗 Response URL:", response.url);

    // ✅ Handle empty responses (like 401 with no body)
    let data;
    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");

    if (contentLength === "0" || !contentType?.includes("application/json")) {
      // console.log("📄 Empty or non-JSON response detected");
      data = null;
    } else {
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("❌ JSON parse error:", parseError);
        console.log("📄 Response might be empty or invalid JSON");
        data = null;
      }
    }
    console.log(response);
    // Handle success response (200-299)
    if (response.ok) {
      if (data && "extensions" in data && "data" in data.extensions) {
        return data.extensions.data as T;
      }
      // If not, return the data directly (for your backend)
      return (data || {}) as T;
    }

    // Handle error response (non-200)
    if (response.status === 401) {
      // ✅ Handle 401 Unauthorized specifically
      console.error("❌ 401 Unauthorized - Token might be invalid or expired");
      throw new Error("Unauthorized - Please login again");
    }

    if (data && "errors" in data) {
      const errorResponse = data as ApiErrorResponse;
      const errorMessage = errorResponse.errors
        .map((err) => `${err.code}: ${err.description}`)
        .join("; ");
      throw new Error(errorMessage);
    }

    // Fallback for unexpected response format
    throw new Error(
      `HTTP error! Status: ${response.status} - ${
        data?.message || response.statusText || "Unknown error"
      }`
    );
  } catch (error: any) {
    console.error("Fetch error:", error);
    console.error("  🎯 URL:", fullUrl);
    console.error("  ❌ Error:", error);
    throw error;
  }
};

const http = {
  get: <T>(
    url: string,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ) => fetchData<T>(url, { method: "GET", ...options }),

  post: <T>(
    url: string,
    body: FormData | object,
    options: Omit<RequestOptions, "method"> = {}
  ) => fetchData<T>(url, { method: "POST", body, ...options }),

  put: <T>(
    url: string,
    body: FormData | object,
    options: Omit<RequestOptions, "method"> = {}
  ) => fetchData<T>(url, { method: "PUT", body, ...options }),

  delete: <T>(
    url: string,
    options: Omit<RequestOptions, "method" | "body"> = {}
  ) => fetchData<T>(url, { method: "DELETE", ...options }),

  // ✅ Add public methods for requests that don't need auth
  getPublic: <T>(
    url: string,
    options: Omit<RequestOptions, "method" | "body" | "isPublic"> = {}
  ) => fetchData<T>(url, { method: "GET", isPublic: true, ...options }),

  postPublic: <T>(
    url: string,
    body: FormData | object,
    options: Omit<RequestOptions, "method" | "isPublic"> = {}
  ) => fetchData<T>(url, { method: "POST", body, isPublic: true, ...options }),
};

export default http;
