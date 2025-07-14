"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import { DEVICE_WEB } from "@/types/device.type";
import {
  Monitor,
  Calendar,
  DollarSign,
  Package,
  MapPin,
  Settings,
  Info,
  Building,
  Hash,
  X,
  Shield,
  Image,
} from "lucide-react";

interface DeviceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: DEVICE_WEB | null;
  title?: string;
}

const DeviceDetailModal = ({
  isOpen,
  onClose,
  device,
  title = "Chi tiết Thiết bị",
}: DeviceDetailModalProps) => {
  if (!device) return null;

  const getStatusColor = (status: DEVICE_WEB["status"]) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "Inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "InUse":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "InRepair":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "InWarranty":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "Decommissioned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: DEVICE_WEB["status"]) => {
    switch (status) {
      case "Active":
        return "Hoạt động";
      case "Inactive":
        return "Không hoạt động";
      case "InUse":
        return "Đang sử dụng";
      case "InRepair":
        return "Đang sửa chữa";
      case "InWarranty":
        return "Trong bảo hành";
      case "Decommissioned":
        return "Ngừng hoạt động";
      default:
        return "Không xác định";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-blue-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Thông tin chi tiết đầy đủ về thiết bị {device.deviceName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Photo */}
          {device.photoUrl && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Image className="h-4 w-4 text-indigo-600" />
                  Hình ảnh Thiết bị
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <img
                    src={device.photoUrl}
                    alt={device.deviceName}
                    className="max-w-full h-48 object-cover rounded-lg border"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4 text-blue-600" />
                Thông tin Cơ bản
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tên thiết bị
                </label>
                <p className="text-sm font-medium">{device.deviceName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Mã thiết bị
                </label>
                <p className="text-sm font-medium">{device.deviceCode}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Model
                </label>
                <p className="text-sm">{device.model || "Không có"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Số sê-ri
                </label>
                <p className="text-sm">{device.serialNumber || "Không có"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Trạng thái
                </label>
                <Badge className={`${getStatusColor(device.status)} text-xs`}>
                  {getStatusText(device.status)}
                </Badge>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Chỉ số vị trí
                </label>
                <p className="text-sm">
                  {device.positionIndex !== null
                    ? device.positionIndex
                    : "Không có"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-green-600" />
                Thông tin Vị trí
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {device.zoneName && device.areaName && device.positionId ? (
                <>
                  {" "}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Khu vực
                    </label>
                    <p className="text-sm">{device.zoneName || "Không có"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Khu vực chi tiết
                    </label>
                    <p className="text-sm">{device.areaName || "Không có"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Vị trí
                    </label>
                    <p className="text-sm font-mono">
                      {device.positionId || "Không có"}
                    </p>
                  </div>{" "}
                </>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    ID vị trí
                  </label>
                  <p className="text-sm font-mono">{"Trong kho"}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">
                  ID máy móc
                </label>
                <p className="text-sm font-mono">
                  {device.id || "Không có"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Manufacturing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building className="h-4 w-4 text-purple-600" />
                Thông tin Sản xuất
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nhà sản xuất
                </label>
                <p className="text-sm">{device.manufacturer || "Không có"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ngày sản xuất
                </label>
                <p className="text-sm">
                  {device.manufactureDate
                    ? formatAPIDateToHoChiMinh(device.manufactureDate, "date")
                    : "Không có"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ngày lắp đặt
                </label>
                <p className="text-sm">
                  {device.installationDate
                    ? formatAPIDateToHoChiMinh(device.installationDate, "date")
                    : "Không có"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <DollarSign className="h-4 w-4 text-green-600" />
                Thông tin Mua sắm
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Giá mua
                </label>
                <p className="text-sm font-medium">
                  {device.purchasePrice
                    ? `${device.purchasePrice.toLocaleString()} VND`
                    : "Không có"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Nhà cung cấp
                </label>
                <p className="text-sm">{device.supplier || "Không có"}</p>
              </div>
            </CardContent>
          </Card>

          {/* Warranty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="h-4 w-4 text-orange-600" />
                Thông tin Bảo hành
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Tình trạng bảo hành
                </label>
                <Badge
                  className={
                    device.isUnderWarranty
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }
                >
                  {device.isUnderWarranty ? "Còn bảo hành" : "Hết bảo hành"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Technical Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Hash className="h-4 w-4 text-indigo-600" />
                Thông tin Kỹ thuật
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {device.specifications && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Thông số kỹ thuật
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <p className="text-sm whitespace-pre-wrap">
                      {device.specifications}
                    </p>
                  </div>
                </div>
              )}

              {device.description && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Mô tả
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                    <p className="text-sm whitespace-pre-wrap">
                      {device.description}
                    </p>
                  </div>
                </div>
              )}

              {!device.specifications && !device.description && (
                <div className="text-center py-4">
                  <Hash className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Không có thông tin kỹ thuật
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-gray-600" />
                Thông tin Hệ thống
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Ngày tạo
                </label>
                <p className="text-sm">
                  {device.createdDate
                    ? formatAPIDateToHoChiMinh(device.createdDate, "datetime")
                    : "Không có"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Cập nhật lần cuối
                </label>
                <p className="text-sm">
                  {device.modifiedDate
                    ? formatAPIDateToHoChiMinh(device.modifiedDate, "datetime")
                    : "Không có"}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  ID thiết bị
                </label>
                <p className="text-sm font-mono">{device.id}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeviceDetailModal;
