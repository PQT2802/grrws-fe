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
} from "@/components/ui/dialog";
import { Wrench, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";

interface CreateRepairAfterWarrantyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string;
  deviceName?: string;
  onSuccess?: () => void;
}

export default function CreateRepairAfterWarrantyModal({
  open,
  onOpenChange,
  requestId,
  deviceName,
  onSuccess,
}: CreateRepairAfterWarrantyModalProps) {
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreateRepairTask = async () => {
    try {
      setCreating(true);

      // Call the API to create repair task after warranty
      const response = await apiClient.task.createRepairTaskAfterWarranty(
        requestId
      );

      toast.success("Tạo nhiệm vụ sửa chữa thành công!", {
        description:
          "Nhiệm vụ sửa chữa đã được tạo sau khi bảo hành bị từ chối",
      });

      // Close modal
      onOpenChange(false);

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate to the new task group page if response contains taskGroupId
      if (response?.taskGroupId) {
        router.push(`/workspace/hot/tasks/group/${response.taskGroupId}`);
      } else {
        // If no specific task group ID, refresh current page
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create repair task after warranty:", error);
      toast.error("Không thể tạo nhiệm vụ sửa chữa", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-500" />
            Tạo nhiệm vụ sửa chữa
          </DialogTitle>
          <DialogDescription>
            Xác nhận tạo nhiệm vụ sửa chữa sau khi yêu cầu bảo hành bị từ chối
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-orange-800">
                Xác nhận tạo nhiệm vụ sửa chữa
              </h4>
              <p className="text-sm text-orange-700">
                Sau khi yêu cầu bảo hành bị từ chối, hệ thống sẽ tạo một nhiệm
                vụ sửa chữa mới
                {deviceName && ` cho thiết bị "${deviceName}"`}.
              </p>
              <p className="text-sm text-orange-700">
                Bạn có chắc chắn muốn tiếp tục không?
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={creating}
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleCreateRepairTask}
            disabled={creating}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {creating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4 mr-2" />
                Tạo nhiệm vụ sửa chữa
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
