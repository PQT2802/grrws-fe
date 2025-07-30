"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import {
  Loader2,
  Monitor,
  Package,
  CalendarIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api-client";
import { CREATE_INSTALL_TASK } from "@/types/task.type";

// Form schema for validation
const reinstallFormSchema = z.object({
  date: z.date({
    required_error: "Vui lòng chọn ngày",
  }),
  time: z.string({
    required_error: "Vui lòng chọn giờ",
  }),
});

type FormValues = z.infer<typeof reinstallFormSchema>;

interface CreateReinstallTaskButtonProps {
  requestId: string;
  taskGroupId: string;
  deviceId: string;
  deviceName?: string;
  onSuccess?: () => Promise<void>;
}

const CreateReinstallTaskButton = ({
  requestId,
  taskGroupId,
  deviceId,
  deviceName = "Thiết bị cũ",
  onSuccess,
}: CreateReinstallTaskButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(reinstallFormSchema),
    defaultValues: {
      date: new Date(),
      time: format(new Date(), "HH:mm"),
    },
  });

  // Automatically set current date and time as default when dialog opens
  const handleDialogOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      const now = new Date();
      // Only reset if user hasn't changed the value (i.e., value is empty or invalid)
      const currentDate = form.getValues("date");
      const currentTime = form.getValues("time");
      if (
        !currentDate ||
        isNaN(new Date(currentDate).getTime())
      ) {
        form.setValue("date", now);
      }
      if (
        !currentTime ||
        !/^\d{2}:\d{2}$/.test(currentTime)
      ) {
        form.setValue("time", format(now, "HH:mm"));
      }
    }
    // Only allow closing if we're not submitting
    if (!isSubmitting) {
      setOpen(newOpen);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      const startDate = new Date(values.date);
      const [hours, minutes] = values.time.split(":").map(Number);
      startDate.setHours(hours, minutes);

      // Create the task with the old device as the new device to reinstall
      const data: CREATE_INSTALL_TASK = {
        RequestId: requestId,
        StartDate: startDate.toISOString(),
        AssigneeId: null, // Will be assigned later
        TaskGroupId: taskGroupId,
        NewDeviceId: deviceId, // Use the old device ID
      };

      await apiClient.task.createInstallTask(data);

      toast.success("Nhiệm vụ lắp lại thiết bị đã được tạo thành công", {
        description: `Lắp lại vào: ${format(startDate, "dd/MM/yyyy HH:mm")}`,
      });

      // Close dialog and refresh data
      setOpen(false);
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error) {
      console.error("Failed to create reinstall task:", error);
      toast.error("Không thể tạo nhiệm vụ lắp lại thiết bị", {
        description: "Vui lòng thử lại hoặc liên hệ bộ phận hỗ trợ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get the current time for min time validation
  const now = new Date();
  const isToday = (day: Date) => {
    return (
      day.getDate() === now.getDate() &&
      day.getMonth() === now.getMonth() &&
      day.getFullYear() === now.getFullYear()
    );
  };

  return (
    <>
      <Button
        variant="default"
        onClick={() => setOpen(true)}
        className="bg-orange-500 hover:bg-orange-600"
      >
        <Package className="h-4 w-4 mr-2" />
        Tạo nhiệm vụ lắp lại
      </Button>

      <Dialog
        open={open}
        onOpenChange={handleDialogOpenChange}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tạo nhiệm vụ lắp lại thiết bị</DialogTitle>
            <DialogDescription>
              Thiết bị sẽ được lắp lại theo thời gian đã chọn. Kỹ thuật viên sẽ
              được giao sau.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-200 dark:border-gray-700 mb-4">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Thiết bị cần lắp lại:
                </div>
                <div className="text-sm font-medium flex items-center mt-1">
                  <Monitor className="h-4 w-4 mr-2 text-blue-500" />
                  {deviceName}
                </div>
              </div>

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-baseline justify-between mb-1">
                      <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                        Ngày lắp đặt
                      </FormLabel>
                      <FormMessage className="text-[10px]" />
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-2 top-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <Input
                          type="text"
                          className="pl-8 text-xs h-8 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 rounded-md"
                          value={
                            field.value ? format(field.value, "dd/MM/yyyy") : ""
                          }
                          placeholder="DD/MM/YYYY"
                          readOnly
                          onClick={() => {
                            const hiddenInput = document.getElementById(
                              "hidden-date-picker-install"
                            );
                            if (hiddenInput)
                              (hiddenInput as HTMLInputElement).showPicker();
                          }}
                        />
                        <input
                          id="hidden-date-picker-install"
                          type="date"
                          className="opacity-0 absolute top-0 left-0 w-0 h-0"
                          min={format(new Date(), "yyyy-MM-dd")}
                          value={
                            field.value ? format(field.value, "yyyy-MM-dd") : ""
                          }
                          onChange={(e) => {
                            const date = e.target.valueAsDate || new Date();
                            field.onChange(date);
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-baseline justify-between">
                      <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                        Giờ lắp đặt
                      </FormLabel>
                      <FormMessage className="text-[10px]" />
                    </div>
                    <FormControl>
                      <div className="relative">
                        {/* Icon phía trước giữ lại */}
                        <Clock className="absolute left-2 top-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <Input
                          type="time"
                          className="pl-8 text-xs h-8 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 rounded-md"
                          onFocus={(e) =>
                            (e.target as HTMLInputElement).showPicker()
                          }
                          onKeyDown={(e) => e.preventDefault()}
                          {...field}
                          min={
                            isToday(form.getValues("date"))
                              ? format(new Date(), "HH:mm")
                              : undefined
                          }
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  type="button"
                  disabled={isSubmitting}
                >
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <Package className="mr-2 h-4 w-4" />
                      Tạo nhiệm vụ lắp lại
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateReinstallTaskButton;
