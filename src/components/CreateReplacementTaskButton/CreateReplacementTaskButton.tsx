"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/DateTimePicker/DateTimePicker";
import { toast } from "sonner";
import { Loader2, Package, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { REPLACEMENT_TASK, Priority } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { DEVICE_WEB } from "@/types/device.type";

interface CreateReplacementTaskButtonProps {
  onSuccess?: () => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  buttonSize?: "sm" | "default" | "lg";
  triggerElement?: React.ReactNode; // Custom trigger element
  oldDeviceId?: string; // Pre-fill old device
  positionId?: string; // Pre-fill position
}

const CreateReplacementTaskButton = ({
  onSuccess,
  buttonText = "Tạo nhiệm vụ thay thế",
  buttonVariant = "default",
  buttonSize = "default",
  triggerElement,
  oldDeviceId = "",
  positionId = "",
}: CreateReplacementTaskButtonProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [devices, setDevices] = useState<DEVICE_WEB[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [positions, setPositions] = useState<any[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);

  const [formData, setFormData] = useState<REPLACEMENT_TASK>({
    NewDeviceId: undefined,
    OldDeviceId: oldDeviceId,
    AssigneeId: undefined,
    StartDate: new Date(),
    TaskGroupId: undefined,
    PositionId: positionId,
    IsReinstall: false,
    Priority: Priority.Medium,
    Notes: undefined,
  });

  const fetchMechanics = async () => {
    try {
      setMechanicsLoading(true);
      const mechanicData = await apiClient.user.getMechanic();
      setMechanics(mechanicData);
    } catch (error) {
      console.error("Failed to fetch mechanics:", error);
      toast.error("Không thể tải danh sách kỹ thuật viên");
    } finally {
      setMechanicsLoading(false);
    }
  };

  const fetchDevices = async () => {
    try {
      setDevicesLoading(true);
      const deviceData = await apiClient.device.getDevices(1, 100, {
        status: "Active",
      });
      setDevices(deviceData);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      toast.error("Không thể tải danh sách thiết bị");
    } finally {
      setDevicesLoading(false);
    }
  };

  const fetchPositions = async () => {
    try {
      setPositionsLoading(true);
      const positionData = await apiClient.location.getPositions(1, 100);
      setPositions(positionData.data || []);
    } catch (error) {
      console.error("Failed to fetch positions:", error);
      toast.error("Không thể tải danh sách vị trí");
    } finally {
      setPositionsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      fetchMechanics();
      fetchDevices();
      fetchPositions();
      // Reset form when opening
      setFormData({
        NewDeviceId: undefined,
        OldDeviceId: oldDeviceId,
        AssigneeId: undefined,
        StartDate: new Date(),
        TaskGroupId: undefined,
        PositionId: positionId,
        IsReinstall: false,
        Priority: Priority.Medium,
        Notes: undefined,
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.OldDeviceId) {
      toast.error("Vui lòng chọn thiết bị cũ cần thay thế");
      return;
    }

    if (!formData.PositionId) {
      toast.error("Vui lòng chọn vị trí lắp đặt");
      return;
    }

    if (!formData.IsReinstall && !formData.NewDeviceId) {
      toast.error("Vui lòng chọn thiết bị mới hoặc đánh dấu là tái lắp đặt");
      return;
    }

    try {
      setLoading(true);

      // Prepare data for API - convert undefined to appropriate values
      const apiData: REPLACEMENT_TASK = {
        ...formData,
        StartDate: formData.StartDate,
        AssigneeId: formData.AssigneeId || undefined,
        TaskGroupId: formData.TaskGroupId || undefined,
        NewDeviceId: formData.IsReinstall ? undefined : (formData.NewDeviceId || undefined),
      };

      console.log("Creating replacement task with data:", apiData);

      await apiClient.task.createReplacementTask(apiData);

      toast.success("Tạo nhiệm vụ thay thế thành công!", {
        description: "Nhiệm vụ thay thế thiết bị đã được tạo và sẵn sàng thực hiện",
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Failed to create replacement task:", error);
      toast.error("Không thể tạo nhiệm vụ thay thế", {
        description: error?.response?.data?.message || "Vui lòng thử lại sau",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedOldDevice = devices.find(d => d.id === formData.OldDeviceId);
  const selectedNewDevice = devices.find(d => d.id === formData.NewDeviceId);
  const selectedPosition = positions.find(p => p.id === formData.PositionId);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerElement || (
          <Button variant={buttonVariant} size={buttonSize}>
            <Package className="h-4 w-4 mr-2" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Tạo nhiệm vụ thay thế thiết bị
          </DialogTitle>
          <DialogDescription>
            Tạo nhiệm vụ thay thế thiết bị cũ bằng thiết bị mới hoặc tái lắp đặt thiết bị hiện tại
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Old Device Selection */}
          <div className="space-y-2">
            <Label htmlFor="oldDevice">
              Thiết bị cũ cần thay thế <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.OldDeviceId || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, OldDeviceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn thiết bị cần thay thế">
                  {devicesLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  ) : (
                    selectedOldDevice && `${selectedOldDevice.deviceName} - ${selectedOldDevice.deviceCode}`
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {devicesLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải thiết bị...
                  </div>
                ) : (
                  devices.map((device) => (
                    <SelectItem key={device.id} value={device.id}>
                      <div className="flex flex-col">
                        <span>{device.deviceName}</span>
                        <span className="text-xs text-gray-500">{device.deviceCode}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Position Selection */}
          <div className="space-y-2">
            <Label htmlFor="position">
              Vị trí lắp đặt <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.PositionId || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, PositionId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn vị trí lắp đặt">
                  {positionsLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  ) : (
                    selectedPosition && selectedPosition.positionName
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {positionsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải vị trí...
                  </div>
                ) : (
                  positions.map((position) => (
                    <SelectItem key={position.positionId} value={position.positionId}>
                      <div className="flex flex-col">
                        <span>{position.positionName}</span>
                        <span className="text-xs text-gray-500">
                          {position.zoneName} - {position.areaName}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Reinstall Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="isReinstall"
              checked={formData.IsReinstall}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ 
                  ...prev, 
                  IsReinstall: checked as boolean,
                  NewDeviceId: checked ? undefined : prev.NewDeviceId
                }))
              }
            />
            <Label htmlFor="isReinstall" className="text-sm font-medium">
              Tái lắp đặt thiết bị hiện tại (không cần thiết bị mới)
            </Label>
          </div>

          {/* New Device Selection - Only show if not reinstall */}
          {!formData.IsReinstall && (
            <div className="space-y-2">
              <Label htmlFor="newDevice">
                Thiết bị mới {!formData.IsReinstall && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={formData.NewDeviceId || ""}
                onValueChange={(value) => setFormData(prev => ({ ...prev, NewDeviceId: value || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thiết bị mới">
                    {devicesLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải...
                      </div>
                    ) : (
                      selectedNewDevice && `${selectedNewDevice.deviceName} - ${selectedNewDevice.deviceCode}`
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {devicesLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang tải thiết bị...
                    </div>
                  ) : (
                    devices
                      .filter(device => device.id !== formData.OldDeviceId)
                      .map((device) => (
                        <SelectItem key={device.id} value={device.id}>
                          <div className="flex flex-col">
                            <span>{device.deviceName}</span>
                            <span className="text-xs text-gray-500">{device.deviceCode}</span>
                          </div>
                        </SelectItem>
                      ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mechanic Assignment */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Kỹ thuật viên thực hiện</Label>
            <Select
              value={formData.AssigneeId || ""}
              onValueChange={(value) => setFormData(prev => ({ ...prev, AssigneeId: value || undefined }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn kỹ thuật viên (tùy chọn)">
                  {mechanicsLoading && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải...
                    </div>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Không phân công</SelectItem>
                {mechanicsLoading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tải kỹ thuật viên...
                  </div>
                ) : (
                  mechanics.map((mechanic) => (
                    <SelectItem key={mechanic.id} value={mechanic.id}>
                      {mechanic.fullName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label htmlFor="priority">Mức độ ưu tiên</Label>
            <Select
              value={formData.Priority}
              onValueChange={(value) => setFormData(prev => ({ ...prev, Priority: value as Priority }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Priority.Low}>Thấp</SelectItem>
                <SelectItem value={Priority.Medium}>Trung bình</SelectItem>
                <SelectItem value={Priority.High}>Cao</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate">Thời gian bắt đầu</Label>
            <DateTimePicker
              date={formData.StartDate || new Date()}
              setDate={(date) => setFormData(prev => ({ ...prev, StartDate: date }))}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú</Label>
            <Textarea
              id="notes"
              placeholder="Nhập ghi chú về nhiệm vụ thay thế..."
              value={formData.Notes || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, Notes: e.target.value || undefined }))}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Đang tạo...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Tạo nhiệm vụ
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateReplacementTaskButton;