"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Package, ArrowRight, Loader2 } from "lucide-react";
import { TASK_IN_GROUP, INSTALL_TASK_DETAIL } from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";

interface DeviceTabProps {
  installationTasks: TASK_IN_GROUP[];
  selectedInstallationTaskId: string | null;
  deviceTabLoading: boolean;
  deviceTabOldDevice: DEVICE_WEB | null;
  deviceTabNewDevice: DEVICE_WEB | null;
  onInstallationTaskSelect: (taskId: string) => void;
  onDeviceClick: (device: DEVICE_WEB, title: string) => void;
}

const DeviceTab = ({
  installationTasks,
  selectedInstallationTaskId,
  deviceTabLoading,
  deviceTabOldDevice,
  deviceTabNewDevice,
  onInstallationTaskSelect,
  onDeviceClick,
}: DeviceTabProps) => {
  if (installationTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-600" />
            Thông tin Thiết bị
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Monitor className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Không có nhiệm vụ lắp đặt
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
              Thông tin thiết bị chỉ khả dụng cho các nhiệm vụ lắp đặt. Nhóm
              nhiệm vụ này không chứa nhiệm vụ lắp đặt nào.
            </p>
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
          Thông tin Thiết bị
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Installation Task Selector */}
          {installationTasks.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                Chọn nhiệm vụ lắp đặt:
              </span>
              {installationTasks.map((task) => (
                <Button
                  key={task.taskId}
                  variant={
                    selectedInstallationTaskId === task.taskId
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => onInstallationTaskSelect(task.taskId)}
                  className="flex items-center gap-1"
                >
                  <Package className="h-3 w-3" />#{task.orderIndex}{" "}
                  {task.taskName}
                </Button>
              ))}
            </div>
          )}

          {deviceTabLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2 text-sm text-gray-600">
                Đang tải thông tin thiết bị...
              </span>
            </div>
          ) : deviceTabOldDevice  ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center">
                {/* Old Device */}
                <Card
                  className="border-red-200 bg-red-50 dark:bg-red-950/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                  onClick={() =>
                    onDeviceClick(
                      deviceTabOldDevice,
                      "Chi tiết Thiết bị Cũ (Tháo)"
                    )
                  }
                >
                  <CardHeader className="text-center pb-3">
                    <CardTitle className="text-sm text-red-700 dark:text-red-300">
                      Thiết bị bảo hành (Tháo)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Monitor className="h-6 w-6 text-red-600 dark:text-red-400" />
                      </div>
                      <h4 className="font-semibold">
                        {deviceTabOldDevice.deviceName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {deviceTabOldDevice.deviceCode}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="font-medium">
                          {deviceTabOldDevice.model || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vị trí:</span>
                        <span className="font-medium">
                          {`${deviceTabOldDevice.areaName}, ${deviceTabOldDevice.zoneName}, ${deviceTabOldDevice.positionIndex}` ||
                            "Trong kho"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-200">
                      <p className="text-xs text-red-600 text-center font-medium">
                        Nhấp để xem chi tiết
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Arrow */}
                <div className="flex justify-center">
                  <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>

                {/* New Device */}
                <Card
                  className="border-green-200 bg-green-50 dark:bg-green-950/30 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                  onClick={() =>
                    deviceTabNewDevice &&
                    onDeviceClick(
                      deviceTabNewDevice,
                      "Chi tiết Thiết bị Mới (Lắp)"
                    )
                  }
                >
                  <CardHeader className="text-center pb-3">
                    <CardTitle className="text-sm text-green-700 dark:text-green-300">
                      Thiết bị thay thế (Lắp)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                        <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      {deviceTabNewDevice ? (
                        <>
                          <h4 className="font-semibold">
                            {deviceTabNewDevice.deviceName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {deviceTabNewDevice.deviceCode}
                          </p>
                        </>
                      ) : (
                        <div>
                          <h4 className="font-semibold text-gray-500">
                            Đang trong quá trình chọn thiết bị
                          </h4>
                          <p className="text-sm text-gray-400">
                            Chờ thủ kho chọn thiết bị thay thế
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Model:</span>
                        <span className="font-medium">
                          {deviceTabNewDevice?.model || "Chưa xác định"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vị trí:</span>
                        <span className="font-medium">
                          {deviceTabNewDevice?.zoneName || "Trong kho"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-green-200">
                      <p className="text-xs text-green-600 text-center font-medium">
                        Nhấp để xem chi tiết
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Monitor className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Thông tin thiết bị không khả dụng
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                Không thể tải thông tin thiết bị cho nhiệm vụ lắp đặt này.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DeviceTab;