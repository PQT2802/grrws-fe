import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEVICE_WEB } from "@/types/device.type";
import { INSTALL_TASK_DETAIL, WARRANTY_TASK_DETAIL } from "@/types/task.type";
import { Monitor, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";

interface DeviceInfoCardProps {
  deviceDetail: DEVICE_WEB | null;
  taskDetail: WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL;
}

const DeviceInfoCard = ({ deviceDetail, taskDetail }: DeviceInfoCardProps) => {
  const loadDeviceDetail = () => {
    if (taskDetail.deviceId) {
      toast.info("Attempting to reload device information");
      apiClient.device
        .getDeviceById(taskDetail.deviceId)
        .then((data) => {
          toast.success("Device information loaded successfully");
          // We need to handle this in the parent component
        })
        .catch((err) => {
          toast.error("Could not load device information");
          console.error(err);
        });
    }
  };

  if (!deviceDetail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-600" />
            Device Information
          </CardTitle>
          <CardDescription>
            Details about the device under warranty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Monitor className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Device Information Not Available
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
              The detailed information for this device could not be loaded.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={loadDeviceDetail}
            >
              Reload Device Information
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-5 w-5 text-green-600" />
          Device Information
        </CardTitle>
        <CardDescription>
          Details about the device under warranty
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-100 dark:border-green-800">
            <div className="flex-shrink-0 flex justify-center">
              <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Monitor className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                {deviceDetail.deviceName || "N/A"}
              </h3>
              <div className="text-sm text-green-800 dark:text-green-300">
                {deviceDetail.deviceCode || "No Code"}
              </div>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="outline" className="bg-white dark:bg-gray-900">
                  {deviceDetail.status || "Unknown Status"}
                </Badge>
                <Badge
                  className={
                    deviceDetail.isUnderWarranty
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  }
                >
                  {deviceDetail.isUnderWarranty
                    ? "Under Warranty"
                    : "No Warranty"}
                </Badge>
              </div>
            </div>

            {deviceDetail.photoUrl && (
              <div className="w-20 h-20 rounded overflow-hidden border border-green-200 flex-shrink-0">
                <img
                  src={deviceDetail.photoUrl}
                  alt={deviceDetail.deviceName || "Device"}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Device Details in Two Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Specifications
              </h4>

              <div className="space-y-2 text-sm">
                {deviceDetail.model && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Model
                    </span>
                    <span className="font-medium">{deviceDetail.model}</span>
                  </div>
                )}

                {deviceDetail.manufacturer && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Manufacturer
                    </span>
                    <span className="font-medium">
                      {deviceDetail.manufacturer}
                    </span>
                  </div>
                )}

                {deviceDetail.serialNumber && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Serial Number
                    </span>
                    <span className="font-medium font-mono">
                      {deviceDetail.serialNumber}
                    </span>
                  </div>
                )}

                {deviceDetail.supplier && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Supplier
                    </span>
                    <span className="font-medium">{deviceDetail.supplier}</span>
                  </div>
                )}

                {deviceDetail.purchasePrice > 0 && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Purchase Price
                    </span>
                    <span className="font-medium">
                      ${deviceDetail.purchasePrice.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-green-700 flex items-center gap-1">
                <Info className="h-4 w-4" />
                Installation Details
              </h4>

              <div className="space-y-2 text-sm">
                {deviceDetail.zoneName && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Zone
                    </span>
                    <span className="font-medium">{deviceDetail.zoneName}</span>
                  </div>
                )}

                {deviceDetail.areaName && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Area
                    </span>
                    <span className="font-medium">{deviceDetail.areaName}</span>
                  </div>
                )}

                {deviceDetail.installationDate && (
                  <div className="flex justify-between px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400">
                      Installation Date
                    </span>
                    <span className="font-medium">
                      {formatAPIDateToHoChiMinh(
                        deviceDetail.installationDate,
                        "date"
                      )}
                    </span>
                  </div>
                )}

                {deviceDetail.specifications && (
                  <div className="flex flex-col px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-800">
                    <span className="text-gray-600 dark:text-gray-400 mb-1">
                      Specifications
                    </span>
                    <span>{deviceDetail.specifications}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceInfoCard;
