"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
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
import { CREATE_INSTALL_TASK, CREATE_UNINSTALL_TASK } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { DEVICE_WEB } from "@/types/device.type";
import userService from "@/app/service/user.service";

import { apiClient } from "@/lib/api-client";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { getFirstLetterUppercase } from "@/lib/utils";
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
} from "lucide-react";

interface CreateInstallUninstallTaskCpnProps {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  requestId: string;
  onTaskCreated?: () => void;
}

type TaskType = "Install" | "Uninstall";
type Step = "task-type" | "mechanic" | "device" | "overview";

const CreateInstallUninstallTaskCpn = ({
  open,
  setOpen,
  requestId,
  onTaskCreated,
}: CreateInstallUninstallTaskCpnProps) => {
  const { user: authUser } = useAuth();

  // ✅ Navigation state
  const [currentStep, setCurrentStep] = useState<Step>("task-type");
  const [canProceed, setCanProceed] = useState(false);

  // ✅ Form state
  const [taskType, setTaskType] = useState<TaskType | "">("");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  // ✅ Data state
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [devices, setDevices] = useState<DEVICE_WEB[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<GET_MECHANIC_USER | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null);

  // ✅ Loading states
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [loadingDevices, setLoadingDevices] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // ✅ Fetch mechanics
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

  // ✅ Fix the fetchDevices function (around line 110):
  const fetchDevices = async () => {
    try {
      setLoadingDevices(true);
      const devicesResponse = await apiClient.device.getDevices(1, 10); // ✅ Get more devices

      // ✅ Handle the response structure (it might have a data property)
      const devicesData = Array.isArray(devicesResponse)
        ? devicesResponse
        : (devicesResponse as any)?.data || []; // Adjust based on actual API response

      setDevices(devicesData);
      console.log("✅ Devices fetched:", devicesData);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
      toast.error("Failed to fetch devices");
    } finally {
      setLoadingDevices(false);
    }
  };

  // ✅ Effect to fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchMechanics();
      fetchDevices();
      // Reset state
      setCurrentStep("task-type");
      setTaskType("");
      setAssigneeId("");
      setSelectedDeviceId("");
      setSelectedMechanic(null);
      setSelectedDevice(null);
      setStartDate(new Date());
      setCanProceed(false);
    }
  }, [open]);

  // ✅ Check if current step can proceed
  useEffect(() => {
    switch (currentStep) {
      case "task-type":
        setCanProceed(taskType !== "");
        break;
      case "mechanic":
        setCanProceed(!!selectedMechanic);
        break;
      case "device":
        // Only needed for Install tasks
        setCanProceed(taskType === "Uninstall" || !!selectedDevice);
        break;
      case "overview":
        setCanProceed(true);
        break;
    }
  }, [currentStep, taskType, selectedMechanic, selectedDevice]);

  // ✅ Handle task type selection
  const handleTaskTypeSelection = (type: TaskType) => {
    setTaskType(type);
  };

  // ✅ Handle mechanic selection
  const handleMechanicSelection = (mechanic: GET_MECHANIC_USER) => {
    setSelectedMechanic(mechanic);
    setAssigneeId(mechanic.id);
  };

  // ✅ Handle device selection
  const handleDeviceSelection = (device: DEVICE_WEB) => {
    setSelectedDevice(device);
    setSelectedDeviceId(device.id);
  };

  // ✅ Navigation functions
  const goToNextStep = () => {
    if (currentStep === "task-type") setCurrentStep("mechanic");
    else if (currentStep === "mechanic") {
      // Skip device step for Uninstall tasks
      if (taskType === "Uninstall") {
        setCurrentStep("overview");
      } else {
        setCurrentStep("device");
      }
    } else if (currentStep === "device") setCurrentStep("overview");
  };

  const goToPreviousStep = () => {
    if (currentStep === "mechanic") setCurrentStep("task-type");
    else if (currentStep === "device") setCurrentStep("mechanic");
    else if (currentStep === "overview") {
      // Skip device step for Uninstall tasks when going back
      if (taskType === "Uninstall") {
        setCurrentStep("mechanic");
      } else {
        setCurrentStep("device");
      }
    }
  };

  // ✅ Handle form submission
  const handleSubmit = async () => {
    if (!taskType || !assigneeId || !startDate) {
      toast.error("Please complete all required fields");
      return;
    }

    if (taskType === "Install" && !selectedDeviceId) {
      toast.error("Please select a device for install task");
      return;
    }

    try {
      setCreating(true);

      if (taskType === "Install") {
        const taskData: CREATE_INSTALL_TASK = {
          RequestId: requestId,
          StartDate: startDate.toISOString(),
          AssigneeId: assigneeId,
          NewDeviceId: selectedDeviceId,
        };

        console.log("Creating install task with data:", taskData);
        const result = await apiClient.task.createInstallTask(taskData);
        console.log("Install task created successfully:", result);
        toast.success("Install task created successfully!");
      } else {
        const taskData: CREATE_UNINSTALL_TASK = {
          RequestId: requestId,
          StartDate: startDate.toISOString(),
          AssigneeId: assigneeId,
        };

        console.log("Creating uninstall task with data:", taskData);
        const result = await apiClient.task.createUninstallTask(taskData);
        console.log("Uninstall task created successfully:", result);
        toast.success("Uninstall task created successfully!");
      }

      // Reset and close
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

  // ✅ Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "task-type":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Settings className="mx-auto h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-semibold">Select Task Type</h3>
              <p className="text-sm text-gray-600">
                Choose whether you want to create an Install or Uninstall task
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card
                className={`border cursor-pointer hover:bg-gray-50 ${
                  taskType === "Install" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => handleTaskTypeSelection("Install")}
              >
                <CardContent className="p-6 text-center">
                  <Monitor className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Install Task</h4>
                  <p className="text-sm text-gray-600">
                    Install a new device at the location
                  </p>
                  <div className="mt-4">
                    <Checkbox
                      checked={taskType === "Install"}
                      onCheckedChange={() => handleTaskTypeSelection("Install")}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card
                className={`border cursor-pointer hover:bg-gray-50 ${
                  taskType === "Uninstall" ? "border-blue-500 bg-blue-50" : ""
                }`}
                onClick={() => handleTaskTypeSelection("Uninstall")}
              >
                <CardContent className="p-6 text-center">
                  <Package className="mx-auto h-12 w-12 text-red-500 mb-4" />
                  <h4 className="text-lg font-semibold mb-2">Uninstall Task</h4>
                  <p className="text-sm text-gray-600">
                    Remove an existing device from the location
                  </p>
                  <div className="mt-4">
                    <Checkbox
                      checked={taskType === "Uninstall"}
                      onCheckedChange={() =>
                        handleTaskTypeSelection("Uninstall")
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {taskType && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Selected: {taskType} Task
                    </span>
                    <Badge variant="default">{taskType}</Badge>
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

            {/* Selected Task Type Info */}
            <Card className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  {taskType === "Install" ? (
                    <Monitor className="h-5 w-5 text-green-500" />
                  ) : (
                    <Package className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <div className="font-medium">Selected Task: {taskType}</div>
                    <div className="text-sm text-gray-600">
                      {taskType === "Install"
                        ? "Install a new device at the location"
                        : "Remove an existing device from the location"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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

      case "device":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Monitor className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-semibold">
                Select Device to Install
              </h3>
              <p className="text-sm text-gray-600">
                Choose the device that will be installed at this location
              </p>
            </div>

            {loadingDevices ? (
              <SkeletonCard />
            ) : devices.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="mx-auto h-12 w-12 text-orange-500 mb-4" />
                    <div className="text-lg font-medium">No Devices Found</div>
                    <div className="text-sm mt-2">
                      No available devices found for installation.
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Device Name</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Serial Number</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {devices.map((device) => (
                        <TableRow
                          key={device.id}
                          className={`cursor-pointer hover:bg-gray-50 ${
                            selectedDevice?.id === device.id ? "bg-blue-50" : ""
                          }`}
                          onClick={() => handleDeviceSelection(device)}
                        >
                          <TableCell>
                            <Checkbox
                              checked={selectedDevice?.id === device.id}
                              onCheckedChange={() =>
                                handleDeviceSelection(device)
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Monitor className="h-5 w-5 text-gray-500" />
                              <span className="font-medium">
                                {device.deviceName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {device.description}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {device.serialNumber}
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

            {/* Task Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Task Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Task Type</Label>
                    <div className="font-medium flex items-center gap-2">
                      {taskType === "Install" ? (
                        <Monitor className="h-4 w-4 text-green-500" />
                      ) : (
                        <Package className="h-4 w-4 text-red-500" />
                      )}
                      {taskType} Task
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
                  {taskType === "Install" && selectedDevice && (
                    <div>
                      <Label>Device to Install</Label>
                      <div className="font-medium">
                        {selectedDevice.deviceName}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Detailed Information */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Mechanic Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Assigned Mechanic</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedMechanic && (
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
                  )}
                </CardContent>
              </Card>

              {/* Device Details (for Install tasks) */}
              {taskType === "Install" && selectedDevice && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Device Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">
                          {selectedDevice.deviceName}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Model: {selectedDevice.deviceName}
                      </div>
                      <div className="text-sm text-gray-600">
                        Serial: {selectedDevice.serialNumber}
                      </div>
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

  // ✅ Get step progress
  const getStepProgress = () => {
    const totalSteps = taskType === "Uninstall" ? 3 : 4; // Uninstall skips device step
    switch (currentStep) {
      case "task-type":
        return 25;
      case "mechanic":
        return taskType === "Uninstall" ? 66 : 50;
      case "device":
        return 75;
      case "overview":
        return 100;
      default:
        return 0;
    }
  };

  // ✅ Get step title
  const getStepTitle = () => {
    switch (currentStep) {
      case "task-type":
        return "Step 1: Select Task Type";
      case "mechanic":
        return "Step 2: Assign Mechanic";
      case "device":
        return "Step 3: Select Device";
      case "overview":
        return taskType === "Uninstall"
          ? "Step 3: Review & Create"
          : "Step 4: Review & Create";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Install/Uninstall Task</DialogTitle>
          <DialogDescription>{getStepTitle()}</DialogDescription>

          {/* Progress Bar */}
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
              <span
                className={
                  currentStep === "mechanic"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                2. Mechanic
              </span>
              {taskType === "Install" && (
                <span
                  className={
                    currentStep === "device"
                      ? "font-medium text-blue-600"
                      : "text-gray-500"
                  }
                >
                  3. Device
                </span>
              )}
              <span
                className={
                  currentStep === "overview"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                {taskType === "Uninstall" ? "3" : "4"}. Overview
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

export default CreateInstallUninstallTaskCpn;
