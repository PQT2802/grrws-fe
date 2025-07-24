"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import UpdateWarrantyClaimButton from "@/components/warranty/UpdateWarrantyClaimButton";
import CreateWarrantyReturnButton from "@/components/warranty/CreateWarrantyReturnButton";
import {
  formatAPIDateToHoChiMinh,
  formatAPIDateUTC,
  formatTimeStampDate,
  getFirstLetterUppercase,
} from "@/lib/utils";
import {
  TASK_GROUP_WEB,
  TASK_IN_GROUP,
  WARRANTY_TASK_DETAIL,
  INSTALL_TASK_DETAIL,
  REPAIR_TASK_DETAIL,
} from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import {
  ArrowLeft,
  Clock,
  Calendar,
  User,
  CheckCircle,
  AlertCircle,
  Package,
  Eye,
  MoreHorizontal,
  Check,
  Loader2,
  Shield,
  Monitor,
  FileText,
  Info,
  ArrowRight,
  Timer,
  RefreshCw,
  Phone,
  MapPin,
  Wrench,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

import {
  translateGroupType,
  translateTaskPriority,
  translateTaskStatus,
  translateTaskType,
} from "@/utils/textTypeTask";
import {
  getClaimStatusColor,
  getGroupTypeColor,
  getPriorityColor,
  getStatusColor,
} from "@/utils/colorUtils";
import TaskDetailSidePanel from "@/components/TaskGroupModal/TaskDetailSidePanel";
import DeviceDetailModal from "@/components/DeviceCpn/DeviceModel";
import useNotificationStore from "@/store/notifications";
import TimelineTab from "@/components/TaskGroupTab/TimelineTab";
import DeviceTab from "@/components/TaskGroupTab/DeviceTab";
import WarrantyTab from "@/components/TaskGroupTab/WarrantyTab";
import OverviewTab from "@/components/TaskGroupTab/OverViewTab";
import useSignalRStore from "@/store/useSignalRStore";
import RepairTab from "@/components/TaskGroupTab/RepairTab";

const GroupTaskDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskGroupId = params?.["taskGroupId"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [taskGroup, setTaskGroup] = useState<TASK_GROUP_WEB | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTasks, setApplyingTasks] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TASK_IN_GROUP | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [dropdownTaskDetails, setDropdownTaskDetails] = useState<
    Record<string, WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | REPAIR_TASK_DETAIL | null>
  >({});
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<
    WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | REPAIR_TASK_DETAIL |  null
  >(null);
  const warrantySubmissionTask =
    taskGroup?.tasks.find((task) => task.taskType === "WarrantySubmission") ||
    null;

  // Add this
  const repairTask =
    taskGroup?.tasks.find((task) => task.taskType === "Repair") || null;

  // Get warranty task detail for footer button
  const warrantyTaskDetailForFooter = warrantySubmissionTask
    ? (dropdownTaskDetails[
        warrantySubmissionTask.taskId
      ] as WARRANTY_TASK_DETAIL | null)
    : null;

  // Add this
  const repairTaskDetail = repairTask
    ? (dropdownTaskDetails[repairTask.taskId] as REPAIR_TASK_DETAIL | null)
    : null;

  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  // New state for pre-fetched installation task details
  const [installationTaskDetails, setInstallationTaskDetails] = useState<
    Record<string, INSTALL_TASK_DETAIL>
  >({});

  // Device tab specific state
  const [deviceTabOldDevice, setDeviceTabOldDevice] =
    useState<DEVICE_WEB | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState<boolean>(false);
  const [selectedDeviceForModal, setSelectedDeviceForModal] =
    useState<DEVICE_WEB | null>(null);
  const [deviceModalTitle, setDeviceModalTitle] = useState<string>("");
  const [deviceTabNewDevice, setDeviceTabNewDevice] =
    useState<DEVICE_WEB | null>(null);
  const [deviceTabLoading, setDeviceTabLoading] = useState<boolean>(false);
  const [selectedInstallationTaskId, setSelectedInstallationTaskId] = useState<
    string | null
  >(null);

  const [, setShowReturnDialog] = useState(false);

  // Fetch task group details and pre-fetch installation task details
  useEffect(() => {
    const fetchTaskGroupDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.task.getAllTaskGroups(1, 100);
        const group = response.data.find((g) => g.taskGroupId === taskGroupId);

        if (group) {
          setTaskGroup(group);

          // Pre-fetch installation task details
          await fetchInstallationTaskDetails(group.tasks);
        } else {
          setError("Không tìm thấy nhóm nhiệm vụ");
        }
      } catch (err) {
        console.error("Failed to fetch task group:", err);
        setError("Không thể tải thông tin nhóm nhiệm vụ");
      } finally {
        setLoading(false);
      }
    };

    if (taskGroupId) {
      fetchTaskGroupDetail();
    }
  }, [taskGroupId]);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token && taskGroupId) {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const handleFullDataRefresh = async () => {
        console.log("🔄 Performing full data refresh...");
        try {
          const response = await apiClient.task.getAllTaskGroups(1, 100);
          const group = response.data.find(
            (g) => g.taskGroupId === taskGroupId
          );

          if (group) {
            setTaskGroup(group);
            await fetchInstallationTaskDetails(group.tasks);

            const warrantyTask = group.tasks.find(
              (task) => task.taskType === "WarrantySubmission"
            );
            if (warrantyTask) {
              setDropdownTaskDetails((prev) => ({
                ...prev,
                [warrantyTask.taskId]: null,
              }));
              await fetchWarrantyTaskDetailForFooter();
            }
            // Add this
            const repairTaskInGroup = group.tasks.find(
              (task) => task.taskType === "Repair"
            );
            if (repairTaskInGroup) {
              setDropdownTaskDetails((prev) => ({
                ...prev,
                [repairTaskInGroup.taskId]: null,
              }));
            }

            if (selectedTask) {
              const updatedTask = group.tasks.find(
                (t) => t.taskId === selectedTask.taskId
              );
              if (updatedTask) {
                setSelectedTask(updatedTask);
                const taskDetail = await fetchTaskDetail(updatedTask);
                setSelectedTaskDetail(taskDetail);
              }
            }

            console.log("✅ Full data refresh completed");
          }
        } catch (error) {
          console.error("❌ Full data refresh failed:", error);
        }
      };

      const { connect, disconnect } = useSignalRStore.getState();

      // 🔑 Join đúng group bên BE
      const roleName = "HOT"; // hoặc lấy từ auth user của bạn
      connect(
        token,
        backendUrl,
        [`role:${roleName}`],
        async (eventName, data) => {
          console.log(`📩 SignalR event: ${eventName}`, data);
          switch (eventName) {
            case "NotificationReceived":
              await handleFullDataRefresh();
              break;
            default:
              console.log(`ℹ️ Unhandled SignalR event: ${eventName}`);
          }
        }
      );

      // Force initial data fetch when connected
      setTimeout(handleFullDataRefresh, 1000);

      return () => disconnect();
    }
  }, [taskGroupId]); // Added selectedTask to dependencies

  // Pre-fetch installation task details
  const fetchInstallationTaskDetails = async (tasks: TASK_IN_GROUP[]) => {
    const installationTasks = tasks.filter(
      (task) => task.taskType.toLowerCase() === "installation"
    );

    if (installationTasks.length === 0) return;

    const installTaskDetailsMap: Record<string, INSTALL_TASK_DETAIL> = {};

    // Fetch details for all installation tasks
    await Promise.allSettled(
      installationTasks.map(async (task) => {
        try {
          const taskDetail = await apiClient.task.getInstallTaskDetail(
            task.taskId
          );
          if (taskDetail) {
            installTaskDetailsMap[task.taskId] = taskDetail;
          }
        } catch (error) {
          console.warn(
            `Could not fetch installation task detail for ${task.taskId}:`,
            error
          );
        }
      })
    );

    setInstallationTaskDetails(installTaskDetailsMap);

    // Auto-select first installation task for device tab
    if (installationTasks.length > 0) {
      setSelectedInstallationTaskId(installationTasks[0].taskId);
    }
  };

  const fetchWarrantyTaskDetailForFooter = async () => {
    if (!warrantySubmissionTask) return null;

    // Check if already cached
    if (dropdownTaskDetails[warrantySubmissionTask.taskId]) {
      return dropdownTaskDetails[
        warrantySubmissionTask.taskId
      ] as WARRANTY_TASK_DETAIL;
    }

    // Fetch if not cached
    try {
      const taskDetail = await apiClient.task.getWarrantyTaskDetail(
        warrantySubmissionTask.taskId
      );
      if (taskDetail) {
        setDropdownTaskDetails((prev) => ({
          ...prev,
          [warrantySubmissionTask.taskId]: taskDetail,
        }));
        return taskDetail as WARRANTY_TASK_DETAIL;
      }
    } catch (error) {
      console.error("Failed to fetch warranty task detail for footer:", error);
      toast.error("Không thể tải chi tiết nhiệm vụ bảo hành");
    }
    return null;
  };

  useEffect(() => {
    const fetchWarrantyTaskDetailOnLoad = async () => {
      if (
        warrantySubmissionTask &&
        !dropdownTaskDetails[warrantySubmissionTask.taskId]
      ) {
        await fetchWarrantyTaskDetailForFooter();
      }
    };

    const fetchRepairTaskDetailOnLoad = async () => {
      if (repairTask && !dropdownTaskDetails[repairTask.taskId]) {
        try {
          const taskDetail = await apiClient.task.getRepairTaskDetail(
            repairTask.taskId
          );
          if (taskDetail) {
            setDropdownTaskDetails((prev) => ({
              ...prev,
              [repairTask.taskId]: taskDetail,
            }));
          }
        } catch (error) {
          console.error("Failed to fetch repair task detail:", error);
        }
      }
    };

    fetchWarrantyTaskDetailOnLoad();
    fetchRepairTaskDetailOnLoad();
  }, [warrantySubmissionTask, dropdownTaskDetails, dropdownTaskDetails]);

  // Fetch device details for the device tab when installation task is selected
  useEffect(() => {
    const fetchDeviceDetailsForTab = async () => {
      if (
        !selectedInstallationTaskId ||
        !installationTaskDetails[selectedInstallationTaskId]
      ) {
        setDeviceTabOldDevice(null);
        setDeviceTabNewDevice(null);
        return;
      }

      setDeviceTabLoading(true);
      const installDetail = installationTaskDetails[selectedInstallationTaskId];

      try {
        // Fetch old device
        if (installDetail.deviceId) {
          try {
            const oldDeviceData = await apiClient.device.getDeviceById(
              installDetail.deviceId
            );
            setDeviceTabOldDevice(oldDeviceData);
          } catch (error) {
            console.warn("Could not fetch old device details:", error);
            setDeviceTabOldDevice(null);
          }
        }

        // Fetch new device
        if (installDetail.newDeviceId) {
          try {
            const newDeviceData = await apiClient.device.getDeviceById(
              installDetail.newDeviceId
            );
            setDeviceTabNewDevice(newDeviceData);
          } catch (error) {
            console.warn("Could not fetch new device details:", error);
            setDeviceTabNewDevice(null);
          }
        }
      } catch (error) {
        console.error("Error fetching device details for tab:", error);
        toast.error("Không thể tải thông tin thiết bị");
      } finally {
        setDeviceTabLoading(false);
      }
    };

    fetchDeviceDetailsForTab();
  }, [selectedInstallationTaskId, installationTaskDetails]);

  const refreshTaskData = async () => {
    setRefreshing(true);
    console.log("🔄 Bắt đầu làm mới dữ liệu nhóm nhiệm vụ...");

    try {
      const response = await apiClient.task.getAllTaskGroups(1, 100);
      const group = response.data.find((g) => g.taskGroupId === taskGroupId);

      if (group) {
        setTaskGroup(group);

        // Clear cached data to ensure fresh fetch
        setDropdownTaskDetails({});

        // Refresh installation task details
        await fetchInstallationTaskDetails(group.tasks);

        // Refresh warranty task detail for footer if exists
        const warrantyTask = group.tasks.find(
          (task) => task.taskType === "WarrantySubmission"
        );
        if (warrantyTask) {
          await fetchWarrantyTaskDetailForFooter();
        }

        // Refresh selected task detail if one is selected
        if (selectedTask) {
          const updatedTask = group.tasks.find(
            (t) => t.taskId === selectedTask.taskId
          );
          if (updatedTask) {
            setSelectedTask(updatedTask);
            const taskDetail = await fetchTaskDetail(updatedTask);
            setSelectedTaskDetail(taskDetail);
          }
        }
      }

      console.log("✅ Dữ liệu nhóm nhiệm vụ đã được làm mới thành công");
      toast.success("Đã làm mới dữ liệu thành công", {
        description: "Thông tin nhóm nhiệm vụ đã được cập nhật",
      });
    } catch (error) {
      console.error("❌ Lỗi khi làm mới dữ liệu nhóm nhiệm vụ:", error);
      toast.error("Lỗi khi làm mới dữ liệu", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDeviceClick = (device: DEVICE_WEB, title: string) => {
    setSelectedDeviceForModal(device);
    setDeviceModalTitle(title);
    setDeviceModalOpen(true);
  };

  const handleCloseDeviceModal = () => {
    setDeviceModalOpen(false);
    setSelectedDeviceForModal(null);
    setDeviceModalTitle("");
  };

  // Dynamic task detail fetching based on taskType (removed device fetching logic)
  const fetchTaskDetail = async (task: TASK_IN_GROUP) => {
    try {
      let taskDetail = null;

      switch (task.taskType.toLowerCase()) {
        case "warrantysubmission":
          taskDetail = await apiClient.task.getWarrantyTaskDetail(task.taskId);
          break;
        case "warrantyreturn":
          taskDetail = await apiClient.task.getWarrantyReturnTaskDetail(
            task.taskId
          );
          break;
        case "repair": // Add this case
          taskDetail = await apiClient.task.getRepairTaskDetail(task.taskId);
          break;
        case "installation":
          // Use pre-fetched installation task detail
          taskDetail = installationTaskDetails[task.taskId] || null;
          if (!taskDetail) {
            // Fallback: fetch if not pre-fetched
            taskDetail = await apiClient.task.getInstallTaskDetail(task.taskId);
          }
          break;
        default:
          console.warn(`No specific API for task type: ${task.taskType}`);
          break;
      }

      return taskDetail;
    } catch (error) {
      console.error("Failed to fetch task detail:", error);
      toast.error("Không thể tải chi tiết nhiệm vụ");
      return null;
    }
  };

  const handleTaskClick = async (task: TASK_IN_GROUP) => {
    setSelectedTask(task);
    setShowSidePanel(true);

    // Fetch detailed task information (no device fetching here)
    const taskDetail = await fetchTaskDetail(task);
    setSelectedTaskDetail(taskDetail);
  };

  const handleCloseSidePanel = () => {
    setShowSidePanel(false);
    setSelectedTask(null);
    setSelectedTaskDetail(null);
  };

  const getGroupTypeIcon = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "repair":
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case "warranty":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  // Check if there are any suggested tasks
  const suggestedTasks =
    taskGroup?.tasks.filter(
      (task) => task.status.toLowerCase() === "suggested"
    ) || [];
  const hasSuggestedTasks = suggestedTasks.length > 0;

  const handleApplySuggestedTasks = async () => {
    try {
      setApplyingTasks(true);
      await apiClient.task.applySuggestedGroupTasks(taskGroupId);
      toast.success(
        `Đã áp dụng thành công ${suggestedTasks.length} nhiệm vụ đề xuất!`
      );
      await refreshTaskData();
    } catch (error) {
      console.error("Failed to apply suggested tasks:", error);
      toast.error("Không thể áp dụng nhiệm vụ đề xuất. Vui lòng thử lại.");
    } finally {
      setApplyingTasks(false);
    }
  };

  // Get installation tasks for device tab
  const installationTasks =
    taskGroup?.tasks.filter(
      (task) => task.taskType.toLowerCase() === "installation"
    ) || [];

  if (loading) {
    return <SkeletonCard />;
  }

  if (error || !taskGroup) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Lỗi khi tải nhóm nhiệm vụ
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "Không tìm thấy nhóm nhiệm vụ"}
          </p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          {/* Refresh Button */}
          <Button
            onClick={refreshTaskData}
            variant="outline"
            size="sm"
            disabled={refreshing}
            className="w-fit"
            title="Làm mới dữ liệu nhóm nhiệm vụ"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Đang làm mới..." : "Làm mới"}
          </Button>
        </div>
      </div>
    );
  }

  const totalTasks = taskGroup.tasks.length;
  const completedTasks = taskGroup.tasks.filter(
    (t) => t.status.toLowerCase() === "completed"
  ).length;
  const inProgressTasks = taskGroup.tasks.filter(
    (t) => t.status.toLowerCase() === "inprogress"
  ).length;
  const pendingTasks = taskGroup.tasks.filter(
    (t) => t.status.toLowerCase() === "pending"
  ).length;

  return (
    <div className="container mx-auto p-6 space-y-6 pb-24">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        {/* Apply Suggested Tasks Button */}
        {hasSuggestedTasks && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                disabled={applyingTasks}
              >
                {applyingTasks ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Áp dụng tất cả nhiệm vụ đề xuất ({suggestedTasks.length})
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Áp dụng nhiệm vụ đề xuất</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn áp dụng tất cả {suggestedTasks.length}{" "}
                  nhiệm vụ đề xuất không? Điều này sẽ thay đổi trạng thái từ
                  &quot;Đề xuất&quot; thành &quot;Đang chờ&quot; và chúng sẽ
                  được giao cho các kỹ thuật viên.
                  <br />
                  <br />
                  <strong>Nhiệm vụ đề xuất:</strong>
                  <ul className="mt-2 space-y-1">
                    {suggestedTasks.map((task) => (
                      <li key={task.taskId} className="text-sm">
                        • {task.taskName} - {translateTaskType(task.taskType)}
                      </li>
                    ))}
                  </ul>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleApplySuggestedTasks}
                  disabled={applyingTasks}
                >
                  {applyingTasks ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Đang áp dụng...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Áp dụng
                    </>
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Page Title with Refresh Icon */}
      <div className="flex items-center justify-between">
        <PageTitle
          title={taskGroup.groupName}
          description={`Chi tiết nhóm nhiệm vụ và danh sách các nhiệm vụ con`}
        />
        <Button
          onClick={refreshTaskData}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="w-fit"
          title="Làm mới dữ liệu nhóm nhiệm vụ"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Đang làm mới..." : "Làm mới"}
        </Button>
      </div>

      {/* Summary Section - Updated Layout with Warranty Dates */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getGroupTypeIcon(taskGroup.groupType)}
              Tóm tắt Nhóm Nhiệm vụ
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-500" />
              Ngày tạo: {formatAPIDateUTC(taskGroup.createdDate, "datetime")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          {/* Task Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="flex items-center gap-2">
              <Badge
                className={`${getGroupTypeColor(taskGroup.groupType)} text-xs`}
              >
                {translateGroupType(taskGroup.groupType)}
              </Badge>
              <span className="text-sm text-gray-600">Loại</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">{totalTasks}</span>
              <span className="text-sm text-gray-600">Tổng nhiệm vụ</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-green-600">
                {completedTasks}
              </span>
              <span className="text-sm text-gray-600">Hoàn thành</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-blue-600">
                {inProgressTasks}
              </span>
              <span className="text-sm text-gray-600">Đang thực hiện</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-yellow-600">
                {pendingTasks}
              </span>
              <span className="text-sm text-gray-600">Đang chờ</span>
            </div>
          </div>

          {/* Warranty Dates Section - Only show if warranty task exists */}
          {warrantySubmissionTask && warrantyTaskDetailForFooter && (
            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Ngày bắt đầu:</span>
                  <span className="text-sm font-medium">
                    {warrantyTaskDetailForFooter.startDate
                      ? formatAPIDateUTC(
                          warrantyTaskDetailForFooter.startDate,
                          "datetime"
                        )
                      : "Chưa có thông tin"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Ngày dự kiến trả:
                  </span>
                  <span className="text-sm font-medium">
                    {warrantyTaskDetailForFooter.expectedReturnDate
                      ? formatAPIDateUTC(
                          warrantyTaskDetailForFooter.expectedReturnDate,
                          "datetime"
                        )
                      : "Chưa có thông tin"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Ngày trả thực tế:
                  </span>
                  <span className="text-sm font-medium">
                    {warrantyTaskDetailForFooter.actualReturnDate
                      ? formatAPIDateUTC(
                          warrantyTaskDetailForFooter.actualReturnDate,
                          "datetime"
                        )
                      : "Chưa có thông tin"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Tasks Alert */}
      {hasSuggestedTasks && (
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-purple-800 dark:text-purple-200">
                  Nhiệm vụ đề xuất có sẵn
                </h4>
                <p className="text-sm text-purple-600 dark:text-purple-300">
                  {suggestedTasks.length} nhiệm vụ được đề xuất và sẵn sàng áp
                  dụng.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs Navigation */}
      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[800px]">
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4 mr-2" />
            Tổng quan
          </TabsTrigger>
          {repairTask ? (
            <TabsTrigger value="repair">
              <Wrench className="h-4 w-4 mr-2" />
              Sửa chữa
            </TabsTrigger>
          ) : (
            <TabsTrigger value="warranty">
              <Shield className="h-4 w-4 mr-2" />
              Bảo hành
            </TabsTrigger>
          )}
          <TabsTrigger value="device">
            <Monitor className="h-4 w-4 mr-2" />
            Thiết bị
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Tiến trình
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab taskGroup={taskGroup} onTaskClick={handleTaskClick} />
        </TabsContent>

        {repairTask ? (
          <TabsContent value="repair" className="mt-6">
            <RepairTab
              repairTask={repairTask}
              repairTaskDetail={repairTaskDetail}
            />
          </TabsContent>
        ) : (
          <TabsContent value="warranty" className="mt-6">
            <WarrantyTab
              warrantySubmissionTask={warrantySubmissionTask}
              warrantyTaskDetailForFooter={warrantyTaskDetailForFooter}
            />
          </TabsContent>
        )}

        <TabsContent value="device" className="mt-6">
          <DeviceTab
            installationTasks={installationTasks}
            selectedInstallationTaskId={selectedInstallationTaskId}
            deviceTabLoading={deviceTabLoading}
            deviceTabOldDevice={deviceTabOldDevice}
            deviceTabNewDevice={deviceTabNewDevice}
            onInstallationTaskSelect={setSelectedInstallationTaskId}
            onDeviceClick={handleDeviceClick}
          />
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <TimelineTab
            taskGroup={taskGroup}
            totalTasks={totalTasks}
            completedTasks={completedTasks}
            inProgressTasks={inProgressTasks}
            pendingTasks={pendingTasks}
            suggestedTasks={suggestedTasks}
          />
        </TabsContent>
      </Tabs>

      {/* Task Detail Side Panel */}
      <TaskDetailSidePanel
        isOpen={showSidePanel}
        onClose={handleCloseSidePanel}
        task={selectedTask}
        taskDetail={selectedTaskDetail}
        oldDevice={null} // Remove device props since they're managed in Device tab
        newDevice={null}
      />

      {/* Fixed Footer with Action Buttons */}
      <div className="fixed bottom-0 w-[89%] right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-9">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Info className="h-4 w-4 mr-2" />
            Cập nhật lần cuối:{" "}
            {formatAPIDateToHoChiMinh(new Date().toISOString(), "datetime")}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Quay lại Nhiệm vụ
            </Button>

            {/* Update Warranty Claim Button - Only show if WarrantySubmission task exists */}
            {warrantySubmissionTask &&
              (warrantyTaskDetailForFooter ? (
                <UpdateWarrantyClaimButton
                  taskDetail={warrantyTaskDetailForFooter}
                  onSuccess={async () => {
                    await refreshTaskData();
                    // Re-fetch warranty task detail after update
                    await fetchWarrantyTaskDetailForFooter();
                  }}
                />
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải Bảo hành...
                </Button>
              ))}
            {warrantySubmissionTask &&
              (warrantyTaskDetailForFooter ? (
                <CreateWarrantyReturnButton
                  taskDetail={warrantyTaskDetailForFooter}
                  onSuccess={async () => {
                    await refreshTaskData();
                    // Re-fetch warranty task detail after update
                    await fetchWarrantyTaskDetailForFooter();
                  }}
                />
              ) : (
                <Button
                  disabled
                  variant="secondary"
                  className="bg-gray-100 text-gray-400 cursor-not-allowed"
                >
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang tải Trả Bảo hành...
                </Button>
              ))}
            <Button variant="default">
              <Eye className="h-4 w-4 mr-2" />
              Xem Yêu cầu
            </Button>
          </div>
        </div>
      </div>

      {/* Device Detail Modal */}
      <DeviceDetailModal
        isOpen={deviceModalOpen}
        onClose={handleCloseDeviceModal}
        device={selectedDeviceForModal}
        title={deviceModalTitle}
      />
    </div>
  );
};

export default GroupTaskDetailsPage;
