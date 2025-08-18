"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, ArrowRight, FileText, Clock, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { REQUEST_ITEM } from "@/types/dashboard.type";

interface NotificationState {
  requests: REQUEST_ITEM[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

interface RequestWithCreator extends REQUEST_ITEM {
  createdByName?: string;
}

// Vietnamese status mapping
const getStatusLabel = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    Pending: "Chờ duyệt",
    Unconfirmed: "Chưa xác nhận",
    Confirmed: "Đã xác nhận",
    InProgress: "Đang tiến hành",
    Completed: "Hoàn thành",
    Rejected: "Từ chối",
    OnHold: "Tạm dừng",
    Cancelled: "Đã hủy",
  };
  return statusMap[status] || status;
};

// Vietnamese status badge colors
const getStatusBadgeClass = (status: string): string => {
  const statusClasses: { [key: string]: string } = {
    Pending: "bg-yellow-100 text-yellow-700",
    Unconfirmed: "bg-yellow-100 text-yellow-700",
    Confirmed: "bg-green-100 text-green-700",
    InProgress: "bg-blue-100 text-blue-700",
    Completed: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
    OnHold: "bg-gray-100 text-gray-700",
    Cancelled: "bg-red-100 text-red-700",
  };
  return statusClasses[status] || "bg-gray-100 text-gray-700";
};

export default function HOTNotificationArea() {
  const router = useRouter();

  const [state, setState] = useState<NotificationState>({
    requests: [],
    totalCount: 0,
    isLoading: true,
    error: null,
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleRequestClick = useCallback(
    (requestId: string) => {
      // ✅ Navigate to clean URL without workspaceId
      router.push(`/workspace/hot/reports/${requestId}`);
    },
    [router] // ✅ Remove workspaceId from dependencies
  );

  const handleViewAllRequests = useCallback(() => {
    // ✅ Navigate to clean URL without workspaceId
    router.push(`/workspace/hot/reports`);
  }, [router]); // ✅ Remove workspaceId from dependencies

  // Fetch creator name for a request
  const fetchCreatorName = useCallback(
    async (createdBy: string): Promise<string> => {
      try {
        const user = await apiClient.user.getUserById(createdBy);
        return user?.fullName || user?.name || createdBy;
      } catch (error) {
        console.error(`Failed to fetch user info for ${createdBy}:`, error);
        return createdBy; // Return ID as fallback
      }
    },
    []
  );

  const processRequests = useCallback(
    async (rawRequests: REQUEST_ITEM[]) => {
      // Sort by creation date (newest first) and take the first 5
      const sortedRequests = rawRequests
        .sort(
          (a, b) =>
            new Date(b.createdDate).getTime() -
            new Date(a.createdDate).getTime()
        )
        .slice(0, 5);

      // Fetch creator names for each request
      const requestsWithCreators: RequestWithCreator[] = await Promise.all(
        sortedRequests.map(async (req) => {
          const createdByName = await fetchCreatorName(req.createdBy);
          return {
            ...req,
            createdByName,
          };
        })
      );

      return {
        requests: requestsWithCreators,
        totalCount: rawRequests.length,
      };
    },
    [fetchCreatorName]
  );

  const fetchNotificationData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch all requests (increase page size to get more results)

      const response = await apiClient.dashboard.getAllRequests(1, 100);

      let requests: REQUEST_ITEM[] = [];

      if (response?.data?.data) {
        requests = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      }

      console.log("Fetched requests for HOT:", requests);

      const processedData = await processRequests(requests);

      setState((prev) => ({
        ...prev,
        ...processedData,
        isLoading: false,
      }));
    } catch (error) {
      console.error("Lỗi khi tải thông báo:", error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Không thể tải thông báo",
      }));
    }
  }, [processRequests]);

  // Use useEffect with empty dependency array to prevent unnecessary re-fetches
  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Memoized render components to prevent unnecessary re-renders
  const LoadingComponent = useMemo(
    () => (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
      </div>
    ),
    []
  );

  // Format date to Vietnamese format with exact timestamp
  const formatDateTime = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate time ago in Vietnamese
  const getTimeAgo = (dateString: string): string => {
    try {
      const now = new Date();
      const createdDate = new Date(dateString);
      const diffInMs = now.getTime() - createdDate.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays >= 1) {
        return "hơn 1 ngày trước";
      } else if (diffInHours >= 1) {
        return `${diffInHours} giờ trước`;
      } else if (diffInMinutes >= 1) {
        return `${diffInMinutes} phút trước`;
      } else {
        return "vừa xong";
      }
    } catch (error) {
      return "không xác định";
    }
  };

  // Format location information
  const formatLocation = (req: REQUEST_ITEM): string => {
    const parts = [];

    if (req.areaName) {
      parts.push(req.areaName);
    }

    if (req.zoneName) {
      parts.push(req.zoneName);
    }

    if (req.positionIndex) {
      parts.push(`Vị trí: ${req.positionIndex}`);
    }

    return parts.length > 0 ? parts.join(" - ") : "Vị trí không xác định";
  };

  // Only render if there are requests
  const RequestsSection = useMemo(() => {
    if (state.totalCount === 0) return null;

    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Yêu cầu gần đây</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {state.totalCount}
            </span>
          </div>
          <button
            onClick={handleViewAllRequests}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
          {state.requests.map((req) => (
            <li
              key={req.id}
              className="py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer rounded transition-colors"
              onClick={() => handleRequestClick(req.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Line 1: Request Title */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-blue-600">
                      {req.requestTitle}
                    </span>
                  </div>

                  {/* Line 2: Created By + Timestamp + Time Ago */}
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
                    Tạo bởi{" "}
                    {(req as RequestWithCreator).createdByName || req.createdBy}
                    <Clock className="w-3 h-3 ml-1" />
                    {formatDateTime(req.createdDate)} •{" "}
                    {getTimeAgo(req.createdDate)}
                  </p>

                  {/* Line 3: Location */}
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {formatLocation(req)}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(
                    req.status
                  )}`}
                >
                  {getStatusLabel(req.status)}
                </span>
              </div>
            </li>
          ))}
          {state.totalCount > state.requests.length && (
            <li className="pt-2 text-center">
              <span className="text-sm text-gray-500">
                và {state.totalCount - state.requests.length} yêu cầu khác...
              </span>
            </li>
          )}
        </ul>
      </div>
    );
  }, [
    state.requests,
    state.totalCount,
    handleRequestClick,
    handleViewAllRequests,
  ]);

  if (state.isLoading) return LoadingComponent;

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg shadow-sm border p-6">
          <p className="text-center text-red-500">{state.error}</p>
          <button
            onClick={fetchNotificationData}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Check if we have any sections to render
  if (state.totalCount === 0) {
    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Không có yêu cầu
          </h3>
          <p className="text-gray-500">Hiện tại không có yêu cầu nào.</p>
        </div>
      </div>
    );
  }

  return <div className="space-y-6">{RequestsSection}</div>;
}
