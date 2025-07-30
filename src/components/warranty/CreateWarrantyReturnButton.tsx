"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { WARRANTY_TASK_DETAIL } from "@/types/task.type";
import {
  ArrowRight,
  Calendar,
  Clock,
  Loader2,
  Shield,
  UserCheck,
  Zap,
  PackageCheck,
  InfoIcon,
  FileText,
  X,
  Check,
} from "lucide-react";
import { format, isBefore, set } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn, getCurrentTime, getFormattedDate } from "@/lib/utils";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import formatDisplayDate from "@/utils/formatDisplay";

// Form schema
const formSchema = z.object({
  mode: z.enum(["auto", "manual"], {
    required_error: "Please select a creation mode",
  }),
  mechanicId: z.string().optional(),
  actualReturnDate: z.string({
    required_error: "Return date is required",
  }),
  actualReturnTime: z.string({
    required_error: "Return time is required",
  }),
  useExpectedDate: z.boolean().optional(),
  warrantyNotes: z.string().optional(),
  // Remove the warrantyStatus field as we'll use props instead
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWarrantyReturnButtonProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  isReinstall?: boolean;
  isFailed?: boolean;
}

const CreateWarrantyReturnButton = ({
  taskDetail,
  onSuccess,
  open,
  onOpenChange,
  isReinstall,
  isFailed,
}: CreateWarrantyReturnButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const isOpen = open !== undefined ? open : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "auto",
      actualReturnDate: taskDetail.actualReturnDate
        ? getFormattedDate(taskDetail.actualReturnDate)
        : getFormattedDate(taskDetail.expectedReturnDate),
      actualReturnTime: taskDetail?.expectedReturnDate
        ? format(new Date(taskDetail.expectedReturnDate), "HH:mm")
        : getCurrentTime(),
      useExpectedDate: true,
      warrantyNotes: "",
      // Use the returnOption from the previous step if available
    },
  });

  // Watch form fields
  const mode = form.watch("mode");
  const useExpectedDate = form.watch("useExpectedDate");

  // Fetch mechanics when dialog opens
  useEffect(() => {
    const fetchMechanics = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const mechanicsData = await apiClient.user.getMechanic();
        setMechanics(mechanicsData);
        if (mode === "auto" && mechanicsData.length > 0) {
          form.setValue("mechanicId", mechanicsData[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch mechanics:", error);
        toast.error("Failed to load mechanics list");
      } finally {
        setLoading(false);
      }
    };

    fetchMechanics();
  }, [isOpen, mode, form]);

  // Auto-check useExpectedDate when mode is set to auto
  useEffect(() => {
    if (mode === "auto") {
      form.setValue("useExpectedDate", true);
    }
  }, [mode, form]);

  // Update date when useExpectedDate changes
  useEffect(() => {
    if (useExpectedDate && taskDetail.expectedReturnDate) {
      const expectedDate = new Date(taskDetail.expectedReturnDate);
      form.setValue(
        "actualReturnDate",
        getFormattedDate(taskDetail.expectedReturnDate)
      );
      form.setValue("actualReturnTime", format(expectedDate, "HH:mm"));
    }
  }, [useExpectedDate, taskDetail.expectedReturnDate, form]);

  // Combine date and time
  const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid date format");
    }
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      throw new Error("Invalid time format");
    }
    return set(parsedDate, { hours, minutes, seconds: 0, milliseconds: 0 });
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const combinedDateTime = combineDateAndTime(
        values.actualReturnDate,
        values.actualReturnTime
      );

      let isEarlyReturn = true;
      if (taskDetail.expectedReturnDate) {
        const expectedDate = new Date(taskDetail.expectedReturnDate);
        isEarlyReturn = !isBefore(combinedDateTime, expectedDate);
      }

      const submitData = {
        WarrantyClaimId: taskDetail.warrantyClaimId,
        AssigneeId:
          values.mode === "auto" && mechanics && mechanics.length > 0
            ? mechanics[0].id
            : values.mechanicId!,
        ActualReturnDate: combinedDateTime.toISOString(),
        IsEarlyReturn: isEarlyReturn,
        WarrantyNotes: values.warrantyNotes || "",
        IsWarrantyFailed: false,
        IsReInstallOldDevice: false, // Default to true if not provided
      };

      await apiClient.task.createWarrantyReturnTask(submitData);

      toast.success("Warranty return task created successfully", {
        description: `Return date: ${format(combinedDateTime, "PPp")}`,
      });

      handleOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to create warranty return task:", error);
      toast.error("Failed to create warranty return task", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Only show button for WarrantySubmission tasks
  if (taskDetail.taskType !== "WarrantySubmission") {
    return null;
  }

  return (
    <>
      {open === undefined && (
        <Button
          onClick={() => handleOpenChange(true)}
          className="bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow transition-all"
        >
          <PackageCheck className="h-4 w-4 mr-2" />
          Tạo Trả Bảo hành
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-xl">
          <div className="bg-gradient-to-r from-green-50 to-white dark:from-green-900/20 dark:to-gray-800 p-6 rounded-t-xl border-b border-green-100 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
                  <PackageCheck className="h-5 w-5" />
                  Tạo Nhiệm vụ Trả Bảo hành
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
                  >
                    Mã #{taskDetail?.claimNumber || "N/A"}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                    {taskDetail.taskType}
                  </Badge>
                  {taskDetail.expectedReturnDate && (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1"
                    >
                      <Calendar className="h-3 w-3" />
                      Ngày trả dự kiến:{" "}
                      {format(
                        new Date(taskDetail.expectedReturnDate),
                        "dd/MM/yyyy"
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Tabs
              defaultValue="schedule"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger
                  value="schedule"
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Lịch trả</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mechanic"
                  className="flex items-center gap-2"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Kỹ thuật viên</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  <span>Ghi chú</span>
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                >
                  <TabsContent value="schedule" className="m-0">
                    <Card className="border-blue-100 dark:border-blue-800 shadow-sm">
                      <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 pb-3 pt-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                          <Calendar className="h-4 w-4" />
                          Lịch trả bảo hành
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="mode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                Chế độ tạo
                              </FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    if (value === "auto") {
                                      setActiveTab("details");
                                      form.setValue("useExpectedDate", true);
                                    }
                                  }}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-2 mt-2"
                                >
                                  <FormItem className="flex items-center space-x-3 space-y-0 border border-blue-100 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                                    <FormControl>
                                      <RadioGroupItem value="auto" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1 m-0">
                                      <div className="font-medium">Tự động</div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Tự động gán kỹ thuật viên có sẵn đầu
                                        tiên
                                      </p>
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-3 space-y-0 border border-blue-100 dark:border-blue-800 rounded-lg p-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                                    <FormControl>
                                      <RadioGroupItem value="manual" />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer flex-1 m-0">
                                      <div className="font-medium">
                                        Thủ công
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Chọn kỹ thuật viên cụ thể và đặt lịch
                                      </p>
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {taskDetail.expectedReturnDate && (
                          <FormField
                            control={form.control}
                            name="useExpectedDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-amber-100 dark:border-amber-800 rounded-lg bg-amber-50/50 dark:bg-amber-900/10">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="border-amber-500 data-[state=checked]:bg-amber-500"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-sm font-medium text-amber-700 dark:text-amber-300">
                                    Sử dụng ngày trả dự kiến
                                  </FormLabel>
                                  <FormDescription className="text-xs text-amber-600 dark:text-amber-400">
                                    Dùng ngày trả dự kiến từ yêu cầu bảo hành (
                                    {taskDetail.expectedReturnDate &&
                                      format(
                                        new Date(taskDetail.expectedReturnDate),
                                        "dd/MM/yyyy HH:mm"
                                      )}
                                    )
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                          <FormField
                            control={form.control}
                            name="actualReturnDate"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-between">
                                <FormLabel className="text-sm text-gray-600 dark:text-gray-400">
                                  Ngày trả thực tế
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                                    <div className="relative">
                                      <Input
                                        type="text"
                                        className="pl-9 h-10 w-full text-sm border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600"
                                        value={
                                          field.value
                                            ? formatDisplayDate(field.value)
                                            : ""
                                        }
                                        onClick={() => {
                                          const hiddenInput =
                                            document.getElementById(
                                              "hidden-date-picker"
                                            );
                                          if (hiddenInput)
                                            (
                                              hiddenInput as HTMLInputElement
                                            ).showPicker();
                                        }}
                                        readOnly
                                        disabled={useExpectedDate}
                                        placeholder="DD/MM/YYYY"
                                      />
                                      <input
                                        id="hidden-date-picker"
                                        type="date"
                                        className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                        min={today}
                                        value={field.value}
                                        onChange={(e) =>
                                          field.onChange(e.target.value)
                                        }
                                        disabled={useExpectedDate}
                                      />
                                    </div>
                                  </div>
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="actualReturnTime"
                            render={({ field }) => (
                              <FormItem className="flex flex-col justify-between">
                                <FormLabel className="text-sm text-gray-600 dark:text-gray-400">
                                  Giờ trả thực tế
                                </FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                                    <Input
                                      type="time"
                                      {...field}
                                      onClick={(e) =>
                                        (
                                          e.target as HTMLInputElement
                                        ).showPicker()
                                      }
                                      className="pl-9 h-10 w-full text-sm border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600"
                                      disabled={useExpectedDate}
                                    />
                                  </div>
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="flex justify-end mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("mechanic")}
                            className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
                          >
                            Tiếp theo: Kỹ thuật viên
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="mechanic" className="m-0">
                    <Card className="border-orange-100 dark:border-orange-800 shadow-sm">
                      <CardHeader className="bg-orange-50/50 dark:bg-orange-900/10 pb-3 pt-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
                          <UserCheck className="h-4 w-4" />
                          Chọn Kỹ thuật viên
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        {mode === "auto" ? (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                            <div className="flex items-center">
                              <Zap className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                              <span className="font-medium text-green-700 dark:text-green-300">
                                Chế độ tự động
                              </span>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                              Hệ thống sẽ tự động gán kỹ thuật viên có sẵn đầu
                              tiên cho nhiệm vụ trả bảo hành này.
                            </p>
                          </div>
                        ) : (
                          <FormField
                            control={form.control}
                            name="mechanicId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="sr-only">
                                  Kỹ thuật viên
                                </FormLabel>
                                <FormControl>
                                  <div className="space-y-3">
                                    {loading ? (
                                      <div className="flex items-center justify-center p-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-orange-500 dark:text-orange-400 mr-2" />
                                        <span className="text-orange-600 dark:text-orange-400">
                                          Đang tải danh sách kỹ thuật viên...
                                        </span>
                                      </div>
                                    ) : mechanics && mechanics.length > 0 ? (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {mechanics.map(
                                          (mechanic: GET_MECHANIC_USER) => (
                                            <div
                                              key={mechanic.id}
                                              className={cn(
                                                "flex items-center p-3 rounded-lg cursor-pointer transition-all",
                                                field.value === mechanic.id
                                                  ? "bg-orange-50 dark:bg-orange-900/30 border-2 border-orange-500 dark:border-orange-500 shadow-sm"
                                                  : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-700 hover:bg-orange-50/50 dark:hover:bg-orange-900/20"
                                              )}
                                              onClick={() =>
                                                field.onChange(mechanic.id)
                                              }
                                            >
                                              <div className="flex items-center gap-3 flex-1">
                                                <Avatar
                                                  className={cn(
                                                    "h-10 w-10 bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 font-semibold",
                                                    field.value ===
                                                      mechanic.id &&
                                                      "ring-2 ring-orange-500 dark:ring-orange-500"
                                                  )}
                                                >
                                                  <span>
                                                    {mechanic.fullName?.[0]?.toUpperCase() ||
                                                      "U"}
                                                  </span>
                                                </Avatar>
                                                <div>
                                                  <div className="font-medium text-gray-800 dark:text-gray-200">
                                                    {mechanic.fullName}
                                                  </div>
                                                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                                    {mechanic.email}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="ml-2">
                                                <div
                                                  className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center border-2 transition-all",
                                                    field.value === mechanic.id
                                                      ? "border-orange-500 bg-orange-500 text-white"
                                                      : "border-gray-300 dark:border-gray-600"
                                                  )}
                                                >
                                                  {field.value ===
                                                    mechanic.id && (
                                                    <svg
                                                      width="12"
                                                      height="12"
                                                      viewBox="0 0 12 12"
                                                      fill="none"
                                                      xmlns="http://www.w3.org/2000/svg"
                                                    >
                                                      <path
                                                        d="M10 3L4.5 8.5L2 6"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                      />
                                                    </svg>
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    ) : (
                                      <div className="text-center p-8 border border-dashed border-orange-300 dark:border-orange-700 rounded-lg">
                                        <UserCheck className="h-12 w-12 mx-auto text-orange-300 dark:text-orange-700" />
                                        <p className="text-orange-600 dark:text-orange-400 mt-2">
                                          Không có kỹ thuật viên nào khả dụng
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <div className="flex justify-between mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("schedule")}
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                            Quay lại: Lịch trả
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setActiveTab("details")}
                            className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20"
                          >
                            Tiếp theo: Chi tiết
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="details" className="m-0">
                    <Card className="border-purple-100 dark:border-purple-800 shadow-sm">
                      <CardHeader className="bg-purple-50/50 dark:bg-purple-900/10 pb-3 pt-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
                          <FileText className="h-4 w-4" />
                          Thông tin bổ sung
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-4">
                        <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                          <h4 className="text-sm font-medium flex items-center gap-1.5 text-gray-700 dark:text-gray-300 mb-3">
                            <InfoIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            Tóm tắt thông tin
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Chế độ tạo
                              </p>
                              <p className="text-sm font-medium flex items-center gap-1.5">
                                {mode === "auto" ? (
                                  <>
                                    <Zap className="h-3.5 w-3.5 text-green-500" />{" "}
                                    Tự động
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-3.5 w-3.5 text-orange-500" />{" "}
                                    Thủ công
                                  </>
                                )}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Ngày trả
                              </p>
                              <p className="text-sm font-medium flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                {useExpectedDate &&
                                taskDetail.expectedReturnDate
                                  ? format(
                                      new Date(taskDetail.expectedReturnDate),
                                      "dd/MM/yyyy HH:mm"
                                    )
                                  : `${form.getValues(
                                      "actualReturnDate"
                                    )} ${form.getValues("actualReturnTime")}`}
                              </p>
                            </div>
                            {mode === "manual" && (
                              <div className="space-y-1">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Kỹ thuật viên
                                </p>
                                <p className="text-sm font-medium">
                                  {form.getValues("mechanicId") && mechanics
                                    ? mechanics.find(
                                        (m) =>
                                          m.id === form.getValues("mechanicId")
                                      )?.fullName || "Chưa chọn"
                                    : "Chưa chọn"}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="warrantyNotes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5" /> Ghi chú bảo
                                hành
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Nhập ghi chú về việc trả bảo hành"
                                  className="resize-none min-h-[120px] border-gray-200 dark:border-gray-700 focus:border-purple-300 dark:focus:border-purple-600"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription className="text-xs">
                                Thêm các chi tiết liên quan đến quá trình trả
                                bảo hành
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-between mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              setActiveTab(
                                mode === "auto" ? "schedule" : "mechanic"
                              )
                            }
                            className="border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                          >
                            <ArrowRight className="mr-2 h-4 w-4 rotate-180" />
                            Quay lại
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <div className="sm:hidden pt-2">
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        (mode === "manual" && !form.getValues("mechanicId")) ||
                        !mechanics ||
                        mechanics.length === 0
                      }
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <PackageCheck className="mr-2 h-4 w-4" />
                          Tạo nhiệm vụ trả bảo hành
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </Tabs>
          </div>

          <DialogFooter className="bg-gray-50 dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 rounded-b-xl">
            <Button
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="border-gray-300 text-gray-600"
            >
              Hủy
            </Button>
            <Button
              form="warranty-return-form"
              type="submit"
              disabled={
                isSubmitting ||
                (mode === "manual" && !form.getValues("mechanicId")) ||
                !mechanics ||
                mechanics.length === 0
              }
              className="bg-green-600 hover:bg-green-700 text-white transition-all shadow-sm hover:shadow"
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Tạo nhiệm vụ trả bảo hành
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CreateWarrantyReturnButton;
