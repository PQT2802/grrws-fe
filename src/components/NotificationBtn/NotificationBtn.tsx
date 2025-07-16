"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell, User, RefreshCcw } from "lucide-react";
import { useAuth } from "../providers/AuthProvider";
import useNotificationStore from "@/store/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Notification, NotificationType } from "@/types/notification.type";
import { getTimeAgo } from "@/lib/utils";
import Empty from "../Empty/Empty";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area"

const NotificationBtn = () => {
  const { user } = useAuth();
  const router = useRouter();
  
  const {
    notifications,
    unreadCount,
    loading,
    error,
    getNotifications,
    markAsRead,
    getUnreadCount,
    connectToSignalR,
    disconnectSignalR,
  } = useNotificationStore();

  const [open, setOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"unread" | "read">("unread");
  const [refreshing, setRefreshing] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const readNotifications = notifications.filter(n => n.isRead);

  // Initialize notifications and SignalR connection
  useEffect(() => {
    if (user) {
      const token = localStorage.getItem("accessToken");
      
      if (token) {
        getNotifications(0, 50);
        getUnreadCount();
        
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        connectToSignalR(token, backendUrl);
      }
    }

    return () => {
      disconnectSignalR();
    };
  }, [user]);

  const handleDropdownToggle = (newOpen: boolean) => {
    setOpen(newOpen);
    
    if (newOpen && user) {
      const token = localStorage.getItem("accessToken");
      if (token) {
        getNotifications(0, 50);
      }
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await getNotifications(0, 50);
      await getUnreadCount();
    } finally {
      setRefreshing(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      const navUrl = getNotificationNavUrl(notification);
      setOpen(false);
      router.push(navUrl);
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  const getNotificationNavUrl = (notification: Notification): string => {
    if (notification.data) {
      try {
        const data = JSON.parse(notification.data);
        
        if (notification.type === NotificationType.TaskCompleted || 
            notification.type === NotificationType.MechanicTaskCompleted) {
          if (data.TaskGroupId) {
            return `/workspace/sample-1/tasks/group/${data.TaskGroupId}`;
          }
        }
        
        if (notification.type === NotificationType.RequestCreated) {
          if (data.RequestId) {
            return `/workspace/sample-1/requests/${data.RequestId}`;
          }
        }

        if (data.url) {
          return data.url;
        }
      } catch (error) {
        console.error("Failed to parse notification data:", error);
      }
    }

    return getDefaultNotificationUrl(notification.type);
  };

  const getDefaultNotificationUrl = (type: number): string => {
    switch (type) {
      case NotificationType.RequestCreated:
      case NotificationType.ProgressUpdate:
      case NotificationType.Completed:
      case NotificationType.FeedbackRequest:
        return "/workspace/requests";
      case NotificationType.MechanicTaskAssigned:
      case NotificationType.MechanicReportProgress:
      case NotificationType.MechanicTaskCompleted:
      case NotificationType.TaskCompleted:
        return "/workspace/tasks";
      case NotificationType.StockRequest:
      case NotificationType.SparePartOutOfStock:
      case NotificationType.LowSparePartWarning:
      case NotificationType.StockQuantityChanged:
        return "/workspace/inventory";
      case NotificationType.WarrantyStatusUpdate:
      case NotificationType.WarrantyCollectionReminder:
      case NotificationType.WarrantyDelayUpdate:
      case NotificationType.EquipmentReturnedIssue:
        return "/workspace/warranty";
      case NotificationType.PartReplacementInitiated:
        return "/workspace/maintenance";
      case NotificationType.SystemSuggestion:
        return "/workspace/analytics";
      default:
        return "/workspace";
    }
  };

  const getNotificationTitle = (notification: Notification): string => {
    return notification.title || getDefaultTitle(notification.type);
  };

  const getDefaultTitle = (type: number): string => {
    switch (type) {
      case NotificationType.RequestCreated:
        return "Yêu cầu mới được tạo";
      case NotificationType.ProgressUpdate:
        return "Cập nhật tiến độ";
      case NotificationType.Completed:
        return "Yêu cầu hoàn thành";
      case NotificationType.MechanicTaskAssigned:
        return "Công việc được giao";
      case NotificationType.MechanicReportProgress:
        return "Báo cáo tiến độ";
      case NotificationType.MechanicTaskCompleted:
        return "Nhiệm vụ hoàn thành";
      case NotificationType.WarrantyStatusUpdate:
        return "Cập nhật bảo hành";
      case NotificationType.StockRequest:
        return "Yêu cầu xuất kho";
      case NotificationType.SparePartOutOfStock:
        return "Linh kiện hết hàng";
      case NotificationType.LowSparePartWarning:
        return "Cảnh báo linh kiện";
      case NotificationType.WarrantyCollectionReminder:
        return "Nhắc nhở thu hồi bảo hành";
      case NotificationType.WarrantyDelayUpdate:
        return "Cập nhật trễ bảo hành";
      case NotificationType.EquipmentReturnedIssue:
        return "Thiết bị trả về có lỗi";
      case NotificationType.SystemSuggestion:
        return "Gợi ý hệ thống";
      case NotificationType.PartReplacementInitiated:
        return "Bắt đầu thay thế linh kiện";
      case NotificationType.StockQuantityChanged:
        return "Thay đổi tồn kho";
      case NotificationType.FeedbackRequest:
        return "Yêu cầu phản hồi";
      case NotificationType.TaskCompleted:
        return "Nhiệm vụ hoàn thành";
      default:
        return "Thông báo mới";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <div className="absolute right-[-5px] top-[-5px] bg-red-500 w-5 h-5 rounded-full flex items-center justify-center z-10 shadow-sm">
          <span className="text-white font-semibold text-[0.7rem] max-w-[20px] truncate">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        </div>
      )}

      <DropdownMenu open={open} onOpenChange={handleDropdownToggle}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative bg-background hover:bg-accent transition-colors duration-200"
          >
            <Bell className="h-[1.2rem] w-[1.2rem]" />
            <span className="sr-only">Mở thông báo</span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[440px] p-0 shadow-lg">
          <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
            <DropdownMenuLabel className="flex items-center gap-2 p-0 m-0 text-base">
              <Bell className="h-4 w-4" />
              <span>Thông báo của tôi</span>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadCount} chưa đọc
                </Badge>
              )}
            </DropdownMenuLabel>
            
            {/* <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="sr-only">Làm mới</span>
            </Button> */}
          </div>

          <div className="p-3">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "unread" | "read")}>
              <TabsList className="grid w-full grid-cols-2 mb-2">
                <TabsTrigger value="unread" className="relative">
                  <span>Chưa đọc</span>
                  {unreadNotifications.length > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {unreadNotifications.length > 99 ? "99+" : unreadNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="read" className="relative">
                  <span>Đã đọc</span>
                  {readNotifications.length > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                      {readNotifications.length > 99 ? "99+" : readNotifications.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Unread Tab Content */}
              <TabsContent value="unread" className="mt-0 pt-0">
                <ScrollArea className="h-[400px]">
                  {loading && !refreshing && (
                    <div className="space-y-4 p-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-5 text-center">
                      <div className="rounded-full w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-red-500" />
                      </div>
                      <p className="text-sm text-red-500 font-medium">Lỗi khi tải thông báo</p>
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3" 
                        onClick={handleRefresh}
                      >
                        Thử lại
                      </Button>
                    </div>
                  )}

                  {!loading && !error && unreadNotifications.length === 0 && (
                    <div className="p-6 flex flex-col items-center justify-center h-full">
                      <Empty size={56} message="Không có thông báo chưa đọc" />
                    </div>
                  )}

                  {!loading && unreadNotifications.length > 0 && (
                    <div className="divide-y">
                      {unreadNotifications.slice(0, 10).map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className="p-3.5 hover:bg-accent/40 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 rounded-full flex-shrink-0 border-2 border-primary/10">
                              <AvatarFallback className="rounded-full text-white text-[0.9rem] bg-primary">
                                {notification.senderName ? 
                                  notification.senderName.charAt(0).toUpperCase() : 
                                  <User className="h-4 w-4" />
                                }
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <h4 className="text-sm font-medium text-foreground line-clamp-2 pr-4 flex-1">
                                  {getNotificationTitle(notification)}
                                </h4>
                                <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-1.5"></div>
                              </div>
                              
                              {notification.body && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {notification.body}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-medium text-muted-foreground">
                                  {notification.senderName}
                                </span>
                                <span className="text-[11px] text-muted-foreground/60">•</span>
                                <span className="text-[11px] text-muted-foreground/60">
                                  {notification.createdDate ? 
                                    getTimeAgo(notification.createdDate) : 
                                    "Vừa xong"
                                  }
                                </span>
                                
                                {notification.priority && notification.priority > 5 && (
                                  <>
                                    <span className="text-[11px] text-muted-foreground/60">•</span>
                                    <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                                      Quan trọng
                                    </Badge>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              {/* Read Tab Content */}
              <TabsContent value="read" className="mt-0 pt-0">
                <ScrollArea className="h-[400px]">
                  {loading && !refreshing && (
                    <div className="space-y-4 p-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {error && (
                    <div className="p-5 text-center">
                      <div className="rounded-full w-12 h-12 bg-red-100 flex items-center justify-center mx-auto mb-3">
                        <Bell className="h-6 w-6 text-red-500" />
                      </div>
                      <p className="text-sm text-red-500 font-medium">Lỗi khi tải thông báo</p>
                      <p className="text-xs text-red-400 mt-1">{error}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3" 
                        onClick={handleRefresh}
                      >
                        Thử lại
                      </Button>
                    </div>
                  )}

                  {!loading && !error && readNotifications.length === 0 && (
                    <div className="p-6 flex flex-col items-center justify-center h-full">
                      <Empty size={56} message="Không có thông báo đã đọc" />
                    </div>
                  )}

                  {!loading && readNotifications.length > 0 && (
                    <div className="divide-y">
                      {readNotifications.slice(0, 10).map((notification: Notification) => (
                        <div
                          key={notification.id}
                          className="p-3.5 hover:bg-accent/40 transition-colors cursor-pointer"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10 rounded-full flex-shrink-0 border border-muted">
                              <AvatarFallback className="rounded-full text-white text-[0.9rem] bg-muted-foreground/50">
                                {notification.senderName ? 
                                  notification.senderName.charAt(0).toUpperCase() : 
                                  <User className="h-4 w-4" />
                                }
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-muted-foreground line-clamp-2">
                                {getNotificationTitle(notification)}
                              </h4>
                              
                              {notification.body && (
                                <p className="text-xs text-muted-foreground/70 line-clamp-2">
                                  {notification.body}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] text-muted-foreground/70">
                                  {notification.senderName}
                                </span>
                                <span className="text-[11px] text-muted-foreground/50">•</span>
                                <span className="text-[11px] text-muted-foreground/50">
                                  {notification.createdDate ? 
                                    getTimeAgo(notification.createdDate) : 
                                    "Vừa xong"
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          <DropdownMenuSeparator className="m-0" />

          <DropdownMenuGroup className="py-3 bg-muted/20">
            <Link 
              href={`/notifications?tab=${activeTab}`}
              className="block text-center"
              onClick={() => setOpen(false)}
            >
              <span className="text-primary text-center font-medium text-sm hover:underline">
                Xem tất cả thông báo
              </span>
            </Link>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationBtn;