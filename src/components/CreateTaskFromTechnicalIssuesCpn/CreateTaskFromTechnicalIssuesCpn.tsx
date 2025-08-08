"use client";

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { CREATE_WARRANTY_TASK } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { WarrantyInfo } from "@/types/warranty.type";
import userService from "@/app/service/user.service";
import { apiClient } from "@/lib/api-client";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { getFirstLetterUppercase } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Package,
  Clock,
  Check,
  Plus,
} from "lucide-react";

interface CreateTaskFromTechnicalIssuesCpnProps {
  children?: React.ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  requestId: string;
  deviceId: string;
  selectedTechnicalIssues: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[];
  onTaskCreated?: () => void;
  hasUninstallTask?: boolean; // ✅ Add this prop
}

// ✅ Use same step type as CreateTaskFromErrorsCpn
type Step = "warranty" | "mechanic" | "overview";

const CreateTaskFromTechnicalIssuesCpn = ({
  children,
  open,
  setOpen,
  requestId,
  deviceId,
  selectedTechnicalIssues,
  onTaskCreated,
  hasUninstallTask = false, // ✅ Add this with default value
}: CreateTaskFromTechnicalIssuesCpnProps) => {
  const { user: authUser } = useAuth();

  // ✅ Filter out technical issues with "Assigned" status (same pattern as errors)
  const availableTechnicalIssues = useMemo(() => {
    return selectedTechnicalIssues.filter(
      (issue) => issue.status !== "Assigned"
    );
  }, [selectedTechnicalIssues]);

  const assignedTechnicalIssues = useMemo(() => {
    return selectedTechnicalIssues.filter(
      (issue) => issue.status === "Assigned"
    );
  }, [selectedTechnicalIssues]);

  // ✅ Navigation state (same as CreateTaskFromErrorsCpn)
  const [currentStep, setCurrentStep] = useState<Step>("warranty");
  const [canProceed, setCanProceed] = useState(false);

  // ✅ Form state
  const [selectedWarrantyId, setSelectedWarrantyId] = useState<string>("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date()); // ✅ Default to now

  // ✅ Data state
  const [warranties, setWarranties] = useState<WarrantyInfo[]>([]);
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<GET_MECHANIC_USER | null>(null);

  // ✅ Loading states
  const [loadingWarranties, setLoadingWarranties] = useState<boolean>(false);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // ✅ Get selected warranty info
  const selectedWarranty = warranties.find((w) => w.id === selectedWarrantyId);

  // ✅ Fetch warranties for the device (memoized to avoid recreation each render)
  const fetchWarranties = useCallback(async () => {
    try {
      setLoadingWarranties(true);
      console.log("Fetching warranties for device:", deviceId);
      const warrantiesData = await apiClient.warranty.getDeviceWarranties(
        deviceId
      );

      // ✅ Filter only active warranties
      const activeWarranties = warrantiesData.filter((w) => w.isUnderWarranty);
      setWarranties(activeWarranties);

      console.log("✅ Active warranties fetched:", activeWarranties);
    } catch (error) {
      console.error("Failed to fetch warranties:", error);
      toast.error("Failed to fetch device warranties");
    } finally {
      setLoadingWarranties(false);
    }
  }, [deviceId]);

  // ✅ Fetch mechanics (same as CreateTaskFromErrorsCpn)
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

  // ✅ Effect to fetch data when modal opens (same pattern)
  useEffect(() => {
    if (open) {
      fetchWarranties();
      fetchMechanics();
      // Reset state
      setCurrentStep("warranty");
      setSelectedWarrantyId("");
      setAssigneeId("");
      setSelectedMechanic(null);
      setStartDate(new Date());
      setCanProceed(false);
    }
  }, [open, fetchWarranties]);

  // ✅ Check if current step can proceed (same pattern)
  useEffect(() => {
    switch (currentStep) {
      case "warranty":
        setCanProceed(selectedWarrantyId !== "");
        break;
      case "mechanic":
        setCanProceed(!!selectedMechanic);
        break;
      case "overview":
        setCanProceed(true);
        break;
    }
  }, [currentStep, selectedWarrantyId, selectedMechanic]);

  // ✅ Handle warranty selection
  const handleWarrantySelection = (warrantyId: string) => {
    setSelectedWarrantyId(warrantyId);
  };

  // ✅ Handle mechanic selection (same as CreateTaskFromErrorsCpn)
  const handleMechanicSelection = (mechanic: GET_MECHANIC_USER) => {
    setSelectedMechanic(mechanic);
    setAssigneeId(mechanic.id);
  };

  // ✅ Navigation functions (same as CreateTaskFromErrorsCpn)
  const goToNextStep = () => {
    if (currentStep === "warranty") setCurrentStep("mechanic");
    else if (currentStep === "mechanic") setCurrentStep("overview");
  };

  const goToPreviousStep = () => {
    if (currentStep === "mechanic") setCurrentStep("warranty");
    else if (currentStep === "overview") setCurrentStep("mechanic");
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (availableTechnicalIssues.length === 0) {
      toast.error("No available technical issues to create task");
      return;
    }

    if (!selectedWarrantyId || !assigneeId || !startDate) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setCreating(true);

      // ✅ Transform data to match the API format
      const taskData: CREATE_WARRANTY_TASK = {
        RequestId: requestId,
        StartDate: startDate.toISOString(),
        DeviceWarrantyId: selectedWarrantyId,
        AssigneeId: assigneeId,
        TechnicalIssueIds: availableTechnicalIssues.map(
          (issue) => issue.technicalIssueId
        ),
      };

      console.log("Creating warranty task with data:", taskData);

      const result = await apiClient.task.createWarrantyTask(taskData);

      console.log("Warranty task created successfully:", result);
      toast.success("Warranty task created successfully!");

      // Reset and close
      setOpen(false);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Failed to create warranty task:", error);
      toast.error("Failed to create warranty task");
    } finally {
      setCreating(false);
    }
  };

  // ✅ Render step content (same structure as CreateTaskFromErrorsCpn)
  const renderStepContent = () => {
    switch (currentStep) {
      case "warranty":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Select Device Warranty</h3>
              <p className="text-sm text-gray-600">
                Choose an active warranty for this device to create the warranty
                task
              </p>
            </div>

            {loadingWarranties ? (
              <SkeletonCard />
            ) : warranties.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                    <div className="text-lg font-medium">
                      No Active Warranties Found
                    </div>
                    <div className="text-sm mt-2">
                      This device doesn&apos;t have any active warranties
                      available for warranty tasks.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {warranties.map((warranty) => (
                  <Card
                    key={warranty.id}
                    className={`border cursor-pointer hover:bg-gray-50 ${
                      selectedWarrantyId === warranty.id
                        ? "border-blue-500 bg-blue-50"
                        : ""
                    }`}
                    onClick={() => handleWarrantySelection(warranty.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedWarrantyId === warranty.id}
                            onCheckedChange={() =>
                              handleWarrantySelection(warranty.id)
                            }
                          />
                          <Badge variant="default">
                            {warranty.warrantyCode}
                          </Badge>
                          <Badge variant="outline">
                            {warranty.warrantyType}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={
                              warranty.lowDayWarning
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {warranty.daysRemaining} days left
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            Provider: {warranty.provider}
                          </div>
                          {warranty.cost > 0 && (
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4" />
                              Cost: ${warranty.cost}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          Reason: {warranty.warrantyReason}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            Start:{" "}
                            {new Date(
                              warranty.warrantyStartDate
                            ).toLocaleDateString()}
                          </span>
                          <span>
                            End:{" "}
                            {new Date(
                              warranty.warrantyEndDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {selectedWarrantyId && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Warranty selected: {selectedWarranty?.warrantyCode}
                    </span>
                    <span className="text-blue-600">
                      {selectedWarranty?.daysRemaining} days remaining
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
              <h3 className="text-lg font-semibold">
                Select Mechanic & Schedule
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Start Date & Time
                </Label>
                <DateTimePicker
                  date={startDate || new Date()}
                  setDate={setStartDate}
                />
              </div>
            </div>

            {/* Selected Warranty Info */}
            {selectedWarranty && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium">
                        Selected Warranty: {selectedWarranty.warrantyCode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedWarranty.warrantyType} •{" "}
                        {selectedWarranty.provider} •{" "}
                        {selectedWarranty.daysRemaining} days left
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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
                              }
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
            <h3 className="text-lg font-semibold">Warranty Task Overview</h3>

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
                      <div className="font-medium">Warranty Task</div>
                    </div>
                    <div>
                      <Label>Technical Issues</Label>
                      <div className="font-medium text-blue-600">
                        {availableTechnicalIssues.length} issue(s)
                      </div>
                    </div>
                    <div>
                      <Label>Start Date</Label>
                      <div className="font-medium">
                        {startDate?.toLocaleDateString()}{" "}
                        {startDate?.toLocaleTimeString()}
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

              {/* Warranty Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Warranty Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedWarranty && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="default">
                          {selectedWarranty.warrantyCode}
                        </Badge>
                        <Badge variant="outline">
                          {selectedWarranty.warrantyType}
                        </Badge>
                        <Badge
                          variant={
                            selectedWarranty.lowDayWarning
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {selectedWarranty.daysRemaining} days left
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Provider:</span>
                          <div className="font-medium">
                            {selectedWarranty.provider}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Reason:</span>
                          <div className="font-medium">
                            {selectedWarranty.warrantyReason}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Start Date:</span>
                          <div className="font-medium">
                            {new Date(
                              selectedWarranty.warrantyStartDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">End Date:</span>
                          <div className="font-medium">
                            {new Date(
                              selectedWarranty.warrantyEndDate
                            ).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Technical Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Technical Issues to Address (
                    {availableTechnicalIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {availableTechnicalIssues.map((issue) => (
                      <div
                        key={issue.technicalIssueId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{issue.symptomCode}</Badge>
                          <div>
                            <div className="font-medium">{issue.name}</div>
                            <div className="text-sm text-gray-600">
                              {issue.description}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={issue.isCommon ? "default" : "secondary"}
                          >
                            {issue.isCommon ? "Common" : "Specific"}
                          </Badge>
                          <Badge variant="outline">{issue.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Excluded Issues */}
              {assignedTechnicalIssues.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base text-orange-600">
                      Excluded Technical Issues (
                      {assignedTechnicalIssues.length})
                    </CardTitle>
                    <DialogDescription>
                      These issues are already assigned and will not be included
                    </DialogDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {assignedTechnicalIssues.map((issue) => (
                        <div
                          key={issue.technicalIssueId}
                          className="flex items-center justify-between p-2 border rounded bg-gray-50 opacity-60"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{issue.symptomCode}</Badge>
                            <span className="text-sm">{issue.name}</span>
                            <Badge variant="default">{issue.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ✅ Get step progress (same as CreateTaskFromErrorsCpn)
  const getStepProgress = () => {
    switch (currentStep) {
      case "warranty":
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
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Warranty Task from Technical Issues</DialogTitle>
          <DialogDescription>
            Follow the steps to create a warranty task for the selected
            technical issues
            {assignedTechnicalIssues.length > 0 &&
              currentStep === "warranty" && (
                <span className="block text-orange-600 mt-1">
                  Note: {assignedTechnicalIssues.length} technical issue(s) with
                  &quot;Assigned&quot; status will be excluded
                </span>
              )}
          </DialogDescription>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span
                className={
                  currentStep === "warranty"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                1. Select Warranty
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
              {currentStep !== "warranty" && (
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
                  title={`Create Warranty Task (${availableTechnicalIssues.length} issues)`}
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

export default CreateTaskFromTechnicalIssuesCpn;
