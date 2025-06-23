"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Wrench, CheckCircle, AlertTriangle, Clock, TrendingUp, Shield } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { DEVICE_STATISTICS } from "@/types/dashboard.type";
import { Loader2 } from "lucide-react";

const OperationStatsCpn = () => {
  const [deviceStats, setDeviceStats] = useState<DEVICE_STATISTICS | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeviceStatistics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log("🔄 Fetching device statistics for operation stats");

        const response = await apiClient.dashboard.getDeviceStatistics();
        console.log("📦 Full API response:", response);

        // Handle different response structures
        let stats: DEVICE_STATISTICS;

        if (response.data) {
          stats = response.data;
        } else if (response) {
          stats = response as any;
        } else {
          throw new Error("Invalid response structure");
        }

        console.log("📊 Device statistics extracted:", stats);

        // Validate that we have the required fields
        if (typeof stats.totalDevices === 'undefined') {
          console.error("❌ Missing required fields in device statistics:", stats);
          throw new Error("Invalid device statistics format");
        }

        setDeviceStats(stats);
        console.log("✅ Device statistics processed successfully");
      } catch (error: any) {
        console.error("❌ Error fetching device statistics:", error);
        setError(`Failed to load device statistics: ${error.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeviceStatistics();
  }, []);

  // Calculate derived values
  const getCalculatedStats = () => {
    if (!deviceStats) return null;

    const totalOperatedDevices = (deviceStats.totalInUseDevices || 0) +
      (deviceStats.totalInRepairDevices || 0) +
      (deviceStats.totalInWarrantyDevices || 0) +
      (deviceStats.totalDecommissionedDevices || 0);

    const efficiency = totalOperatedDevices > 0
      ? ((deviceStats.totalInUseDevices || 0) / totalOperatedDevices * 100)
      : 0;

    const machinesAwayForService = (deviceStats.totalInRepairDevices || 0) +
      (deviceStats.totalInWarrantyDevices || 0);

    return {
      totalOperatedDevices,
      efficiency,
      machinesAwayForService
    };
  };

  const calculatedStats = getCalculatedStats();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading operation statistics...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div>
            <p className="text-red-500 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-blue-500 underline text-sm"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Thống kê vận hành máy may trong xưởng</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {/* Máy hoạt động */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Wrench className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Máy hoạt động</span>
            </div>
            <div className="text-xl font-bold">
              {deviceStats?.totalInUseDevices || 0}/{calculatedStats?.totalOperatedDevices || 0}
            </div>
            <div className="text-xs text-white-600">Máy</div>
            {/* <div className="text-xs text-muted-foreground">
              {calculatedStats?.totalOperatedDevices ?
                `${((deviceStats?.totalInUseDevices || 0) / calculatedStats.totalOperatedDevices * 100).toFixed(1)}%` :
                '0%'
              }
            </div> */}
          </div>

          {/* Hiệu suất TB */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Hiệu suất TB</span>
            </div>
            <div className="text-xl font-bold">{calculatedStats?.efficiency.toFixed(1) || 0}%</div>
            <div className="text-xs text-green-600">
              {(calculatedStats?.efficiency ?? 0) >= 80 ? '+' : ''}
              {((calculatedStats?.efficiency ?? 0) - 75).toFixed(1)}%
            </div>
          </div>

          {/* Cảnh báo */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Cảnh báo</span>
            </div>
            <div className="text-xl font-bold">{deviceStats?.totalDecommissionedDevices || 0}</div>
            <div className="text-xs text-muted-foreground">Ngừng hoạt động</div>
          </div>

          {/* Máy còn bảo hành */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Shield className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Còn bảo hành</span>
            </div>
            <div className="text-xl font-bold">{deviceStats?.totalDevicesWarrantyValid || 0}</div>
            <div className="text-xs text-green-600">Máy</div>
          </div>

          {/* Máy hết bảo hành */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <Clock className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Hết bảo hành</span>
            </div>
            <div className="text-xl font-bold">{deviceStats?.totalDevicesWarrantyExpired || 0}</div>
            <div className="text-xs text-red-600">Máy</div>
          </div>

          {/* Máy đem đi (bảo hành và sửa) */}
          <div className="space-y-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Đem đi sửa</span>
            </div>
            <div className="text-xl font-bold">{calculatedStats?.machinesAwayForService || 0}</div>
            <div className="text-xs text-muted-foreground">Máy</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OperationStatsCpn;