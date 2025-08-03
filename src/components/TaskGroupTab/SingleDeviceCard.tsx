import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Monitor, Loader2, Eye } from "lucide-react";
import { DEVICE_WEB } from "@/types/device.type";
import { Button } from "@/components/ui/button";

interface SingleDeviceCardProps {
  singleDevice: DEVICE_WEB | null;
  singleDeviceLoading: boolean;
  onDeviceClick?: (device: DEVICE_WEB, title: string) => void;
}

const SingleDeviceCard = ({
  singleDevice,
  singleDeviceLoading,
  onDeviceClick,
}: SingleDeviceCardProps) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Monitor className="h-5 w-5 text-green-600" />
        Thông tin Thiết bị
      </CardTitle>
    </CardHeader>
    <CardContent>
      {singleDeviceLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600">
            Đang tải thông tin thiết bị...
          </span>
        </div>
      ) : singleDevice ? (
        <div className="space-y-3">
          <div className="text-center">
            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
              <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <h4 className="font-semibold">{singleDevice.deviceName}</h4>
            <p className="text-sm text-gray-600">{singleDevice.deviceCode}</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span>Model:</span>
              <span className="font-medium">
                {singleDevice.model || "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Vị trí:</span>
              <span className="font-medium">
                {`${singleDevice.areaName}, ${singleDevice.zoneName}, ${singleDevice.positionIndex}` || "Trong kho"}
              </span>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onDeviceClick && onDeviceClick(singleDevice, "Chi tiết thiết bị")
              }
              disabled={!onDeviceClick}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4 mr-1" />
              Xem chi tiết
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Monitor className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Không thể tải thông tin thiết bị
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
            Không có thiết bị nào liên kết với nhiệm vụ sửa chữa này.
          </p>
        </div>
      )}
    </CardContent>
  </Card>
);

export default SingleDeviceCard;