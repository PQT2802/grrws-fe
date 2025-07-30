"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { Loader2, Monitor, Package, CalendarIcon } from "lucide-react";
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
        className="bg-green-600 hover:bg-green-700"
      >
        <Package className="h-4 w-4 mr-2" />
        Tạo nhiệm vụ lắp lại
      </Button>

      <Dialog
        open={open}
        onOpenChange={(newOpen) => {
          // Only allow closing if we're not submitting
          if (!isSubmitting) {
            setOpen(newOpen);
          }
        }}
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
                    <FormLabel>Ngày lắp đặt</FormLabel>
                    <FormControl>
                      <div className="relative focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary">
                        {/* Show the native date picker more clearly */}
                        <div className="flex items-center border rounded-md overflow-hidden">
                          <div className="flex-1 px-3 py-2">
                            <span
                              className={
                                field.value
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              }
                            >
                              {field.value
                                ? format(field.value, "dd/MM/yyyy")
                                : "Chọn ngày"}
                            </span>
                          </div>

                          <Input
                            type="date"
                            className="absolute inset-0 text-transparent bg-transparent caret-transparent cursor-pointer z-10"
                            {...field}
                            value={
                              field.value
                                ? format(field.value, "yyyy-MM-dd")
                                : ""
                            }
                            min={format(new Date(), "yyyy-MM-dd")}
                            onChange={(e) => {
                              const date = e.target.valueAsDate || new Date();
                              field.onChange(date);
                            }}
                          />
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Giờ lắp đặt</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        min={
                          isToday(form.getValues("date"))
                            ? format(now, "HH:mm")
                            : undefined
                        }
                      />
                    </FormControl>
                    <FormMessage />
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
