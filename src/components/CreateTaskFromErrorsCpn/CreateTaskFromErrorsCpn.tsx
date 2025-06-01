"use client";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useEffect,
  useState,
  useMemo,
} from "react";
import { v4 as uuidv4 } from "uuid";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "../providers/AuthProvider";
import ButtonCpn from "../ButtonCpn/ButtonCpn";
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { CREATE_TASK_WEB, SPAREPART_WEB } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import taskService from "@/app/service/task.service";
import userService from "@/app/service/user.service";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { getFirstLetterUppercase } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";

interface CreateTaskFromErrorsCpnProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  requestId: string;
  selectedErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  onTaskCreated?: () => void; // Callback to refresh data
}

const CreateTaskFromErrorsCpn = ({
  children,
  open,
  setOpen,
  requestId,
  selectedErrors,
  onTaskCreated,
}: CreateTaskFromErrorsCpnProps) => {
  const { user: authUser } = useAuth();

  // ✅ Filter out errors with "Assigned" status
  const availableErrors = useMemo(() => {
    return selectedErrors.filter((error) => error.status !== "Assigned");
  }, [selectedErrors]);

  const assignedErrors = useMemo(() => {
    return selectedErrors.filter((error) => error.status === "Assigned");
  }, [selectedErrors]);

  // Form state
  const [taskType, setTaskType] = useState<string>("Repair");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [selectedSpareParts, setSelectedSpareParts] = useState<string[]>([]);

  // Data state
  const [spareParts, setSpareParts] = useState<SPAREPART_WEB[]>([]);
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);

  // Loading states
  const [loadingSpareParts, setLoadingSpareParts] = useState<boolean>(false);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Form errors
  const [errors, setErrors] = useState({
    taskType: "",
    assigneeId: "",
    startDate: "",
  });

  // Task type options
  const taskTypeOptions = [
    { value: "Repair", label: "Repair" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Inspection", label: "Inspection" },
    { value: "Replacement", label: "Replacement" },
  ];

  // Fetch spare parts when errors change
  const fetchSpareParts = async () => {
    if (availableErrors.length === 0) return; // ✅ Use filtered errors

    try {
      setLoadingSpareParts(true);
      const errorIds = availableErrors.map((error) => error.errorId); // ✅ Use filtered errors
      const sparePartsData = await taskService.getSpareParts(errorIds);
      setSpareParts(sparePartsData);
    } catch (error) {
      console.error("Failed to fetch spare parts:", error);
      toast.error("Failed to fetch spare parts");
    } finally {
      setLoadingSpareParts(false);
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
      fetchSpareParts();
      fetchMechanics();
    }
  }, [open, selectedErrors]);

  // Validate form
  const validateForm = () => {
    const newErrors = {
      taskType: "",
      assigneeId: "",
      startDate: "",
    };

    if (!taskType) {
      newErrors.taskType = "Task type is required";
    }

    if (!assigneeId) {
      newErrors.assigneeId = "Assignee is required";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((error) => error === "");
  };

  // Handle spare part selection
  const handleSparePartSelection = (sparePartId: string, checked: boolean) => {
    if (checked) {
      setSelectedSpareParts([...selectedSpareParts, sparePartId]);
    } else {
      setSelectedSpareParts(
        selectedSpareParts.filter((id) => id !== sparePartId)
      );
    }
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (availableErrors.length === 0) {
      // ✅ Use filtered errors
      toast.error("No available errors to create task");
      return;
    }

    try {
      setCreating(true);

      // ✅ Transform data to match the curl format exactly
      const taskData = {
        RequestId: requestId, // ✅ Uppercase R
        TaskType: taskType, // ✅ Uppercase T
        StartDate: (startDate || new Date()).toISOString(), // ✅ Uppercase S
        ErrorIds: availableErrors.map((error) => error.errorId), // ✅ Uppercase E, use filtered errors
        AssigneeId: assigneeId, // ✅ Uppercase A
        SparepartIds: selectedSpareParts, // ✅ Uppercase S
      };

      console.log("Creating task with data:", taskData);
      console.log("Available errors being used:", availableErrors.length);
      console.log("Assigned errors excluded:", assignedErrors.length);

      const result = await taskService.createTaskFromErrors(taskData);

      console.log("Task created successfully:", result);
      toast.success("Task created successfully!");

      // Reset form
      setTaskType("Repair");
      setAssigneeId("");
      setStartDate(new Date());
      setSelectedSpareParts([]);
      setErrors({ taskType: "", assigneeId: "", startDate: "" });

      // Close modal
      setOpen(false);

      // Trigger callback
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task from Errors</DialogTitle>
            <DialogDescription>
              Create a maintenance task to fix the selected errors
              {assignedErrors.length > 0 && (
                <span className="block text-orange-600 mt-1">
                  Note: {assignedErrors.length} error(s) with
                  &quot;Assigned&quot; status are excluded
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 flex flex-col gap-6">
            {/* Available Errors Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Available Errors ({availableErrors.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableErrors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available errors to create task. All selected errors are
                    already assigned.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availableErrors.map((error) => (
                      <div
                        key={error.errorId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive">
                              {error.errorCode}
                            </Badge>
                            <span className="font-medium">{error.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
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
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Show assigned errors in a separate section */}
            {assignedErrors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">
                    Already Assigned Errors ({assignedErrors.length})
                  </CardTitle>
                  <DialogDescription>
                    These errors are already assigned to tasks and cannot be
                    included
                  </DialogDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {assignedErrors.map((error) => (
                      <div
                        key={error.errorId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 opacity-60"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="destructive">
                              {error.errorCode}
                            </Badge>
                            <span className="font-medium">{error.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={
                                error.severity === "Critical"
                                  ? "destructive"
                                  : "secondary"
                              }
                            >
                              {error.severity}
                            </Badge>
                            <Badge variant="default">{error.status}</Badge>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          Already Assigned
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Only show form if there are available errors */}
            {availableErrors.length > 0 && (
              <>
                {/* Task Details Section */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Task Type */}
                  <div className="grid gap-2">
                    <Label htmlFor="taskType">Task Type</Label>
                    <Select
                      value={taskType}
                      onValueChange={(value) => {
                        setTaskType(value);
                        setErrors({ ...errors, taskType: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {taskTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    {errors.taskType && (
                      <span className="text-sm text-red-500">
                        {errors.taskType}
                      </span>
                    )}
                  </div>

                  {/* Start Date */}
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DateTimePicker
                      date={startDate || new Date()}
                      setDate={setStartDate}
                    />
                    {errors.startDate && (
                      <span className="text-sm text-red-500">
                        {errors.startDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Assignee Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="assignee">Assign to Mechanic</Label>
                  {loadingMechanics ? (
                    <SkeletonCard />
                  ) : (
                    <Select
                      value={assigneeId}
                      onValueChange={(value) => {
                        setAssigneeId(value);
                        setErrors({ ...errors, assigneeId: "" });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a mechanic" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {mechanics.map((mechanic) => (
                            <SelectItem key={mechanic.id} value={mechanic.id}>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-6 w-6 rounded-md">
                                  <AvatarFallback className="rounded-md bg-primary text-white text-xs">
                                    {getFirstLetterUppercase(mechanic.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="text-left">
                                  <div className="text-sm font-medium">
                                    {mechanic.fullName}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {mechanic.email}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                  {errors.assigneeId && (
                    <span className="text-sm text-red-500">
                      {errors.assigneeId}
                    </span>
                  )}
                </div>

                {/* Spare Parts Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Required Spare Parts
                    </CardTitle>
                    <DialogDescription>
                      Select the spare parts needed for this task
                    </DialogDescription>
                  </CardHeader>
                  <CardContent>
                    {loadingSpareParts ? (
                      <SkeletonCard />
                    ) : spareParts.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No spare parts found for available errors
                      </div>
                    ) : (
                      <div className="grid gap-3">
                        {spareParts.map((part) => (
                          <div
                            key={part.spartpartId}
                            className="flex items-center space-x-3 p-3 border rounded-lg"
                          >
                            <Checkbox
                              checked={selectedSpareParts.includes(
                                part.spartpartId
                              )}
                              onCheckedChange={(checked) =>
                                handleSparePartSelection(
                                  part.spartpartId,
                                  !!checked
                                )
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">
                                    {part.spartpartName}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    For: {part.errorName} ({part.errorCode})
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">
                                    Need:{" "}
                                    <span className="font-medium">
                                      {part.quantityNeed} {part.unit}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Stock: {part.stockQuatity} {part.unit}
                                  </div>
                                </div>
                              </div>
                              {part.quantityNeed > part.stockQuatity && (
                                <Badge variant="destructive" className="mt-2">
                                  Insufficient Stock
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          <DialogFooter>
            <div className="flex gap-2">
              <ButtonCpn
                type="button"
                title="Cancel"
                onClick={() => setOpen(false)}
              />
              {availableErrors.length > 0 && (
                <ButtonCpn
                  type="submit"
                  title={`Create Task (${availableErrors.length} errors)`}
                  loading={creating}
                />
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskFromErrorsCpn;
