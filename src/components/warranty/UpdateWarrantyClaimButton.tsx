"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  FileUp,
  Loader2,
  Pencil,
  Shield,
  Calendar,
  X,
  FileText,
  Clock,
} from "lucide-react";
import { format, set } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import formatDisplayDate from "@/utils/formatDisplay";
import {
  formatDateTimeForAPISubmit,
  getCurrentTime,
  getFormattedDate,
} from "@/lib/utils";
import CreateWarrantyReturnButton from "./CreateWarrantyReturnButton";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Form schema
const formSchema = z.object({
  expectedReturnDate: z.string({
    required_error: "Expected return date is required",
  }),
  expectedReturnTime: z.string({
    required_error: "Expected return time is required",
  }),
  resolution: z.string().optional(),
  warrantyNotes: z.string().optional(),
  showClaimAmount: z.boolean().default(false), // Added checkbox field
  claimAmount: z.number().positive().optional(),
  documentDescription: z.string().optional(),
  createReturnTask: z.boolean(),
  // Add returnOption to form schema
  returnOption: z.enum(["reinstallOldDevice", "warrantyFailed"]),
});

type FormValues = z.infer<typeof formSchema>;

interface UpdateWarrantyClaimButtonProps {
  taskDetail: WARRANTY_TASK_DETAIL | null;
  onSuccess?: () => void;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const UpdateWarrantyClaimButton = ({
  taskDetail,
  onSuccess,
  externalOpen,
  onExternalOpenChange,
}: UpdateWarrantyClaimButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [openReturnDialog, setOpenReturnDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("schedule");
  const [updatedTaskDetail, setUpdatedTaskDetail] =
    useState<WARRANTY_TASK_DETAIL | null>(taskDetail);
  const [isReinstall, setIsReinstall] = useState(true);
  const [isFailed, setIsFailed] = useState(false);

  if (!taskDetail) {
    return (
      <Button
        disabled
        variant="secondary"
        className="bg-blue-50 text-blue-400 border border-blue-100"
      >
        <Shield className="h-4 w-4 mr-2" />
        Cập nhật Bảo hành
      </Button>
    );
  }

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Dialog open state management
  const isDialogOpen = externalOpen !== undefined ? externalOpen : open;
  const handleOpenChange = (newOpen: boolean) => {
    if (externalOpen !== undefined && onExternalOpenChange) {
      onExternalOpenChange(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  // Initialize the form
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expectedReturnDate: getFormattedDate(taskDetail?.expectedReturnDate),
      expectedReturnTime: taskDetail?.expectedReturnDate
        ? format(new Date(taskDetail.expectedReturnDate), "HH:mm")
        : getCurrentTime(),
      resolution: taskDetail?.resolution || "",
      warrantyNotes: taskDetail?.warrantyNotes || "",
      showClaimAmount: !!taskDetail?.claimAmount, // Set to true if there's a claim amount
      claimAmount: taskDetail?.claimAmount ?? undefined,
      documentDescription: "",
      createReturnTask: true, // Set default to true
      returnOption: "reinstallOldDevice", // Default to reinstall old device
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      toast.info(`File "${e.target.files[0].name}" selected`);
    }
  };

  // Combine date and time into a single Date object
  const combineDateAndTime = (dateStr: string, timeStr: string): Date => {
    const parsedDate = new Date(dateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new Error("Invalid date format");
    }
    const [hours, minutes] = timeStr.split(":").map(Number);
    return set(parsedDate, { hours, minutes, seconds: 0, milliseconds: 0 });
  };

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    setIsSubmitting(true);
    try {
      const combinedDateTime = combineDateAndTime(
        values.expectedReturnDate,
        values.expectedReturnTime
      );

      const formData = new FormData();
      formData.append("WarrantyClaimId", taskDetail.warrantyClaimId);
      formData.append(
        "ExpectedReturnDate",
        formatDateTimeForAPISubmit(combinedDateTime)
      );
      formData.append("ClaimStatus", "InProgress");

      if (values.resolution) formData.append("Resolution", values.resolution);
      if (values.warrantyNotes)
        formData.append("WarrantyNotes", values.warrantyNotes);
      if (values.claimAmount !== undefined)
        formData.append("ClaimAmount", values.claimAmount.toString());
      if (selectedFile) formData.append("DocumentFiles", selectedFile);
      if (values.documentDescription)
        formData.append("DocumentDescription", values.documentDescription);

      const response = await apiClient.task.updateWarrantyClaim(formData);

      // Create a new object that includes the original task detail plus our updated data
      const updatedDetail = {
        ...taskDetail,
        expectedReturnDate: combinedDateTime.toISOString(),
        resolution: values.resolution || taskDetail.resolution,
        warrantyNotes: values.warrantyNotes || taskDetail.warrantyNotes,
        claimAmount:
          values.claimAmount !== undefined
            ? values.claimAmount
            : taskDetail.claimAmount,
      };

      setUpdatedTaskDetail(updatedDetail);

      toast.success("Cập nhật thành công", {
        description: `Ngày trả dự kiến: ${format(
          combinedDateTime,
          "dd/MM/yyyy HH:mm"
        )}`,
      });

      if (values.createReturnTask) {
        handleOpenChange(false);
        setOpenReturnDialog(true);
        // Pass these values to CreateWarrantyReturnButton
        setIsReinstall(values.returnOption === "reinstallOldDevice");
        setIsFailed(values.returnOption === "warrantyFailed");
      } else {
        handleOpenChange(false);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Failed to update warranty claim:", error);
      toast.error("Cập nhật thất bại", {
        description: "Vui lòng thử lại hoặc liên hệ hỗ trợ.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnTaskSuccess = () => {
    setOpenReturnDialog(false);
    onSuccess?.();
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        {externalOpen === undefined && (
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-sm hover:shadow"
            >
              <Shield className="h-4 w-4 mr-2" />
              Cập nhật Bảo hành
            </Button>
          </DialogTrigger>
        )}

        <DialogContent
          className="sm:max-w-lg p-0 max-h-[85vh] overflow-hidden rounded-xl shadow-lg 
          border-blue-100 dark:border-blue-800 animate-in fade-in-0 zoom-in-95 duration-200"
        >
          {/* Compact Header */}
          <div
            className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 
            px-4 py-3 flex items-center justify-between border-b border-blue-100 dark:border-blue-800 rounded-t-xl"
          >
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-800/50 p-2 rounded-full">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-blue-700 dark:text-blue-300 leading-tight">
                  Cập nhật Bảo hành #{taskDetail?.claimNumber || "N/A"}
                </h2>
                <Badge
                  variant="outline"
                  className="text-[10px] mt-0.5 py-0 px-1 bg-blue-50/50"
                >
                  Đang xử lý
                </Badge>
              </div>
            </div>
          </div>

          {/* Scrollable Content with Tabs */}
          <div className="overflow-y-auto max-h-[calc(85vh-120px)] p-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full grid grid-cols-3 p-0 h-10 bg-gray-50 dark:bg-gray-800/50">
                <TabsTrigger
                  value="schedule"
                  className="text-xs rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1.5" /> Lịch trả
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="text-xs rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Chi tiết
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="text-xs rounded-none data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-none"
                >
                  <FileUp className="h-3.5 w-3.5 mr-1.5" /> Tài liệu
                </TabsTrigger>
              </TabsList>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-0 px-4"
                >
                  {/* Schedule Tab */}
                  <TabsContent value="schedule" className="m-0 py-3 space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        Lịch trả bảo hành
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="expectedReturnDate"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-baseline justify-between">
                                <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                  Ngày trả
                                </FormLabel>
                                <FormMessage className="text-[10px]" />
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-2 top-2 h-4 w-4 text-blue-500 dark:text-blue-400" />

                                  <div className="relative">
                                    <Input
                                      type="text"
                                      className="pl-8 text-xs h-8 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 rounded-md"
                                      value={
                                        field.value
                                          ? formatDisplayDate(field.value)
                                          : ""
                                      }
                                      placeholder="DD/MM/YYYY"
                                      readOnly
                                      onClick={() => {
                                        const hiddenInput =
                                          document.getElementById(
                                            "hidden-date-picker-expected"
                                          );
                                        if (hiddenInput)
                                          (
                                            hiddenInput as HTMLInputElement
                                          ).showPicker();
                                      }}
                                    />

                                    <input
                                      id="hidden-date-picker-expected"
                                      type="date"
                                      className="opacity-0 absolute top-0 left-0 w-0 h-0"
                                      min={today}
                                      value={field.value}
                                      onChange={(e) =>
                                        field.onChange(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="expectedReturnTime"
                          render={({ field }) => (
                            <FormItem>
                              <div className="flex items-baseline justify-between">
                                <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                  Giờ trả
                                </FormLabel>
                                <FormMessage className="text-[10px]" />
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <Clock className="absolute left-2 top-2 h-4 w-4 text-blue-500 dark:text-blue-400" />
                                  <Input
                                    type="time"
                                    className="pl-8 text-xs h-8 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 rounded-md"
                                    onFocus={(e) =>
                                      (
                                        e.target as HTMLInputElement
                                      ).showPicker()
                                    }
                                    onKeyDown={(e) => e.preventDefault()}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="showClaimAmount"
                        render={({ field }) => (
                          <FormItem
                            className="flex items-center space-x-2 space-y-0 
                            mt-1 p-2 bg-gray-50/70 dark:bg-gray-800/30 rounded-md border border-gray-200 dark:border-gray-700"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-medium cursor-pointer">
                              Khoản chi thêm
                            </FormLabel>
                          </FormItem>
                        )}
                      />

                      {form.watch("showClaimAmount") && (
                        <FormField
                          control={form.control}
                          name="claimAmount"
                          render={({ field }) => (
                            <FormItem className="pl-8">
                              <div className="flex items-baseline justify-between">
                                <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                  Số tiền chi thêm
                                </FormLabel>
                                <FormMessage className="text-[10px]" />
                              </div>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 h-4 w-4 text-blue-500 dark:text-blue-400 text-xs font-medium">
                                    ₫
                                  </span>
                                  <Input
                                    type="number"
                                    min={0}
                                    max={10000000}
                                    className="pl-8 text-xs h-8 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 rounded-md"
                                    placeholder="Nhập số tiền chi thêm"
                                    {...field}
                                    value={field.value ?? ""}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value);
                                      field.onChange(
                                        isNaN(val)
                                          ? undefined
                                          : Math.min(val, 10000000)
                                      );
                                    }}
                                  />
                                </div>
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    {taskDetail.taskType === "WarrantySubmission" &&
                      !taskDetail.actualReturnDate && (
                        <div className="space-y-3 mt-3">
                          <FormField
                            control={form.control as any}
                            name="createReturnTask"
                            render={({ field }) => (
                              <FormItem
                                className="flex items-center space-x-2 space-y-0 
                                p-2 bg-blue-50/70 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-800"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                  />
                                </FormControl>
                                <FormLabel className="text-xs text-blue-700 dark:text-blue-300 font-medium cursor-pointer">
                                  Tạo nhiệm vụ trả bảo hành sau khi cập nhật
                                </FormLabel>
                              </FormItem>
                            )}
                          />

                          {form.watch("createReturnTask") && (
                            <FormField
                              control={form.control}
                              name="returnOption"
                              render={({ field }) => (
                                <FormItem className="pl-8">
                                  <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                    Loại trả bảo hành
                                  </FormLabel>
                                  <FormControl>
                                    <RadioGroup
                                      onValueChange={field.onChange}
                                      defaultValue={field.value}
                                      className="grid grid-cols-1 gap-2 mt-2"
                                    >
                                      <FormItem className="flex items-center space-x-3 space-y-0 border border-green-100 dark:border-green-800 rounded-lg p-2 hover:bg-green-50/50 dark:hover:bg-green-900/20 transition-colors">
                                        <FormControl>
                                          <RadioGroupItem value="reinstallOldDevice" />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer flex-1 m-0">
                                          <div className="font-medium text-xs text-green-700 dark:text-green-300">
                                            Lắp lại thiết bị cũ
                                          </div>
                                          <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-0.5">
                                            Lắp đặt lại thiết bị cũ sau khi sửa
                                            chữa
                                          </p>
                                        </FormLabel>
                                      </FormItem>
                                      <FormItem className="flex items-center space-x-3 space-y-0 border border-red-100 dark:border-red-800 rounded-lg p-2 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors">
                                        <FormControl>
                                          <RadioGroupItem value="warrantyFailed" />
                                        </FormControl>
                                        <FormLabel className="font-normal cursor-pointer flex-1 m-0">
                                          <div className="font-medium text-xs text-red-700 dark:text-red-300">
                                            Bảo hành thất bại
                                          </div>
                                          <p className="text-[10px] text-red-600/70 dark:text-red-400/70 mt-0.5">
                                            Không thể sửa chữa thiết bị và cần
                                            thay thế mới
                                          </p>
                                        </FormLabel>
                                      </FormItem>
                                    </RadioGroup>
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          )}
                        </div>
                      )}
                  </TabsContent>

                  {/* Details Tab */}
                  <TabsContent value="details" className="m-0 py-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <FileText className="h-4 w-4 mr-2" />
                        Chi tiết yêu cầu bảo hành
                      </div>

                      <FormField
                        control={form.control}
                        name="resolution"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-baseline justify-between">
                              <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                Kết quả xử lý
                              </FormLabel>
                              <FormMessage className="text-[10px]" />
                            </div>
                            <FormControl>
                              <Textarea
                                placeholder="Mô tả cách xử lý yêu cầu bảo hành"
                                className="text-xs h-16 min-h-0 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 resize-none rounded-md"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="warrantyNotes"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <div className="flex items-baseline justify-between">
                              <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                Ghi chú bảo hành
                              </FormLabel>
                              <FormMessage className="text-[10px]" />
                            </div>
                            <FormControl>
                              <Textarea
                                placeholder="Ghi chú bổ sung về bảo hành"
                                className="text-xs h-16 min-h-0 border-gray-200 dark:border-gray-700 focus:border-blue-300 dark:focus:border-blue-600 resize-none rounded-md"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {/* Add this inside the details tab, right after the warrantyNotes field */}
                    </div>
                  </TabsContent>

                  {/* Documents Tab */}
                  <TabsContent value="documents" className="m-0 py-3 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <FileUp className="h-4 w-4 mr-2" />
                        Tài liệu đính kèm
                      </div>

                      <div
                        className="border border-dashed border-blue-200 dark:border-blue-800 rounded-md p-4 
                        text-center hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer"
                      >
                        <Input
                          type="file"
                          id="documentFile"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="documentFile"
                          className="cursor-pointer block"
                        >
                          <FileUp
                            className="h-8 w-8 mx-auto mb-2 text-blue-400 dark:text-blue-500 
                            group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
                          />
                          <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                            Tải lên tài liệu
                          </p>
                          <p className="text-[10px] text-blue-500 dark:text-blue-400 mt-0.5">
                            PDF, Word, hoặc hình ảnh (tối đa 10MB)
                          </p>
                        </label>
                      </div>

                      {selectedFile && (
                        <div
                          className="flex items-center justify-between bg-blue-50/50 dark:bg-blue-900/10 p-2 
                          rounded-md border border-blue-200 dark:border-blue-800 mt-2"
                        >
                          <div className="flex items-center gap-2 text-xs">
                            <FileUp className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-blue-700 dark:text-blue-300 font-medium truncate max-w-[150px]">
                              {selectedFile.name}
                            </span>
                            <span className="text-blue-500 dark:text-blue-400 text-[10px]">
                              ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                            className="h-6 w-6 p-0 rounded-full text-blue-500 hover:text-blue-700 
                              hover:bg-blue-100 dark:hover:bg-blue-800/50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="documentDescription"
                        render={({ field }) => (
                          <FormItem className="mt-3">
                            <div className="flex items-baseline justify-between">
                              <FormLabel className="text-xs text-gray-600 dark:text-gray-400">
                                Mô tả tài liệu
                              </FormLabel>
                              <FormMessage className="text-[10px]" />
                            </div>
                            <FormControl>
                              <Textarea
                                placeholder="Mô tả nội dung tài liệu"
                                className="text-xs h-16 min-h-0 border-gray-200 dark:border-gray-700 
                                  focus:border-blue-300 dark:focus:border-blue-600 resize-none rounded-md"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </div>

          {/* Fixed Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl flex justify-end gap-2 items-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="h-8 text-xs border-gray-200 dark:border-gray-700"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <Pencil className="mr-1.5 h-3 w-3" />
                  {form.watch("createReturnTask")
                    ? "Cập nhật & Tạo Trả"
                    : "Cập nhật"}
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <CreateWarrantyReturnButton
        taskDetail={updatedTaskDetail || taskDetail}
        onSuccess={handleReturnTaskSuccess}
        open={openReturnDialog}
        onOpenChange={setOpenReturnDialog}
        isReinstall={isReinstall}
        isFailed={isFailed}
      />
    </>
  );
};

export default UpdateWarrantyClaimButton;
