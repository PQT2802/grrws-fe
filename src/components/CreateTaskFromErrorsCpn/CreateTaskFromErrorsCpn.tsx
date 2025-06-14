"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
  useMemo,
} from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../providers/AuthProvider";
import ButtonCpn from "../ButtonCpn/ButtonCpn";
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { CREATE_REPAIR_TASK, SPAREPART_WEB } from "@/types/task.type";
import { ErrorGuideline } from "@/types/error.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import taskService from "@/app/service/task.service";
import userService from "@/app/service/user.service";
import errorService from "@/app/service/error.service";
import { getFirstLetterUppercase } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  AlertTriangle,
  Package,
  Wrench,
  Check,
  User,
  Calendar,
} from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface CreateTaskFromErrorsCpnProps {
  children?: React.ReactNode; // ✅ Make optional
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  requestId: string;
  selectedErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  onTaskCreated?: () => void;
  hasUninstallTask?: boolean; // Check if uninstall task exists
}

type Step = "errors" | "mechanic" | "overview";

const CreateTaskFromErrorsCpn = ({
  children,
  open,
  setOpen,
  requestId,
  selectedErrors,
  onTaskCreated,
  hasUninstallTask = true,
}: CreateTaskFromErrorsCpnProps) => {
  const { user: authUser } = useAuth();

  // ✅ Filter out errors with "Assigned" status
  const availableErrors = useMemo(() => {
    return selectedErrors.filter((error) => error.status !== "Assigned");
  }, [selectedErrors]);

  // Navigation state
  const [currentStep, setCurrentStep] = useState<Step>("errors");
  const [canProceed, setCanProceed] = useState(false);

  // Form state
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate] = useState<Date>(new Date()); // ✅ Default to now
  const [selectedErrorGuidelines, setSelectedErrorGuidelines] = useState<
    string[]
  >([]);

  // Data state
  const [errorGuidelines, setErrorGuidelines] = useState<{
    [errorId: string]: ErrorGuideline;
  }>({});
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<GET_MECHANIC_USER | null>(null);

  // Loading states
  const [loadingGuidelines, setLoadingGuidelines] = useState<boolean>(false);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Fetch error guidelines for each error
  const fetchErrorGuidelines = async () => {
    if (availableErrors.length === 0) return;

    try {
      setLoadingGuidelines(true);
      const guidelines: { [errorId: string]: ErrorGuideline } = {};

      // ✅ Actually fetch guidelines for each error
      for (const error of availableErrors) {
        try {
          console.log(`🔄 Fetching guidelines for error: ${error.errorId}`);

          const guidelinesResponse = await errorService.getErrorGuidelines(
            error.errorId
          );

          console.log(
            `✅ Received guidelines for ${error.errorId}:`,
            guidelinesResponse
          );

          // ✅ Handle both single object and array responses
          let guideline: ErrorGuideline | null = null;

          if (Array.isArray(guidelinesResponse)) {
            // If it's an array, take the first item
            if (guidelinesResponse.length > 0) {
              guideline = guidelinesResponse[0];
              console.log(`📋 Using first item from array:`, guideline);
            }
          } else if (
            guidelinesResponse &&
            typeof guidelinesResponse === "object" &&
            "id" in guidelinesResponse
          ) {
            // If it's a single object with an id, use it directly
            guideline = guidelinesResponse as ErrorGuideline;
            console.log(`📋 Using single object:`, guideline);
          }

          if (guideline) {
            guidelines[error.errorId] = {
              ...guideline,
              errorFixSteps: guideline.errorFixSteps || [],
              errorSpareparts: guideline.errorSpareparts || [],
              estimatedRepairTime: guideline.estimatedRepairTime || "00:30:00",
              priority: guideline.priority?.toString() || "Medium",
              title: guideline.title || `Guideline for ${error.name}`,
            };

            console.log(
              `✅ Processed guideline for ${error.errorId}:`,
              guidelines[error.errorId]
            );
            console.log(
              `📊 Fix Steps Count:`,
              guidelines[error.errorId].errorFixSteps.length
            );
            console.log(
              `📊 Spare Parts Count:`,
              guidelines[error.errorId].errorSpareparts.length
            );
          } else {
            console.warn(
              `❌ No valid guideline found for error ${error.errorId}`,
              {
                response: guidelinesResponse,
                isArray: Array.isArray(guidelinesResponse),
                hasId:
                  !Array.isArray(guidelinesResponse) &&
                  guidelinesResponse &&
                  "id" in guidelinesResponse,
              }
            );
          }
        } catch (err) {
          console.warn(
            `❌ Failed to fetch guidelines for error ${error.errorId}:`,
            err
          );
        }
      }

      console.log("✅ All guidelines processed:", guidelines);
      setErrorGuidelines(guidelines);
    } catch (error) {
      console.error("❌ Failed to fetch error guidelines:", error);
      toast.error("Failed to fetch error guidelines");
    } finally {
      setLoadingGuidelines(false);
    }
  };

  // Fetch mechanics
  const fetchMechanics = async () => {
    try {
      setLoadingMechanics(true);
      const mechanicsData = await userService.getUsersByRole(3);
      setMechanics(mechanicsData);
    } catch (error) {
      console.error("Failed to fetch mechanics:", error);
      toast.error("Failed to fetch mechanics");
    } finally {
      setLoadingMechanics(false);
    }
  };

  // Effect to fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchErrorGuidelines();
      fetchMechanics();
      // Reset state
      setCurrentStep("errors");
      setAssigneeId("");
      setSelectedMechanic(null);
      setSelectedErrorGuidelines([]);
      setCanProceed(false);
    }
  }, [open, selectedErrors]);

  // Check if current step can proceed
  useEffect(() => {
    switch (currentStep) {
      case "errors":
        setCanProceed(selectedErrorGuidelines.length > 0);
        break;
      case "mechanic":
        setCanProceed(!!selectedMechanic);
        break;
      case "overview":
        setCanProceed(true);
        break;
    }
  }, [currentStep, selectedErrorGuidelines, selectedMechanic]);

  // Handle error guideline selection
  const handleErrorGuidelineSelection = (
    guidelineId: string,
    checked: boolean
  ) => {
    if (checked) {
      setSelectedErrorGuidelines([...selectedErrorGuidelines, guidelineId]);
    } else {
      setSelectedErrorGuidelines(
        selectedErrorGuidelines.filter((id) => id !== guidelineId)
      );
    }
  };

  // Handle mechanic selection
  const handleMechanicSelection = (mechanic: GET_MECHANIC_USER) => {
    setSelectedMechanic(mechanic);
    setAssigneeId(mechanic.id);
  };

  // Navigation functions
  const goToNextStep = () => {
    if (currentStep === "errors") setCurrentStep("mechanic");
    else if (currentStep === "mechanic") setCurrentStep("overview");
  };

  const goToPreviousStep = () => {
    if (currentStep === "mechanic") setCurrentStep("errors");
    else if (currentStep === "overview") setCurrentStep("mechanic");
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!selectedMechanic || selectedErrorGuidelines.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setCreating(true);

      const taskData: CREATE_REPAIR_TASK = {
        RequestId: requestId,
        StartDate: startDate.toISOString(),
        AssigneeId: assigneeId,
        ErrorGuidelineIds: selectedErrorGuidelines,
      };

      console.log("Creating repair task with data:", taskData);

      const result = await apiClient.task.createRepairTask(taskData);

      console.log("Repair task created successfully:", result);
      toast.success("Repair task created successfully!");

      // Reset and close
      setOpen(false);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Failed to create repair task:", error);
      toast.error("Failed to create repair task");
    } finally {
      setCreating(false);
    }
  };

  // Calculate total estimated time
  const totalEstimatedTime = useMemo(() => {
    let totalMinutes = 0;

    selectedErrorGuidelines.forEach((guidelineId) => {
      const guideline = Object.values(errorGuidelines).find(
        (g) => g.id === guidelineId
      );

      // ✅ Add null checks for guideline and estimatedRepairTime
      if (guideline && guideline.estimatedRepairTime) {
        // Parse ISO 8601 duration format (PT1H30M or 01:30:00)
        const timeMatch =
          guideline.estimatedRepairTime.match(/(\d+):(\d+):(\d+)/) ||
          guideline.estimatedRepairTime.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);

        if (timeMatch) {
          const hours = parseInt(timeMatch[1] || "0");
          const minutes = parseInt(timeMatch[2] || "0");
          totalMinutes += hours * 60 + minutes;
        }
      }
    });

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [selectedErrorGuidelines, errorGuidelines]);

  const renderStepContent = () => {
    switch (currentStep) {
      case "errors":
        return (
          <div className="space-y-6">
            {/* Uninstall Task Warning */}
            {!hasUninstallTask && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div className="flex-1">
                      <h3 className="font-medium text-orange-800">
                        Uninstall Task Required
                      </h3>
                      <p className="text-sm text-orange-700 mt-1">
                        You should create an uninstall task before creating
                        repair tasks. This ensures proper device removal before
                        repairs.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add New Error Button */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Select Errors & Guidelines
              </h3>
              <ButtonCpn
                type="button"
                title="Add New Error"
                icon={<Plus />}
                onClick={() => {
                  // TODO: Implement add new error functionality
                  toast.info("Add new error functionality coming soon");
                }}
              />
            </div>

            {loadingGuidelines ? (
              <SkeletonCard />
            ) : (
              <div className="space-y-4">
                {availableErrors.map((error) => {
                  const guideline = errorGuidelines[error.errorId];
                  console.log(`Rendering error ${error.errorId}:`, {
                    error,
                    guideline,
                    hasFixSteps: guideline?.errorFixSteps?.length > 0,
                    hasSpareParts: guideline?.errorSpareparts?.length > 0,
                  });
                  return (
                    <Card key={error.errorId} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive">
                              {error.errorCode}
                            </Badge>
                            <span className="font-medium">{error.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                error.severity === "Critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {error.severity}
                            </Badge>
                            <Badge variant="outline">{error.status}</Badge>
                          </div>
                        </div>
                      </CardHeader>

                      {guideline && (
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            {/* Guideline Selection */}
                            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                              <Checkbox
                                checked={selectedErrorGuidelines.includes(
                                  guideline.id
                                )}
                                onCheckedChange={(checked) =>
                                  handleErrorGuidelineSelection(
                                    guideline.id,
                                    !!checked
                                  )
                                }
                              />
                              <div className="flex-1">
                                <div className="font-medium">
                                  {guideline.title}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    Est. Time: {guideline.estimatedRepairTime}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <AlertTriangle className="h-4 w-4" />
                                    Priority: {guideline.priority}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Fix Steps */}
                            {guideline.errorFixSteps &&
                              guideline.errorFixSteps.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Wrench className="h-4 w-4" />
                                    Fix Steps ({guideline.errorFixSteps.length})
                                  </div>
                                  <div className="space-y-2 ml-6">
                                    {guideline.errorFixSteps
                                      .sort((a, b) => a.stepOrder - b.stepOrder)
                                      .map((step) => (
                                        <div
                                          key={step.id}
                                          className="flex items-start gap-2 text-sm"
                                        >
                                          <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                                            {step.stepOrder}
                                          </span>
                                          <span className="text-gray-700">
                                            {step.stepDescription}
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                            {/* Required Spare Parts */}
                            {guideline.errorSpareparts &&
                              guideline.errorSpareparts.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm font-medium">
                                    <Package className="h-4 w-4" />
                                    Required Spare Parts (
                                    {guideline.errorSpareparts.length})
                                  </div>
                                  <div className="grid gap-2 ml-6">
                                    {guideline.errorSpareparts.map(
                                      (sparepart) => (
                                        <div
                                          key={sparepart.sparepartId}
                                          className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                                        >
                                          <span>
                                            Part ID: {sparepart.sparepartId}
                                          </span>
                                          <span className="font-medium">
                                            Qty: {sparepart.quantityNeeded}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}

            {selectedErrorGuidelines.length > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      {selectedErrorGuidelines.length} guideline(s) selected
                    </span>
                    <span className="text-blue-600">
                      Total Est. Time: {totalEstimatedTime}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "mechanic":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Select Mechanic</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                Start Date: {startDate.toLocaleDateString()}{" "}
                {startDate.toLocaleTimeString()}
              </div>
            </div>

            {loadingMechanics ? (
              <SkeletonCard />
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Mechanic</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mechanics.map((mechanic) => (
                        <TableRow
                          key={mechanic.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedMechanic?.id === mechanic.id
                              ? "bg-blue-50"
                              : ""
                          }`}
                          onClick={() => handleMechanicSelection(mechanic)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedMechanic?.id === mechanic.id}
                              onCheckedChange={() =>
                                handleMechanicSelection(mechanic)
                              } // ✅ Fixed prop
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary text-white text-sm">
                                  {getFirstLetterUppercase(mechanic.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">
                                {mechanic.fullName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {mechanic.email}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">Available</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "overview":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Task Overview</h3>

            <div className="grid gap-6">
              {/* Task Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Task Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Task Type</Label>
                      <div className="font-medium">Repair Task</div>
                    </div>
                    <div>
                      <Label>Estimated Time</Label>
                      <div className="font-medium text-blue-600">
                        {totalEstimatedTime}
                      </div>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <div className="font-medium">
                        {startDate.toLocaleDateString()}{" "}
                        {startDate.toLocaleTimeString()}
                      </div>
                    </div>
                    <div>
                      <Label>Assigned To</Label>
                      <div className="font-medium">
                        {selectedMechanic?.fullName}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Guidelines */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Selected Guidelines ({selectedErrorGuidelines.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedErrorGuidelines.map((guidelineId) => {
                      const guideline = Object.values(errorGuidelines).find(
                        (g) => g.id === guidelineId
                      );
                      const error = availableErrors.find(
                        (e) => errorGuidelines[e.errorId]?.id === guidelineId
                      );

                      if (!guideline || !error) return null;

                      return (
                        <div
                          key={guidelineId}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive">
                              {error.errorCode}
                            </Badge>
                            <div>
                              <div className="font-medium">
                                {guideline.title}
                              </div>
                              <div className="text-sm text-gray-600">
                                {error.name}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">
                              Est. Time
                            </div>
                            <div className="font-medium">
                              {guideline.estimatedRepairTime}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "errors":
        return 33;
      case "mechanic":
        return 66;
      case "overview":
        return 100;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Repair Task</DialogTitle>
          <DialogDescription>
            Follow the steps to create a repair task for the selected errors
          </DialogDescription>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span
                className={
                  currentStep === "errors"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                1. Errors & Guidelines
              </span>
              <span
                className={
                  currentStep === "mechanic"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                2. Select Mechanic
              </span>
              <span
                className={
                  currentStep === "overview"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                3. Overview
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </DialogHeader>

        <div className="my-6">{renderStepContent()}</div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentStep !== "errors" && (
                <ButtonCpn
                  type="button"
                  title="Previous"
                  icon={<ChevronLeft />}
                  onClick={goToPreviousStep}
                />
              )}
            </div>

            <div className="flex gap-2">
              <ButtonCpn
                type="button"
                title="Cancel"
                onClick={() => setOpen(false)}
              />

              {currentStep === "overview" ? (
                <ButtonCpn
                  type="button"
                  title="Create Task"
                  icon={<Check />}
                  onClick={handleSubmit}
                  loading={creating}
                />
              ) : (
                <ButtonCpn
                  type="button"
                  title="Next Step"
                  icon={<ChevronRight />}
                  onClick={goToNextStep}
                />
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskFromErrorsCpn;
