"use client";

import { create } from "zustand";
import { apiClient } from "@/lib/api-client";
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
} from "@microsoft/signalr";
import {
  NOTIFICATION_TYPES,
  NotificationType,
  Notification,
} from "@/types/notification.type";

interface NotificationStoreState {
  notifications: Notification[]; // Changed from NOTIFICATION_TYPES[] to Notification[]
  unreadCount: number;
  loading: boolean;
  error: string | null;
  signalRConnection: HubConnection | null;

  setNotifications: (notis: Notification[]) => void;
  getNotifications: (
    skip?: number,
    take?: number,
    search?: string,
    type?: string,
    isRead?: boolean,
    fromDate?: string,
    toDate?: string
  ) => Promise<Notification[]>;
  markAsRead: (notificationId: string) => Promise<void>;
  getUnreadCount: () => Promise<number>;
  connectToSignalR: (
    accessToken: string,
    backendUrl: string,
    refetchTaskDetails?: () => void
  ) => void;
  disconnectSignalR: () => void;
}

const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  signalRConnection: null,

  setNotifications: (notis: Notification[]) => {
    set({ notifications: notis });
  },

  getNotifications: async (
    skip = 0,
    take = 20,
    search,
    type,
    isRead,
    fromDate,
    toDate
  ) => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.Notification.getNotifications(
        skip,
        take,
        search,
        type,
        isRead,
        fromDate,
        toDate
      );
      console.log("Store: API response", response);

      // Fix: Extract notifications array from the correct response structure
      const notifications = Array.isArray(response.notifications)
        ? response.notifications
        : [];

      // Also update unreadCount from response
      const unreadCount = response?.unreadCount || 0;

      console.log("notifications:", notifications);
      set({ notifications, unreadCount, loading: false });
      return notifications;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thông báo:", error);
      set({ error: "Không thể lấy danh sách thông báo", loading: false });
      return [];
    }
  },

  markAsRead: async (notificationId: string) => {
    set({ loading: true, error: null });
    try {
      await apiClient.Notification.markAsRead(notificationId);
      set((state) => ({
        notifications: state.notifications.map((noti) =>
          noti.id === notificationId ? { ...noti, isRead: true } : noti
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
        loading: false,
      }));
    } catch (error) {
      console.error("Lỗi khi đánh dấu thông báo đã đọc:", error);
      set({ error: "Không thể đánh dấu thông báo đã đọc", loading: false });
    }
  },

  getUnreadCount: async () => {
    set({ loading: true, error: null });
    try {
      const response = await apiClient.Notification.getUnreadCount();
      // Fix: Handle the response structure correctly
      const unreadCount = response?.unreadCount || 0;
      set({ unreadCount, loading: false });
      return unreadCount;
    } catch (error) {
      console.error("Lỗi khi lấy số lượng thông báo chưa đọc:", error);
      set({
        error: "Không thể lấy số lượng thông báo chưa đọc",
        loading: false,
      });
      return 0;
    }
  },

  connectToSignalR: (
    accessToken: string,
    backendUrl: string,
    refetchTaskDetails?: () => void
  ) => {
    if (!accessToken) {
      console.log("Không có token truy cập, bỏ qua kết nối SignalR");
      return;
    }

    const currentConnection = get().signalRConnection;
    if (currentConnection) {
      currentConnection.stop();
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${backendUrl}/hubs/request`, {
        accessTokenFactory: () => accessToken,
        withCredentials: false,
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect([0, 2000, 10000, 30000])
      .build();

    set({ signalRConnection: connection });

    connection
      .start()
      .then(() => {
        console.log("Kết nối SignalR thành công!");

        connection.on("NotificationReceived", (notification: Notification) => {
          console.log("Nhận được thông báo:", notification);

          // Add the new notification to the beginning of the list
          set((state) => ({
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead
              ? state.unreadCount
              : state.unreadCount + 1,
          }));

          // Trigger refetch for task completion notifications
          if (refetchTaskDetails) {
            console.log(
              "Nhận thông báo TaskCompleted trên trang taskDetail với trạng thái pending, gọi lại API"
            );
            refetchTaskDetails();
          }
        });

        connection.on("NotificationUpdated", (notificationId: string) => {
          console.log("Thông báo được cập nhật:", notificationId);
          get().getNotifications(); // Refetch notifications
        });
      })
      .catch((err) => {
        console.error("Lỗi kết nối SignalR:", err);
        set({ error: "Không thể kết nối với thông báo thời gian thực" });
      });

    connection.onclose(() => {
      console.log("Kết nối SignalR đã đóng");
      set({ signalRConnection: null });
    });

    connection.onreconnecting(() => {
      console.log("SignalR đang kết nối lại...");
      set({ error: "Đang kết nối lại với thông báo thời gian thực..." });
    });

    connection.onreconnected(() => {
      console.log("SignalR đã kết nối lại");
      set({ error: null });
    });
  },

  disconnectSignalR: () => {
    const connection = get().signalRConnection;
    if (connection) {
      connection.stop();
      set({ signalRConnection: null });
    }
  },
}));

export default useNotificationStore;
