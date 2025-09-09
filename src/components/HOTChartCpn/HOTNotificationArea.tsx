"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Bell, ArrowRight, FileText, Clock, MapPin, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { REQUEST_ITEM } from "@/types/dashboard.type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationState {
  requests: REQUEST_ITEM[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

interface RequestWithCreator extends REQUEST_ITEM {
  createdByName?: string;
}

const TIME_RANGES = [
  { value: "24h", label: "24 giờ trước" },
  { value: "3d", label: "3 ngày trước" },
  { value: "7d", label: "7 ngày trước" },
];

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
    Pending: "bg-yellow-200 text-yellow-700",
    Unconfirmed: "bg-yellow-200 text-yellow-700",
    Confirmed: "bg-green-200 text-green-700",
    InProgress: "bg-blue-200 text-blue-700",
    Completed: "bg-green-200 text-green-700",
    Rejected: "bg-red-200 text-red-700",
    OnHold: "bg-gray-200 text-gray-700",
    Cancelled: "bg-red-200 text-red-700",
  };
  return statusClasses[status] || "bg-gray-200 text-gray-700";
};

export default function HOTNotificationArea() {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState("7d");

  const [state, setState] = useState<NotificationState>({
    requests: [],
    totalCount: 0,
    isLoading: true,
    error: null,
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleRequestClick = useCallback(
    (requestId: string) => {
      router.push(`/workspace/hot/reports/${requestId}`);
    },
    [router]
  );

  const handleViewAllRequests = useCallback(() => {
    router.push(`/workspace/hot/reports`);
  }, [router]);

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

  // Filter requests by time range
  const filterRequestsByTimeRange = useCallback((requests: REQUEST_ITEM[]): REQUEST_ITEM[] => {
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "24h":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "3d":
        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    return requests.filter(request => {
      // ✅ Exclude completed requests
      if (request.status.toLowerCase() === 'completed') {
        return false;
      }

      // Filter by time range
      const requestDate = new Date(request.createdDate);
      return requestDate >= startDate && requestDate <= now;
    });
  }, [timeRange]);

  const processRequests = useCallback(
    async (rawRequests: REQUEST_ITEM[]) => {
      // ✅ Filter out completed requests and apply time range filter
      const filteredRequests = filterRequestsByTimeRange(rawRequests);
      
      // Sort by creation date (newest first) and take the first 5
      const sortedRequests = filteredRequests
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
        totalCount: filteredRequests.length, // Use filtered count, not raw count
      };
    },
    [fetchCreatorName, filterRequestsByTimeRange]
  );

  const fetchNotificationData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      // Fetch all requests (increase page size to get more results)
      const response = await apiClient.dashboard.getAllRequests(1, 200);

      let requests: REQUEST_ITEM[] = [];

      if (response?.data?.data) {
        requests = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      }

      console.log(`Fetched ${requests.length} total requests for HOT`);

      const processedData = await processRequests(requests);

      console.log(`After filtering: ${processedData.totalCount} requests (excluding completed)`);

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

  // Fetch data when component mounts or time range changes
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
        return `${diffInDays} ngày trước`;
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
          <div className="flex items-center gap-3">
            {/* ✅ Time Range Filter */}
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <button
              onClick={handleViewAllRequests}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              Xem tất cả <ArrowRight className="w-4 h-4" />
            </button>
          </div>
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
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 flex items-center gap-1">
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
    timeRange,
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Yêu cầu gần đây</h2>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGES.map((range) => (
                <SelectItem key={range.value} value={range.value}>
                  {range.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-center py-8">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Không có yêu cầu
          </h3>
          <p className="text-gray-500">
            Hiện tại không có yêu cầu nào trong khoảng thời gian đã chọn
            {timeRange === "24h" && " (24 giờ qua)"}
            {timeRange === "3d" && " (3 ngày qua)"}
            {timeRange === "7d" && " (7 ngày qua)"}
          </p>
        </div>
      </div>
    );
  }

  return <div className="space-y-6">{RequestsSection}</div>;
}
