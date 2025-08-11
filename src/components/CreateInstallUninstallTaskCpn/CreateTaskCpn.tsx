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
import { DateTimeSelector } from "../DateTimeSelector/DateTimeSelector";
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
// Import the task type and API client
import { CREATE_SINGLE_TASK } from "@/types/task.type";
import { apiClient } from "@/lib/api-client";

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

      // Set default time to current time + 1 hour
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours());
      defaultDate.setMinutes(defaultDate.getMinutes()); // Next hour, 0 minutes
      setStartDate(defaultDate);

      setCanProceed(false);
    }
  }, [open]);

  // New effect for auto-assigning first mechanic in Auto mode
  useEffect(() => {
    // When Auto mode is selected and mechanics are loaded, auto-assign first mechanic
    if (creationMode === "Auto" && mechanics.length > 0) {
      setAssigneeId(mechanics[0].id);
      setSelectedMechanic(mechanics[0]);
    }
  }, [creationMode, mechanics]);

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
    // Nếu đã chọn type này rồi, không làm gì
    // Nếu chưa chọn, gán type mới và xóa các lựa chọn khác
    if (taskType !== type) {
      setTaskType(type);
    }
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

  // Updated handleSubmit to use the API
  const handleSubmit = async () => {
    if (!taskType || !device) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (creationMode === "Manual" && (!assigneeId || !startDate)) {
      toast.error("Vui lòng điền đầy đủ thông tin cho tạo thủ công");
      return;
    }

    try {
      setCreating(true);

      // Determine assigneeId based on creation mode
      const finalAssigneeId =
        creationMode === "Auto"
          ? mechanics[0]?.id // Auto-assign first mechanic for Auto mode
          : assigneeId;

      // Create API payload
      const payload: CREATE_SINGLE_TASK = {
        DeviceId: device.id,
        AssigneeId: finalAssigneeId,
        StartDate: startDate?.toISOString() || new Date().toISOString(),
        TaskType: taskType as "Repair" | "Warranty" | "Replacement",
      };

      console.log("Đang tạo công việc:", payload);

      // Call the actual API
      const response = await apiClient.task.createSingleTask(payload);

      toast.success(
        `Công việc ${getTaskTypeVietnamese(taskType)} ${
          creationMode === "Auto" ? "tự động tạo" : "đã được tạo"
        } thành công cho thiết bị ${device.deviceName}!`
      );

      setOpen(false);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error(
        `Lỗi khi tạo công việc ${getTaskTypeVietnamese(
          taskType
        ).toLowerCase()}:`,
        error
      );
      toast.error(
        `Không thể tạo công việc ${getTaskTypeVietnamese(
          taskType
        ).toLowerCase()}`
      );
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

  // Thêm useEffect để đặt Auto làm mặc định khi chọn loại công việc
  useEffect(() => {
    // Khi loại công việc được chọn, tự động đặt chế độ tạo là "Auto"
    if (taskType && !creationMode) {
      setCreationMode("Auto");
    }
  }, [taskType, creationMode]);

  // Tương ứng với từng loại công việc
  const getTaskTypeVietnamese = (type: TaskType | "") => {
    switch (type) {
      case "Repair":
        return "Sửa chữa";
      case "Warranty":
        return "Bảo hành";
      case "Replacement":
        return "Thay thế";
      default:
        return "";
    }
  };

  // Mô tả việt hóa
  const getTaskTypeDescription = (type: TaskType) => {
    switch (type) {
      case "Repair":
        return "Sửa chữa thiết bị";
      case "Warranty":
        return "Yêu cầu bảo hành";
      case "Replacement":
        return "Thay thế thiết bị";
      default:
        return "";
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
                Chọn loại công việc & phương thức tạo
              </h3>
              <p className="text-sm text-gray-600">
                Chọn loại công việc và cách bạn muốn tạo
              </p>
            </div>

            {device && (
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Monitor className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">
                        Thiết bị: {device.deviceName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Trạng thái:{" "}
                        {device.status === "Active"
                          ? "Hoạt động"
                          : "Không hoạt động"}{" "}
                        • Model: {device.model}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              <h4 className="font-medium">Loại công việc có sẵn:</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {["Repair", "Warranty", "Replacement"].map((type) => {
                  const taskTypeValue = type as TaskType;
                  const available = isTaskTypeAvailable(taskTypeValue);

                  return (
                    <Card
                      key={type}
                      className={`border cursor-pointer transition-colors ${
                        !available
                          ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                          : taskType === taskTypeValue
                          ? "border-blue-500 bg-blue-50 hover:bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                      onClick={() => {
                        if (available) {
                          handleTaskTypeSelection(taskTypeValue);
                        }
                      }}
                    >
                      <CardContent className="p-4 text-center">
                        {getTaskTypeIcon(taskTypeValue)}
                        <h4
                          className={`text-sm font-semibold mt-2 mb-1 ${
                            !available ? "text-gray-400" : ""
                          }`}
                        >
                          {getTaskTypeVietnamese(taskTypeValue)}
                        </h4>
                        <p
                          className={`text-xs ${
                            !available ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {getTaskTypeDescription(taskTypeValue)}
                        </p>
                        {available && (
                          <div className="mt-2">
                            <Checkbox
                              checked={taskType === taskTypeValue}
                              onCheckedChange={() =>
                                handleTaskTypeSelection(taskTypeValue)
                              }
                            />
                          </div>
                        )}
                        {!available && (
                          <div className="text-xs text-red-600 bg-red-50 p-1 rounded mt-2">
                            Không khả dụng cho thiết bị{" "}
                            {device?.status === "Active"
                              ? "đang hoạt động"
                              : "không hoạt động"}
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
                <h4 className="font-medium">Phương thức tạo:</h4>
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
                        Tự động tạo
                      </h4>
                      <p className="text-xs text-gray-600">
                        Hệ thống tự động phân công thợ máy và lịch trình
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
                        Tạo thủ công
                      </h4>
                      <p className="text-xs text-gray-600">
                        Tự chọn thợ máy và lịch trình
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

            {taskType && (
              <div className="space-y-4 mt-6">
                <h4 className="font-medium">Chọn thời gian bắt đầu:</h4>
                <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                  <Label
                    htmlFor="startDate"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Ngày & giờ bắt đầu
                  </Label>
                  <DateTimeSelector
                    date={startDate || new Date()}
                    setDate={handleDateChange}
                    minDate={new Date()}
                  />
                </div>
                <p className="text-xs text-gray-500 italic">
                  Lưu ý: Chỉ có thể chọn thời gian trong tương lai
                </p>
              </div>
            )}

            {taskType && creationMode && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-800">
                      Đã chọn: {getTaskTypeVietnamese(taskType)} (
                      {creationMode === "Auto" ? "Tự động" : "Thủ công"})
                    </span>
                    <Badge variant="default">
                      {getTaskTypeVietnamese(taskType)}
                    </Badge>
                  </div>
                  {startDate && (
                    <div className="text-sm text-blue-700 mt-2">
                      Thời gian bắt đầu: {startDate.toLocaleDateString()}{" "}
                      {startDate.toLocaleTimeString()}
                    </div>
                  )}
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
                Chọn thợ máy & lịch trình
              </h3>
              <div className="flex items-center gap-2">
                <Label htmlFor="startDate">
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Ngày & giờ bắt đầu
                </Label>
                <DateTimeSelector
                  date={startDate || new Date()}
                  setDate={handleDateChange}
                  minDate={new Date()}
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
                        Loại công việc: {getTaskTypeVietnamese(taskType)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Thiết bị: {device?.deviceName} (
                        {device?.status === "Active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                        )
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
                  <CardTitle className="text-base">Chọn thợ máy</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Chọn</TableHead>
                        <TableHead>Thợ máy</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Trạng thái</TableHead>
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
                            <Badge variant="outline">Khả dụng</Badge>
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
              <h3 className="text-lg font-semibold">Xem lại & Tạo công việc</h3>
              <p className="text-sm text-gray-600">
                Xem lại chi tiết công việc{" "}
                {getTaskTypeVietnamese(taskType).toLowerCase()} trước khi tạo
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tổng quan công việc</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Loại công việc</Label>
                    <div className="font-medium flex items-center gap-2">
                      {getTaskTypeIcon(taskType as TaskType)}
                      {getTaskTypeVietnamese(taskType)}
                    </div>
                  </div>
                  <div>
                    <Label>Phương thức tạo</Label>
                    <div className="font-medium">
                      {creationMode === "Auto" ? "Tự động" : "Thủ công"}
                    </div>
                  </div>
                  <div>
                    <Label>Thiết bị</Label>
                    <div className="font-medium">{device?.deviceName}</div>
                  </div>
                  <div>
                    <Label>Trạng thái thiết bị</Label>
                    <div className="font-medium">
                      <Badge variant="outline">
                        {device?.status === "Active"
                          ? "Hoạt động"
                          : "Không hoạt động"}
                      </Badge>
                    </div>
                  </div>
                  {creationMode === "Manual" && (
                    <>
                      <div>
                        <Label>Ngày bắt đầu</Label>
                        <div className="font-medium">
                          {startDate?.toLocaleDateString()}{" "}
                          {startDate?.toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <Label>Phân công cho</Label>
                        <div className="font-medium">
                          {selectedMechanic?.fullName}
                        </div>
                      </div>
                    </>
                  )}
                  {creationMode === "Auto" && (
                    <>
                      <div>
                        <Label>Ngày bắt đầu</Label>
                        <div className="font-medium">
                          {startDate?.toLocaleDateString()}{" "}
                          {startDate?.toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <Label>Phân công</Label>
                        <div className="font-medium">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                          >
                            Tự động phân công
                          </Badge>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Chi tiết thiết bị</CardTitle>
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
                      Trạng thái:{" "}
                      {device.status === "Active"
                        ? "Hoạt động"
                        : "Không hoạt động"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Show mechanic information for both Auto and Manual modes */}
            {selectedMechanic && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    {creationMode === "Auto"
                      ? "Thợ máy được phân công tự động"
                      : "Thợ máy được phân công"}
                  </CardTitle>
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
                      {creationMode === "Auto" && (
                        <Badge variant="outline" className="mt-1">
                          Tự động phân công
                        </Badge>
                      )}
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

  // Việt hóa bước tiêu đề và quản lý bước
  const getStepTitle = () => {
    switch (currentStep) {
      case "task-type":
        return "Bước 1: Chọn loại công việc & phương thức";
      case "manual-creation":
        return "Bước 2: Phân công thợ máy & lịch trình";
      case "overview":
        return creationMode === "Auto"
          ? "Bước 2: Xem lại & Tạo"
          : "Bước 3: Xem lại & Tạo";
      default:
        return "";
    }
  };

  // Function to check if date is in the past
  const isDateInPast = (date: Date) => {
    const now = new Date();
    now.setSeconds(0, 0);
    date.setSeconds(0, 0);
    return date < now;
  };

  // Handle date selection with validation
  const handleDateChange = (newDate: Date | undefined) => {
    if (!newDate) return;

    // Avoid redundant state updates
    if (startDate && newDate.getTime() === startDate.getTime()) {
      return;
    }

    if (isDateInPast(new Date(newDate.getTime()))) {
      toast.error("Không thể chọn thời gian trong quá khứ");

      // Set default time to current time + 1 hour
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 1);
      setStartDate(defaultDate);
    } else {
      setStartDate(newDate);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto flex flex-col">
        <DialogHeader>
          <DialogTitle>Tạo công việc cho {device?.deviceName}</DialogTitle>
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
                1. Loại công việc
              </span>
              {creationMode === "Manual" && (
                <span
                  className={
                    currentStep === "manual-creation"
                      ? "font-medium text-blue-600"
                      : "text-gray-500"
                  }
                >
                  2. Thợ máy
                </span>
              )}
              <span
                className={
                  currentStep === "overview"
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }
              >
                {creationMode === "Auto" ? "2" : "3"}. Xem trước
              </span>
            </div>
            <Progress value={getStepProgress()} className="h-2" />
          </div>
        </DialogHeader>

        <div className="my-6 flex-grow overflow-y-auto">
          {renderStepContent()}
        </div>

        <DialogFooter className="sticky bottom-0 bg-white pt-2 border-t mt-4">
          <div className="flex justify-between w-full">
            <div>
              {currentStep !== "task-type" && (
                <ButtonCpn
                  type="button"
                  title="Quay lại"
                  icon={<ChevronLeft />}
                  onClick={goToPreviousStep}
                />
              )}
            </div>

            <div className="flex gap-2">
              <ButtonCpn
                type="button"
                title="Hủy bỏ"
                onClick={() => setOpen(false)}
              />

              {currentStep === "overview" ? (
                <ButtonCpn
                  type="button"
                  title={`Tạo công việc ${getTaskTypeVietnamese(taskType)}`}
                  icon={<Check />}
                  onClick={canProceed ? handleSubmit : undefined}
                  loading={creating}
                />
              ) : (
                <ButtonCpn
                  type="button"
                  title="Bước tiếp theo"
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
