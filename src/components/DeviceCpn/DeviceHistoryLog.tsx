"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, Activity, Package, ArrowUpDown } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DEVICE_HISTORY } from "@/types/device.type";

interface DeviceHistoryLogProps {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
}

export default function DeviceHistoryLog({ deviceId, deviceCode, deviceName }: DeviceHistoryLogProps) {
  const [deviceHistory, setDeviceHistory] = useState<DEVICE_HISTORY[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Main function to fetch device history
  const fetchDeviceHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching device history for: ${deviceCode} (${deviceName})`);
      
      // Get device history logs directly from API
      const historyData = await apiClient.device.getDeviceHistory(deviceId);
      console.log("📊 Device history response:", historyData);
      
      if (!historyData || !Array.isArray(historyData)) {
        console.warn("⚠️ Invalid device history response");
        setDeviceHistory([]);
        return;
      }
      
      // Sort by date (most recent first)
      const sortedHistory = historyData.sort((a, b) => {
        return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
      });
      
      setDeviceHistory(sortedHistory);
      console.log(`✅ Found ${sortedHistory.length} history events for device ${deviceCode}`);

    } catch (error) {
      console.error("❌ Error fetching device history:", error);
      setError("Không thể tải lịch sử thiết bị");
    } finally {
      setIsLoading(false);
    }
  };

  // Load device history when component mounts
  useEffect(() => {
    if (deviceId && deviceCode) {
      fetchDeviceHistory();
    }
  }, [deviceId, deviceCode, deviceName]);

  // Date formatting functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "N/A";
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch (error) {
      console.warn("Time formatting error:", error);
      return "N/A";
    }
  };

  // Get appropriate icon and Vietnamese label based on action
  const getActionInfo = (action: DEVICE_HISTORY['actionType']) => {
    switch (action) {
      case 'Installation':
        return {
          icon: <ArrowUpDown className="h-4 w-4 text-green-600" />,
          label: 'Lắp đặt thiết bị',
          colorClass: 'border-l-green-600 bg-green-50/50 dark:bg-green-900/10'
        };
      case 'Uninstallation':
        return {
          icon: <ArrowUpDown className="h-4 w-4 text-red-600" />,
          label: 'Tháo dỡ thiết bị',
          colorClass: 'border-l-red-600 bg-red-50/50 dark:bg-red-900/10'
        };
      case 'StockIn':
        return {
          icon: <Package className="h-4 w-4 text-cyan-600" />,
          label: 'Nhập kho',
          colorClass: 'border-l-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10'
        };
      case 'StockOut':
        return {
          icon: <Package className="h-4 w-4 text-yellow-600" />,
          label: 'Xuất kho',
          colorClass: 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10'
        };
      default:
        return {
          icon: <Activity className="h-4 w-4 text-gray-600" />,
          label: 'Hoạt động thiết bị',
          colorClass: 'border-l-gray-600 bg-gray-50/50 dark:bg-gray-900/10'
        };
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Đang tải lịch sử thiết bị...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <History className="h-12 w-12 text-red-500 mb-2 opacity-50" />
          <p className="text-lg font-medium text-red-600">{error}</p>
          <button 
            onClick={fetchDeviceHistory}
            className="mt-2 text-blue-600 underline text-sm"
          >
            Thử lại
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Activity Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tổng quan hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <span className="text-xs text-muted-foreground">Tổng sự kiện</span>
              <p className="font-medium">{deviceHistory.length}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Lắp đặt</span>
              <p className="font-medium">
                {deviceHistory.filter(e => e.actionType === 'Installation').length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Tháo dỡ</span>
              <p className="font-medium">
                {deviceHistory.filter(e => e.actionType === 'Uninstallation').length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Nhập/Xuất kho</span>
              <p className="font-medium">
                {deviceHistory.filter(e => e.actionType === 'StockIn' || e.actionType === 'StockOut').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      {deviceHistory.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-lg font-medium">
              Thiết bị này chưa có hoạt động nào được ghi nhận.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold">Lịch sử hoạt động chi tiết</h4>
            <Badge variant="secondary">{deviceHistory.length} sự kiện</Badge>
          </div>

          {/* Event timeline */}
          <div className="space-y-3">
            {deviceHistory.map((history) => {
              const { icon, label, colorClass } = getActionInfo(history.actionType);
              return (
                <Card 
                  key={`${history.deviceId}-${history.eventDate}`} 
                  className={`border-l-4 ${colorClass}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">
                          {icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-foreground">
                              {label}
                            </h5>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(history.eventDate)}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-sm text-muted-foreground">
                              {formatTime(history.eventDate)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {`Thiết bị ${deviceCode} - ${label}`}
                          </p>
                          
                          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                            {history.description && (
                              <span>Thực hiện bởi: <span className="font-medium text-foreground">{history.description}</span></span>
                            )}
                            <span>Địa điểm: <span className="font-medium text-foreground">
                              {history.actionType === 'StockIn' || history.actionType === 'StockOut' ? 'Kho' : 'Vị trí sản xuất'}
                            </span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}