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
import { TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB } from "@/types/task.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import taskService from "@/app/service/task.service";
import userService from "@/app/service/user.service";
import { DateTimePicker } from "../DateTimePicker/DateTimePicker";
import { getFirstLetterUppercase } from "@/lib/utils";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";

interface CreateTaskFromTechnicalIssuesCpnProps {
  children: React.ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  requestId: string;
  selectedTechnicalIssues: TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[];
  onTaskCreated?: () => void; // Callback to refresh data
}

const CreateTaskFromTechnicalIssuesCpn = ({
  children,
  open,
  setOpen,
  requestId,
  selectedTechnicalIssues,
  onTaskCreated,
}: CreateTaskFromTechnicalIssuesCpnProps) => {
  const { user: authUser } = useAuth();

  // ✅ Filter out technical issues with "Assigned" status
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

  // Form state
  const [taskType, setTaskType] = useState<string>("Warranty");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());

  // Data state
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);

  // Loading states
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Form errors
  const [errors, setErrors] = useState({
    taskType: "",
    assigneeId: "",
    startDate: "",
  });

  // Task type options for warranty tasks
  const taskTypeOptions = [
    { value: "Warranty", label: "Warranty" },
    { value: "Warranty Repair", label: "Warranty Repair" },
    { value: "Warranty Replacement", label: "Warranty Replacement" },
    { value: "Warranty Inspection", label: "Warranty Inspection" },
  ];

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
      fetchMechanics();
    }
  }, [open, selectedTechnicalIssues]);

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

  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (availableTechnicalIssues.length === 0) {
      toast.error("No available technical issues to create task");
      return;
    }

    try {
      setCreating(true);

      // ✅ Transform data to match the API format
      const taskData: CREATE_TASK_FROM_TECHNICAL_ISSUE_WEB = {
        RequestId: requestId,
        TaskType: taskType,
        StartDate: (startDate || new Date()).toISOString(),
        AssigneeId: assigneeId,
        TechnicalIssueIds: availableTechnicalIssues.map(
          (issue) => issue.technicalIssueId
        ),
      };

      console.log("Creating warranty task with data:", taskData);
      console.log(
        "Available technical issues being used:",
        availableTechnicalIssues.length
      );
      console.log(
        "Assigned technical issues excluded:",
        assignedTechnicalIssues.length
      );

      const result = await taskService.createTaskFromTechnicalIssue(taskData);

      console.log("Warranty task created successfully:", result);
      toast.success("Warranty task created successfully!");

      // Reset form
      setTaskType("Warranty");
      setAssigneeId("");
      setStartDate(new Date());
      setErrors({ taskType: "", assigneeId: "", startDate: "" });

      // Close modal
      setOpen(false);

      // Trigger callback
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-4xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              Create Warranty Task from Technical Issues
            </DialogTitle>
            <DialogDescription>
              Create a warranty task to address the selected technical issues
              {assignedTechnicalIssues.length > 0 && (
                <span className="block text-orange-600 mt-1">
                  Note: {assignedTechnicalIssues.length} technical issue(s) with
                  &quot;Assigned&quot; status are excluded
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 flex flex-col gap-6">
            {/* Available Technical Issues Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Available Technical Issues ({availableTechnicalIssues.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {availableTechnicalIssues.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No available technical issues to create task. All selected
                    issues are already assigned.
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {availableTechnicalIssues.map((issue) => (
                      <div
                        key={issue.technicalIssueId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{issue.symptomCode}</Badge>
                            <span className="font-medium">{issue.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={issue.isCommon ? "default" : "secondary"}
                            >
                              {issue.isCommon ? "Common" : "Specific"}
                            </Badge>
                            <Badge variant="outline">{issue.status}</Badge>
                          </div>
                          {issue.description && (
                            <div className="text-sm text-gray-600 mt-1">
                              {issue.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ✅ Show assigned technical issues in a separate section */}
            {assignedTechnicalIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-orange-600">
                    Already Assigned Technical Issues (
                    {assignedTechnicalIssues.length})
                  </CardTitle>
                  <DialogDescription>
                    These technical issues are already assigned to tasks and
                    cannot be included
                  </DialogDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {assignedTechnicalIssues.map((issue) => (
                      <div
                        key={issue.technicalIssueId}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 opacity-60"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{issue.symptomCode}</Badge>
                            <span className="font-medium">{issue.name}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant={issue.isCommon ? "default" : "secondary"}
                            >
                              {issue.isCommon ? "Common" : "Specific"}
                            </Badge>
                            <Badge variant="default">{issue.status}</Badge>
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

            {/* Only show form if there are available technical issues */}
            {availableTechnicalIssues.length > 0 && (
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
              {availableTechnicalIssues.length > 0 && (
                <ButtonCpn
                  type="submit"
                  title={`Create Warranty Task (${availableTechnicalIssues.length} issues)`}
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

export default CreateTaskFromTechnicalIssuesCpn;
