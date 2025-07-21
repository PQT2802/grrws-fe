"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  Calendar,
  Check,
  CheckCheck,
  Bell,
  RefreshCw,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import useNotificationStore from "@/store/notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Notification, NotificationType } from "@/types/notification.type";
import { getTimeAgo } from "@/lib/utils";
import Empty from "@/components/Empty/Empty";
import PageTitle from "@/components/PageTitle/PageTitle";

const NOTIFICATION_TYPES = [
  { value: "all", label: "Tất cả loại" },
  { value: "0", label: "Thông báo chung" },
  { value: "1", label: "Yêu cầu mới" },
  { value: "2", label: "Cập nhật tiến độ" },
  { value: "3", label: "Hoàn thành" },
  { value: "8", label: "Giao nhiệm vụ" },
  { value: "17", label: "Hoàn thành nhiệm vụ" },
  { value: "9", label: "Yêu cầu xuất kho" },
  { value: "14", label: "Hết linh kiện" },
  { value: "15", label: "Cảnh báo linh kiện" },
];

const NotificationsPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    getNotifications,
    markAsRead,
    getUnreadCount,
  } = useNotificationStore();

  // URL-based active tab
  const initialTab = searchParams.get("tab") || "all";
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">(
    initialTab as "all" | "unread" | "read"
  );

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Selection
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Update URL when tab changes
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [activeTab, router]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch notifications when filters change
  useEffect(() => {
    if (user) {
      const isRead = activeTab === "all" ? undefined : activeTab === "read";
      const skip = (currentPage - 1) * pageSize;

      getNotifications(
        skip,
        pageSize,
        debouncedSearch || undefined,
        selectedType === "all" ? undefined : selectedType, // Fix here
        isRead,
        fromDate || undefined,
        toDate || undefined
      );
    }
  }, [
    user,
    activeTab,
    currentPage,
    debouncedSearch,
    selectedType,
    fromDate,
    toDate,
    getNotifications,
    pageSize,
  ]);

  // Get unread count on mount
  useEffect(() => {
    if (user) {
      getUnreadCount();
    }
  }, [user, getUnreadCount]);

  // Filter notifications based on active tab
  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") return notifications;
    if (activeTab === "unread") return notifications.filter((n) => !n.isRead);
    if (activeTab === "read") return notifications.filter((n) => n.isRead);
    return notifications;
  }, [notifications, activeTab]);

  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const readNotifications = notifications.filter((n) => n.isRead);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as read when clicked
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Parse notification data for navigation
      const navUrl = getNotificationNavUrl(notification);
      router.push(navUrl);
    } catch (error) {
      console.error("Failed to handle notification click:", error);
      toast.error("Không thể mở thông báo");
    }
  };

  const getNotificationNavUrl = (notification: Notification): string => {
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);

        if (
          notification.type === NotificationType.TaskCompleted ||
          notification.type === NotificationType.MechanicTaskCompleted
        ) {
          if (data.TaskGroupId) {
            return `/workspace/tasks/group/${data.TaskGroupId}`;
          }
        }

        if (notification.type === NotificationType.RequestCreated) {
          if (data.RequestId) {
            return `/workspace/requests/${data.RequestId}`;
          }
        }

        if (data.url) return data.url;
      } catch (error) {
        console.error("Failed to parse notification data:", error);
      }
    }

    // Fallback to default URLs
    switch (notification.type) {
      case NotificationType.RequestCreated:
      case NotificationType.ProgressUpdate:
      case NotificationType.Completed:
        return "/workspace/requests";
      case NotificationType.MechanicTaskAssigned:
      case NotificationType.MechanicTaskCompleted:
      case NotificationType.TaskCompleted:
        return "/workspace/tasks";
      case NotificationType.StockRequest:
      case NotificationType.SparePartOutOfStock:
      case NotificationType.LowSparePartWarning:
        return "/workspace/inventory";
      default:
        return "/workspace";
    }
  };

  const getNotificationTitle = (notification: Notification): string => {
    if (notification.title) return notification.title;

    switch (notification.type) {
      case NotificationType.RequestCreated:
        return "Yêu cầu mới được tạo";
      case NotificationType.ProgressUpdate:
        return "Cập nhật tiến độ";
      case NotificationType.Completed:
        return "Yêu cầu hoàn thành";
      case NotificationType.MechanicTaskAssigned:
        return "Công việc được giao";
      case NotificationType.MechanicTaskCompleted:
        return "Nhiệm vụ hoàn thành";
      case NotificationType.TaskCompleted:
        return "Nhiệm vụ hoàn thành";
      case NotificationType.StockRequest:
        return "Yêu cầu xuất kho";
      case NotificationType.SparePartOutOfStock:
        return "Linh kiện hết hàng";
      case NotificationType.LowSparePartWarning:
        return "Cảnh báo linh kiện";
      default:
        return "Thông báo mới";
    }
  };

  const handleSelectNotification = (
    notificationId: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedNotifications((prev) => [...prev, notificationId]);
    } else {
      setSelectedNotifications((prev) =>
        prev.filter((id) => id !== notificationId)
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unreadIds = filteredNotifications
        .filter((n) => !n.isRead)
        .map((n) => n.id);
      setSelectedNotifications(unreadIds);
    } else {
      setSelectedNotifications([]);
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await Promise.all(selectedNotifications.map((id) => markAsRead(id)));
      setSelectedNotifications([]);
      toast.success("Đã đánh dấu các thông báo đã chọn là đã đọc");
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
      toast.error("Không thể đánh dấu thông báo");
    }
  };

  const handleRefresh = () => {
    const isRead = activeTab === "all" ? undefined : activeTab === "read";
    const skip = (currentPage - 1) * pageSize;

    getNotifications(
      skip,
      pageSize,
      debouncedSearch || undefined,
      selectedType || undefined,
      isRead,
      fromDate || undefined,
      toDate || undefined
    );
    getUnreadCount();
    toast.success("Đã làm mới danh sách thông báo");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedType("all");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Button>
          <PageTitle
            title="Tất cả thông báo"
            description="Quản lý và xem tất cả thông báo của bạn"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm kiếm thông báo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full lg:w-[200px]">
                <SelectValue placeholder="Loại thông báo" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full lg:w-auto"
              />
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full lg:w-auto"
              />
            </div>

            {/* Clear Filters */}
            <Button onClick={clearFilters} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Xóa bộ lọc
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={(value) =>
              setActiveTab(value as "all" | "unread" | "read")
            }
          >
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all" className="relative">
                  <Bell className="h-4 w-4 mr-2" />
                  Tất cả
                  <Badge variant="secondary" className="ml-2">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread" className="relative">
                  Chưa đọc
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {unreadNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read" className="relative">
                  Đã đọc
                  {readNotifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {readNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Bulk Actions */}
              {selectedNotifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {selectedNotifications.length} đã chọn
                  </span>
                  <Button onClick={handleBulkMarkAsRead} size="sm">
                    <CheckCheck className="h-4 w-4 mr-2" />
                    Đánh dấu đã đọc
                  </Button>
                </div>
              )}
            </div>

            {/* Select All */}
            {activeTab !== "read" &&
              filteredNotifications.some((n) => !n.isRead) && (
                <div className="flex items-center gap-2 mb-4">
                  <Checkbox
                    checked={
                      selectedNotifications.length ===
                      filteredNotifications.filter((n) => !n.isRead).length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-gray-600">
                    Chọn tất cả thông báo chưa đọc
                  </span>
                </div>
              )}

            <TabsContent value={activeTab} className="space-y-2">
              {loading && (
                <div className="text-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">Đang tải thông báo...</p>
                </div>
              )}

              {error && (
                <div className="text-center py-8">
                  <p className="text-red-500">{error}</p>
                </div>
              )}

              {!loading && !error && filteredNotifications.length === 0 && (
                <div className="py-8">
                  <Empty
                    size={60}
                    message={
                      activeTab === "unread"
                        ? "Không có thông báo chưa đọc"
                        : activeTab === "read"
                        ? "Không có thông báo đã đọc"
                        : "Không có thông báo nào"
                    }
                  />
                </div>
              )}

              {!loading &&
                filteredNotifications.length > 0 &&
                filteredNotifications.map((notification: Notification) => (
                  <Card
                    key={notification.id}
                    className={`transition-all hover:shadow-md cursor-pointer ${
                      notification.isRead ? "opacity-70" : "border-blue-200"
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Selection checkbox */}
                        {!notification.isRead && (
                          <Checkbox
                            checked={selectedNotifications.includes(
                              notification.id
                            )}
                            onCheckedChange={(checked) => {
                              // Prevent card click when clicking checkbox
                              event?.stopPropagation();
                              handleSelectNotification(
                                notification.id,
                                checked as boolean
                              );
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}

                        {/* Avatar */}
                        <Avatar className="h-12 w-12 flex-shrink-0">
                          <AvatarFallback
                            className={`text-white ${
                              notification.isRead ? "bg-gray-400" : "bg-primary"
                            }`}
                          >
                            {notification.senderName ? (
                              notification.senderName.charAt(0).toUpperCase()
                            ) : (
                              <Bell className="h-6 w-6" />
                            )}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3
                                className={`font-medium ${
                                  notification.isRead
                                    ? "text-gray-700"
                                    : "text-gray-900"
                                }`}
                              >
                                {getNotificationTitle(notification)}
                              </h3>
                              {notification.body && (
                                <p
                                  className={`text-sm mt-1 ${
                                    notification.isRead
                                      ? "text-gray-500"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {notification.body}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                <span>từ {notification.senderName}</span>
                                <span>•</span>
                                <span>
                                  {notification.createdDate
                                    ? getTimeAgo(notification.createdDate)
                                    : "Vừa xong"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Priority indicator */}
                              {notification.priority &&
                                notification.priority > 5 && (
                                  <Badge
                                    variant="destructive"
                                    className="text-xs"
                                  >
                                    Quan trọng
                                  </Badge>
                                )}

                              {/* Read status indicator */}
                              {!notification.isRead && (
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>
          </Tabs>

          {/* Pagination would go here if needed */}
          {filteredNotifications.length >= pageSize && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => setCurrentPage((prev) => prev + 1)}
                variant="outline"
              >
                Tải thêm
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
