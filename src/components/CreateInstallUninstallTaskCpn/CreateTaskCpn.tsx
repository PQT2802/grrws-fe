"use client";

import {
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../providers/AuthProvider";
import ButtonCpn from "../ButtonCpn/ButtonCpn";
import { DEVICE_WEB } from "@/types/device.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import userService from "@/app/service/user.service";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { getFirstLetterUppercase, formatTimeStampDate } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  CheckCircle,
  Calendar,
  AlertTriangle,
  Settings,
  Monitor,
  Check,
  Wrench,
  Shield,
  RotateCcw,
} from "lucide-react";
import { useModalBodyStyle } from "@/hooks/useModalBodyStyle";

interface CreateTaskCpnProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  device: DEVICE_WEB | null;
  onTaskCreated?: () => void;
}

type TaskType = "Repair" | "Warranty" | "Replacement";
type CreationMode = "Auto" | "Manual";
type Step = "task-type" | "manual-creation" | "overview";

const CreateTaskCpn = ({
  open,
  setOpen,
  device,
  onTaskCreated,
}: CreateTaskCpnProps) => {
  const { user: authUser } = useAuth();

  const [currentStep, setCurrentStep] = useState<Step>("task-type");
  const [canProceed, setCanProceed] = useState(false);
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [creationMode, setCreationMode] = useState<CreationMode | "">("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<GET_MECHANIC_USER | null>(null);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Replace existing body style management with hook
  useModalBodyStyle(open);

  const getAvailableTaskTypes = (deviceStatus: string): TaskType[] => {
    const availableTypes: TaskType[] = [];
    if (deviceStatus === "Inactive") {
      availableTypes.push("Repair", "Warranty");
    }
    if (deviceStatus === "Active") {
      availableTypes.push("Replacement");
    }
    return availableTypes;
  };

  const isTaskTypeAvailable = (taskType: TaskType): boolean => {
    if (!device) return false;
    return getAvailableTaskTypes(device.status).includes(taskType);
  };

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

  useEffect(() => {
    if (open) {
      fetchMechanics();
      setCurrentStep("task-type");
      setTaskType("");
      setCreationMode("");
      setAssigneeId("");
      setSelectedMechanic(null);
      setStartDate(new Date());
      setCanProceed(false);
    }
  }, [open]);

  useEffect(() => {
    switch (currentStep) {
      case "task-type":
        setCanProceed(!!taskType && !!creationMode);
        break;
      case "manual-creation":
        setCanProceed(!!selectedMechanic && !!startDate);
        break;
      case "overview":
        const baseRequirements = !!taskType && !!startDate;
        const manualRequirements =
          creationMode === "Manual" ? !!selectedMechanic : true;
        setCanProceed(baseRequirements && manualRequirements);
        break;
      default:
        setCanProceed(false);
        break;
    }
  }, [currentStep, taskType, creationMode, selectedMechanic, startDate]);

  const handleTaskTypeSelection = (type: TaskType) => {
    setTaskType(type);
  };

  const handleCreationModeSelection = (mode: CreationMode) => {
    setCreationMode(mode);
  };

  const handleMechanicSelection = (mechanic: GET_MECHANIC_USER) => {
    setSelectedMechanic(mechanic);
    setAssigneeId(mechanic.id);
  };

  const goToNextStep = () => {
    if (currentStep === "task-type") {
      if (creationMode === "Auto") {
        setCurrentStep("overview");
      } else {
        setCurrentStep("manual-creation");
      }
    } else if (currentStep === "manual-creation") {
      setCurrentStep("overview");
    }
  };

  const goToPreviousStep = () => {
    if (currentStep === "manual-creation") {
      setCurrentStep("task-type");
    } else if (currentStep === "overview") {
      if (creationMode === "Auto") {
        setCurrentStep("task-type");
      } else {
        setCurrentStep("manual-creation");
      }
    }
  };

  const handleSubmit = async () => {
    if (!taskType || !device) {
      toast.error("Please complete all required fields");
      return;
    }

    if (creationMode === "Manual" && (!assigneeId || !startDate)) {
      toast.error("Please complete all required fields for manual creation");
      return;
    }

    try {
      setCreating(true);
      console.log("Creating task with data:", {
        taskType,
        creationMode,
        deviceId: device.id,
        assigneeId: creationMode === "Manual" ? assigneeId : undefined,
        startDate: startDate?.toISOString(),
      });

      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `${taskType} task ${
          creationMode === "Auto" ? "auto-created" : "created"
        } successfully for device ${device.deviceName}!`
      );

      setOpen(false);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error(`Failed to create ${taskType?.toLowerCase()} task:`, error);
      toast.error(`Failed to create ${taskType?.toLowerCase()} task`);
    } finally {
      setCreating(false);
    }
  };

  const getTaskTypeIcon = (type: TaskType) => {
    switch (type) {
      case "Repair":
        return <Wrench className="h-6 w-6 text-orange-500" />;
      case "Warranty":
        return <Shield className="h-6 w-6 text-blue-500" />;
      case "Replacement":
        return <RotateCcw className="h-6 w-6 text-purple-500" />;
      default:
        return <Settings className="h-6 w-6 text-gray-500" />;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "task-type":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">
                Select Task Type & Creation Mode
              </h3>
              <p className="text-sm text-gray-600">
                Choose the type of task and how you want to create it
              </p>
            </div>

            {device && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">
                        Device: {device.deviceName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Status: {device.status} • Model: {device.model}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">Available Task Types:</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {["Repair", "Warranty", "Replacement"].map((type) => {
                  const taskType = type as TaskType;
                  const available = isTaskTypeAvailable(taskType);

                  return (
                    <Card
                      key={type}
                      className={`border cursor-pointer transition-colors ${
                        !available
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : taskType === type
                          ? "border-blue-500 bg-blue-50 hover:bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (available) {
                          handleTaskTypeSelection(taskType);
                        }
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        {getTaskTypeIcon(taskType)}
                        <h4
                          className={`text-sm font-semibold mt-2 mb-1 ${
                            !available ? "text-gray-400" : ""
                          }`}
                        >
                          {type} Task
                        </h4>
                        <p
                          className={`text-xs ${
                            !available ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {type === "Repair" && "Fix device issues"}
                          {type === "Warranty" && "Submit warranty claim"}
                          {type === "Replacement" && "Replace device"}
                        </p>
                        {available && (
                          <div className="mt-2">
                            <Checkbox
                              checked={taskType === type}
                              onCheckedChange={() =>
                                handleTaskTypeSelection(taskType)
                              }
                            />
                          </div>
                        )}
                        {!available && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded mt-2">
                            Not available for {device?.status} devices
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {taskType && (
              <div className="space-y-4">
                <h4 className="font-medium">Creation Mode:</h4>
                <div className="grid gap-3 md:grid-cols-2">
                  <Card
                    className={`border cursor-pointer transition-colors ${
                      creationMode === "Auto"
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleCreationModeSelection("Auto")}
                  >
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                      <h4 className="text-sm font-semibold mb-1">
                        Auto-create
                      </h4>
                      <p className="text-xs text-gray-600">
                        System automatically assigns mechanic and schedule
                      </p>
                      <div className="mt-2">
                        <Checkbox
                          checked={creationMode === "Auto"}
                          onCheckedChange={() =>
                            handleCreationModeSelection("Auto")
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className={`border cursor-pointer transition-colors ${
                      creationMode === "Manual"
                        ? "border-blue-500 bg-blue-50"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => handleCreationModeSelection("Manual")}
                  >
                    <CardContent className="p-4 text-center">
                      <User className="mx-auto h-8 w-8 text-blue-500 mb-2" />
                      <h4 className="text-sm font-semibold mb-1">
                        Manual creation
                      </h4>
                      <p className="text-xs text-gray-600">
                        Manually select mechanic and schedule
                      </p>
                      <div className="mt-2">
                        <Checkbox
                          checked={creationMode === "Manual"}
                          onCheckedChange={() =>
                            handleCreationModeSelection("Manual")
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {taskType && creationMode && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Selected: {taskType} Task ({creationMode} Creation)
                    </span>
                    <Badge variant="default">{taskType}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case "manual-creation":
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

            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getTaskTypeIcon(taskType as TaskType)}
                    <div>
                      <div className="font-medium">
                        Selected Task: {taskType}
                      </div>
                      <div className="text-sm text-gray-600">
                        Device: {device?.deviceName} ({device?.status})
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {loadingMechanics ? (
              <SkeletonCard />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Mechanic</CardTitle>
                </CardHeader>
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
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-semibold">Review & Create Task</h3>
              <p className="text-sm text-gray-600">
                Review the {taskType?.toLowerCase()} task details before
                creating
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Task Type</Label>
                    <div className="font-medium flex items-center gap-2">
                      {getTaskTypeIcon(taskType as TaskType)}
                      {taskType} Task
                    </div>
                  </div>
                  <div>
                    <Label>Creation Mode</Label>
                    <div className="font-medium">{creationMode}</div>
                  </div>
                  <div>
                    <Label>Device</Label>
                    <div className="font-medium">{device?.deviceName}</div>
                  </div>
                  <div>
                    <Label>Device Status</Label>
                    <div className="font-medium">
                      <Badge variant="outline">{device?.status}</Badge>
                    </div>
                  </div>
                  {creationMode === "Manual" && (
                    <>
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
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Device Details</CardTitle>
              </CardHeader>
              <CardContent>
                {device && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{device.deviceName}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Model: {device.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      Serial: {device.serialNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      Status: {device.status}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {creationMode === "Manual" && selectedMechanic && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Assigned Mechanic</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-white">
                        {getFirstLetterUppercase(selectedMechanic.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {selectedMechanic.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedMechanic.email}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const getStepProgress = () => {
    switch (currentStep) {
      case "task-type":
        return 33;
      case "manual-creation":
        return 66;
      case "overview":
        return 100;
      default:
        return 0;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case "task-type":
        return "Step 1: Select Task Type & Mode";
      case "manual-creation":
        return "Step 2: Assign Mechanic & Schedule";
      case "overview":
        return creationMode === "Auto"
          ? "Step 2: Review & Create"
          : "Step 3: Review & Create";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle>Create Task for {device?.deviceName}</DialogTitle>
          <DialogDescription>{getStepTitle()}</DialogDescription>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span
                className={
                  currentStep === "task-type"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                1. Task Type
              </span>
              {creationMode === "Manual" && (
                <span
                  className={
                    currentStep === "manual-creation"
                      ? "font-medium text-blue-600"
                      : "text-gray-500"
                  }
                >
                  2. Mechanic
                </span>
              )}
              <span
                className={
                  currentStep === "overview"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                {creationMode === "Auto" ? "2" : "3"}. Overview
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </DialogHeader>

        <div className="my-6">{renderStepContent()}</div>

        <DialogFooter>
          <div className="flex justify-between w-full">
            <div>
              {currentStep !== "task-type" && (
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
                  title={`Create ${taskType} Task`}
                  icon={<Check />}
                  onClick={canProceed ? handleSubmit : undefined}
                  loading={creating}
                />
              ) : (
                <ButtonCpn
                  type="button"
                  title="Next Step"
                  icon={<ChevronRight />}
                  onClick={canProceed ? goToNextStep : undefined}
                />
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskCpn;
