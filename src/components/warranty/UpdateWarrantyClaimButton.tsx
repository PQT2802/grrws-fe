"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { WARRANTY_TASK_DETAIL } from "@/types/task.type";
import {
  FileUp,
  Loader2,
  Pencil,
  Shield,
  Clock,
  FileEdit,
  DollarSign,
  CalendarCheck,
  FileText,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, set } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

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
  claimAmount: z.number().positive().optional(),
  documentDescription: z.string().optional(),
});

interface UpdateWarrantyClaimButtonProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  onSuccess?: () => void;
}

const UpdateWarrantyClaimButton = ({
  taskDetail,
  onSuccess,
}: UpdateWarrantyClaimButtonProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Get today's date in YYYY-MM-DD format (for min attribute of date input)
  const today = new Date().toISOString().split("T")[0];

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Format date for form default values
  const getFormattedDate = (date: string | null) => {
    if (!date) return new Date().toISOString().split("T")[0];
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime()))
      return new Date().toISOString().split("T")[0];
    return parsedDate.toISOString().split("T")[0];
  };

  // Initialize the form with current values
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      expectedReturnDate: getFormattedDate(taskDetail?.expectedReturnDate),
      expectedReturnTime: taskDetail?.expectedReturnDate
        ? new Date(taskDetail.expectedReturnDate).toString() !== "Invalid Date"
          ? format(new Date(taskDetail.expectedReturnDate), "HH:mm")
          : getCurrentTime()
        : getCurrentTime(),
      resolution: taskDetail?.resolution || "",
      warrantyNotes: taskDetail?.warrantyNotes || "",
      claimAmount: taskDetail?.claimAmount ?? undefined,
      documentDescription: "",
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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    console.log("Form values:", values);
    setIsSubmitting(true);
    try {
      const combinedDateTime = combineDateAndTime(
        values.expectedReturnDate,
        values.expectedReturnTime
      );

      const formData = new FormData();
      formData.append("WarrantyClaimId", taskDetail.warrantyClaimId);
      formData.append("ExpectedReturnDate", combinedDateTime.toISOString());
      formData.append("ClaimStatus", "InProgress");

      if (values.resolution) {
        formData.append("Resolution", values.resolution);
      }
      if (values.warrantyNotes) {
        formData.append("WarrantyNotes", values.warrantyNotes);
      }
      if (values.claimAmount !== undefined) {
        formData.append("ClaimAmount", values.claimAmount.toString());
      }
      if (selectedFile) {
        formData.append("DocumentFiles", selectedFile);
      }
      if (values.documentDescription) {
        formData.append("DocumentDescription", values.documentDescription);
      }

      await apiClient.task.updateWarrantyClaim(formData);

      toast.success("Warranty claim updated successfully", {
        description: `Expected return: ${format(combinedDateTime, "PPp")}`,
      });
      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Failed to update warranty claim:", error);
      toast.error("Failed to update warranty claim", {
        description:
          "Please try again or contact support if the problem persists.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200"
        >
          <Shield className="h-4 w-4 mr-2" />
          Update Warranty Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <Shield className="h-5 w-5" />
            Update Warranty Claim
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-medium">
              Claim #{taskDetail?.claimNumber || "N/A"}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
              In Progress
            </span>
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-4">
                  <CalendarCheck className="h-5 w-5" />
                  Return Schedule
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="expectedReturnDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Return Date</FormLabel>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <FormControl>
                            <Input
                              type="date"
                              className="pl-9"
                              min={today}
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormDescription className="text-xs">
                          Select the expected date for warranty return
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="expectedReturnTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Time</FormLabel>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <FormControl>
                              <Input type="time" {...field} className="pl-9" />
                            </FormControl>
                          </div>
                        </div>
                        <FormDescription className="text-xs">
                          Specify the expected time for warranty return
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-700 font-medium mb-4">
                  <FileEdit className="h-5 w-5" />
                  Claim Details
                </div>

                <FormField
                  control={form.control}
                  name="claimAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Claim Amount</FormLabel>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-grow">
                          <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter claim amount"
                              className="pl-9"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : parseFloat(e.target.value)
                                )
                              }
                            />
                          </FormControl>
                        </div>
                      </div>
                      <FormDescription className="text-xs">
                        The financial amount associated with this warranty claim
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="resolution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter resolution details"
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Describe how the warranty issue was resolved
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control}
                    name="warrantyNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter warranty notes"
                            className="resize-none min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Additional notes or comments about this warranty claim
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-amber-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-700 font-medium mb-4">
                  <FileText className="h-5 w-5" />
                  Documentation
                </div>

                <div className="space-y-4">
                  <div>
                    <FormLabel>Document Upload</FormLabel>
                    <div className="mt-2">
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                        <Input
                          type="file"
                          id="documentFile"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="documentFile"
                          className="cursor-pointer"
                        >
                          <FileUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p className="text-sm font-medium mb-1">
                            Click to upload a document
                          </p>
                          <p className="text-xs text-muted-foreground">
                            PDF, Word, or image files (max 10MB)
                          </p>
                        </label>
                      </div>
                      {selectedFile && (
                        <div className="mt-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileUp className="h-4 w-4" />
                            <span className="font-medium">
                              {selectedFile.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                            onClick={() => setSelectedFile(null)}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="documentDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Document Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the uploaded document"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Provide context for the uploaded document
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Update Claim
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateWarrantyClaimButton;
