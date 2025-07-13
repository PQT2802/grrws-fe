"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { NOTIFICATION_TYPE } from "@/types";
import useNotificationStore from "@/store/notifications";

interface NotificationContextType {
  onTaskSuccess: (callback: () => void) => void;
  removeTaskSuccessListener: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  taskStatus?: string; // Optional task status from the page
  accessToken: string;
  backendUrl: string;
}

export const NotificationProvider = ({
  children,
  taskStatus,
  accessToken,
  backendUrl,
}: NotificationProviderProps) => {
  const pathname = usePathname();
  const { connectToSignalR, signalRConnection } = useNotificationStore();
  const [taskSuccessCallback, setTaskSuccessCallback] = useState<(() => void) | null>(null);

  useEffect(() => {
    connectToSignalR(accessToken, backendUrl);

    return () => {
      useNotificationStore.getState().disconnectSignalR();
    };
  }, [accessToken, backendUrl, connectToSignalR]);

  useEffect(() => {
    if (!signalRConnection) return;

    const handleNotificationReceived = (notification: NOTIFICATION_TYPE) => {
      if (
        notification.type === "taskSuccess" &&
        pathname.includes("/taskDetail") &&
        taskStatus === "pending" &&
        taskSuccessCallback
      ) {
        console.log("Received taskSuccess notification on taskDetail page with pending status, triggering refetch");
        taskSuccessCallback();
      }
    };

    signalRConnection.on("NotificationReceived", handleNotificationReceived);

    return () => {
      signalRConnection.off("NotificationReceived", handleNotificationReceived);
    };
  }, [signalRConnection, pathname, taskStatus, taskSuccessCallback]);

  const onTaskSuccess = (callback: () => void) => {
    setTaskSuccessCallback(() => callback);
  };

  const removeTaskSuccessListener = () => {
    setTaskSuccessCallback(null);
  };

  return (
    <NotificationContext.Provider value={{ onTaskSuccess, removeTaskSuccessListener }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};