"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from "lucide-react";
import { format, isBefore, set } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { GET_MECHANIC_USER } from "@/types/user.type";

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
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWarrantyReturnButtonProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  onSuccess?: () => void;
  open: boolean; // Added to control dialog state
  onOpenChange: (open: boolean) => void; // Added to handle dialog state changes
}

const CreateWarrantyReturnButton = ({
  taskDetail,
  onSuccess,
  open,
  onOpenChange,
}: CreateWarrantyReturnButtonProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  // Get current time in HH:MM format
  const getCurrentTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;
  };

  // Format expected return date
  const getFormattedDate = (date: string | null) => {
    if (!date) return today;
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) return today;
    return parsedDate.toISOString().split("T")[0];
  };

  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mode: "manual",
      actualReturnDate: today,
      actualReturnTime: getCurrentTime(),
      useExpectedDate: false,
      warrantyNotes: "",
    },
  });

  // Watch form fields
  const mode = form.watch("mode");
  const useExpectedDate = form.watch("useExpectedDate");

  // Fetch mechanics when dialog opens
  useEffect(() => {
    const fetchMechanics = async () => {
      if (!open) return;

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
  }, [open, mode, form]);

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
      };

      await apiClient.task.createWarrantyReturnTask(submitData);

      toast.success("Warranty return task created successfully", {
        description: `Return date: ${format(combinedDateTime, "PPp")}`,
      });

      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-700">
            <Shield className="h-5 w-5" />
            Create Warranty Return Task
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <span className="font-medium">
              Claim #{taskDetail?.claimNumber || "N/A"}
            </span>
            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
              {taskDetail.taskType}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Creation Mode Selection */}
            <Card className="border-purple-100">
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-medium text-purple-700 flex items-center gap-2 mb-4">
                        <Zap className="h-5 w-5" />
                        Creation Mode
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-3"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 border border-purple-100 rounded-md p-4 hover:bg-purple-50 transition-colors">
                            <FormControl>
                              <RadioGroupItem value="auto" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              <div className="font-medium mb-1">
                                Auto Create
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Automatically assign the first available
                                mechanic and create the task
                              </p>
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 border border-purple-100 rounded-md p-4 hover:bg-purple-50 transition-colors">
                            <FormControl>
                              <RadioGroupItem value="manual" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              <div className="font-medium mb-1">
                                Manual Create
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Select a specific mechanic and set return date
                                manually
                              </p>
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Return Schedule */}
            <Card className="border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-blue-700 font-medium mb-4">
                  <Calendar className="h-5 w-5" />
                  Return Schedule
                </div>

                {/* Option to use expected return date */}
                {taskDetail.expectedReturnDate && (
                  <div className="mb-4">
                    <FormField
                      control={form.control}
                      name="useExpectedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border border-blue-100 rounded-md">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="text-sm font-medium">
                              Use expected return date
                            </FormLabel>
                            <FormDescription className="text-xs">
                              Use the expected return date (
                              {taskDetail.expectedReturnDate &&
                                format(
                                  new Date(taskDetail.expectedReturnDate),
                                  "PP"
                                )}
                              ) from the warranty claim
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Actual Return Date */}
                  <FormField
                    control={form.control}
                    name="actualReturnDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Actual Return Date</FormLabel>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                          <FormControl>
                            <Input
                              type="date"
                              className="pl-9"
                              min={today}
                              {...field}
                              disabled={useExpectedDate}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Actual Return Time */}
                  <FormField
                    control={form.control}
                    name="actualReturnTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Actual Return Time</FormLabel>
                        <div className="flex items-center gap-2">
                          <div className="relative w-full">
                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                            <FormControl>
                              <Input
                                type="time"
                                {...field}
                                className="pl-9"
                                disabled={useExpectedDate}
                              />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Mechanic Selection (manual mode) */}
            {mode === "manual" && (
              <Card className="border-orange-100">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-700 font-medium mb-4">
                    <UserCheck className="h-5 w-5" />
                    Assign Mechanic
                  </div>

                  <FormField
                    control={form.control}
                    name="mechanicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Mechanic</FormLabel>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                          {loading ? (
                            <div className="col-span-full flex items-center justify-center p-6">
                              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
                              <span>Loading mechanics...</span>
                            </div>
                          ) : mechanics && mechanics.length > 0 ? (
                            mechanics.map((mechanic: GET_MECHANIC_USER) => (
                              <div
                                key={mechanic.id}
                                className={cn(
                                  "border rounded-lg p-3 cursor-pointer transition-colors",
                                  field.value === mechanic.id
                                    ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                                    : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/50"
                                )}
                                onClick={() => field.onChange(mechanic.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-medium">
                                      {mechanic.fullName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {mechanic.email}
                                    </div>
                                  </div>
                                  <div className="ml-auto">
                                    <div
                                      className={cn(
                                        "w-4 h-4 rounded-full border-2",
                                        field.value === mechanic.id
                                          ? "border-orange-500 bg-orange-500"
                                          : "border-gray-300"
                                      )}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-full text-center p-6 border border-dashed rounded-lg">
                              <p className="text-gray-500">
                                No mechanics available
                              </p>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            <Card className="border-gray-100">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-gray-700 font-medium mb-4">
                  <UserCheck className="h-5 w-5" />
                  Additional Information
                </div>

                <FormField
                  control={form.control}
                  name="warrantyNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Warranty Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any notes about the warranty return"
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Add any relevant details about the warranty return
                        process
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Separator />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting ||
                  (mode === "manual" && !form.getValues("mechanicId")) ||
                  !mechanics ||
                  mechanics.length === 0
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 h-4 w-4" />
                    {mode === "auto"
                      ? "Auto-Create Return Task"
                      : "Create Return Task"}
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

export default CreateWarrantyReturnButton;
