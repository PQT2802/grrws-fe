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
  formatTimeStampDate,
  getFirstLetterUppercase,
} from "@/lib/utils";
import {
  TASK_GROUP_WEB,
  TASK_IN_GROUP,
  WARRANTY_TASK_DETAIL,
  INSTALL_TASK_DETAIL,
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
    Record<string, WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | null>
  >({});
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<
    WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | null
  >(null);
  const warrantySubmissionTask =
    taskGroup?.tasks.find((task) => task.taskType === "WarrantySubmission") ||
    null;

  // Get warranty task detail for footer button
  const warrantyTaskDetailForFooter = warrantySubmissionTask
    ? (dropdownTaskDetails[
        warrantySubmissionTask.taskId
      ] as WARRANTY_TASK_DETAIL | null)
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

      // Simple refresh function
      const handleNotificationRefresh = async () => {
        console.log("New notification received, refreshing task groups...");
        const response = await apiClient.task.getAllTaskGroups(1, 100);
        const group = response.data.find((g) => g.taskGroupId === taskGroupId);
        if (group) {
          setTaskGroup(group);
          await fetchInstallationTaskDetails(group.tasks);
        }
      };

      // Connect to SignalR
      const { connectToSignalR, disconnectSignalR } =
        useNotificationStore.getState();
      connectToSignalR(token, backendUrl, handleNotificationRefresh);

      return () => disconnectSignalR();
    }
  }, [taskGroupId]);

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

    fetchWarrantyTaskDetailOnLoad();
  }, [warrantySubmissionTask, dropdownTaskDetails]);

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
      }

      // Refresh selected task detail if one is selected
      if (selectedTask) {
        const taskDetail = await fetchTaskDetail(selectedTask);
        setSelectedTaskDetail(taskDetail);
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

  const handleDropdownAction = async (
    task: TASK_IN_GROUP,
    actionType: "warranty" | "return"
  ) => {
    // Check if we already have the task detail cached
    let taskDetail = dropdownTaskDetails[task.taskId];

    if (!taskDetail) {
      // Fetch task detail if not cached
      taskDetail = await fetchTaskDetail(task);
      if (taskDetail) {
        setDropdownTaskDetails((prev) => ({
          ...prev,
          [task.taskId]: taskDetail,
        }));
      }
    }

    if (!taskDetail) {
      toast.error("Không thể tải chi tiết nhiệm vụ");
      return;
    }

    return taskDetail;
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

  // Helper functions
  const getTaskTypeIcon = (taskType: string) => {
    switch (taskType.toLowerCase()) {
      case "uninstallation":
        return <Package className="h-4 w-4 text-red-500" />;
      case "installation":
        return <Package className="h-4 w-4 text-green-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warrantysubmission":
      case "warrantyreturn":
      case "warranty":
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
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

      {/* Summary Section - Updated Layout */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {getGroupTypeIcon(taskGroup.groupType)}
              Tóm tắt Nhóm Nhiệm vụ
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="h-4 w-4 text-gray-500" />
              Ngày tạo: {formatTimeStampDate(taskGroup.createdDate, "datetime")}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
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
          <TabsTrigger value="warranty">
            <Shield className="h-4 w-4 mr-2" />
            Bảo hành
          </TabsTrigger>
          <TabsTrigger value="device">
            <Monitor className="h-4 w-4 mr-2" />
            Thiết bị
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Tiến trình
          </TabsTrigger>
        </TabsList>
        {/* Overview Tab - Task List */}
        <TabsContent value="overview" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nhiệm vụ trong Nhóm ({taskGroup.tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thứ tự</TableHead>
                    <TableHead>Tên nhiệm vụ</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Mức độ ưu tiên</TableHead>
                    <TableHead>Người được giao</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taskGroup.tasks
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map((task) => (
                      <TableRow
                        key={task.taskId}
                        className={`hover:bg-slate-100 dark:hover:bg-gray-800 cursor-pointer ${
                          task.status.toLowerCase() === "suggested"
                            ? "bg-purple-50 dark:bg-purple-950/30"
                            : ""
                        }`}
                        onClick={() => handleTaskClick(task)}
                      >
                        <TableCell>
                          <Badge variant="secondary">#{task.orderIndex}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {task.taskName}
                              {task.status.toLowerCase() === "suggested" && (
                                <Badge
                                  variant="outline"
                                  className="text-purple-600 border-purple-300"
                                >
                                  Mới
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 max-w-xs truncate">
                              {task.taskDescription}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTaskTypeIcon(task.taskType)}
                            <span className="text-sm">
                              {translateTaskType(task.taskType)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(task.status)} text-xs`}
                          >
                            {translateTaskStatus(task.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getPriorityColor(
                              task.priority
                            )} text-xs`}
                          >
                            {translateTaskPriority(task.priority)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary text-white text-xs">
                                {getFirstLetterUppercase(
                                  task.assigneeName ?? "NA"
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {task.assigneeName || "Chưa giao"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {task.startTime && (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Bắt đầu:{" "}
                                {formatAPIDateToHoChiMinh(
                                  task.startTime,
                                  "datetime"
                                )}
                              </div>
                            )}
                            {task.expectedTime && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Dự kiến:{" "}
                                {formatAPIDateToHoChiMinh(
                                  task.expectedTime,
                                  "datetime"
                                )}
                              </div>
                            )}
                            {task.endTime && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                Kết thúc:{" "}
                                {formatAPIDateToHoChiMinh(
                                  task.endTime,
                                  "datetime"
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                              <DropdownMenuLabel>Hành động</DropdownMenuLabel>

                              {/* Apply Suggested Task */}
                              {task.status.toLowerCase() === "suggested" && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toast.info(
                                      "Tính năng áp dụng đơn lẻ sắp ra mắt!"
                                    );
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-2" />
                                  Áp dụng nhiệm vụ này
                                </DropdownMenuItem>
                              )}

                              {/* View Details - Keep as fallback for non-warranty tasks */}
                              {![
                                "WarrantySubmission",
                                "WarrantyReturn",
                              ].includes(task.taskType) && (
                                <DropdownMenuItem
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Warranty Tab - Improved UI/UX */}
        <TabsContent value="warranty" className="mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Thông tin Bảo hành
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!warrantySubmissionTask ? (
                <div className="flex items-center justify-center py-6 text-center">
                  <div className="flex flex-col items-center max-w-md">
                    <Shield className="h-8 w-8 text-gray-400 mb-2" />
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                      Không có thông tin bảo hành
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Nhóm nhiệm vụ này không chứa nhiệm vụ bảo hành nào.
                    </p>
                  </div>
                </div>
              ) : !warrantyTaskDetailForFooter ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    Đang tải thông tin bảo hành...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Top Section - Basic Info + Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Basic Warranty Information - Takes 1/3 width */}
                    <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800 p-3 h-full flex flex-col justify-center">
                      <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        {warrantyTaskDetailForFooter.warrantyProvider}
                      </div>
                      <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                        {warrantyTaskDetailForFooter.claimNumber}
                      </div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        Mã bảo hành: {warrantyTaskDetailForFooter.warrantyCode}
                      </div>
                    </div>

                    {/* Status & Contract - Takes 1/3 width */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                      <div className="text-sm font-medium mb-1">
                        Trạng thái & Liên hệ
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            Trạng thái:
                          </span>
                          <Badge variant="outline" className="text-xs">
                           {translateTaskStatus(warrantyTaskDetailForFooter.claimStatus)}
                          </Badge>
                        </div>

                        {warrantyTaskDetailForFooter.hotNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">Số liên hệ do công ty cung cấp:</span>
                            <a
                              href={`tel:${warrantyTaskDetailForFooter.hotNumber}`}
                              className="font-semibold text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {warrantyTaskDetailForFooter.hotNumber}
                            </a>
                          </div>
                        )}

                        {warrantyTaskDetailForFooter.claimAmount && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Số tiền claim:
                            </span>
                            <span className="text-xs font-medium">
                              {warrantyTaskDetailForFooter.claimAmount.toLocaleString(
                                "vi-VN"
                              )}{" "}
                              <span className="text-xs text-gray-500">VND</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Contact and Location - Takes 1/3 width */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                      <div className="text-sm font-medium mb-1">
                        Liên lạc & Vị trí bảo hành
                      </div>
                      <div className="space-y-2 text-xs">
                       {warrantyTaskDetailForFooter.contractNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              Số liên lạc:
                            </span>
                            <span className="text-xs font-medium">
                              {warrantyTaskDetailForFooter.contractNumber}
                            </span>
                          </div>
                        )}

                        {warrantyTaskDetailForFooter.location && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Vị trí:</span>
                            <span className="font-medium">
                              {warrantyTaskDetailForFooter.location}
                            </span>
                          </div>
                        )}

                        {warrantyTaskDetailForFooter.actualReturnDate && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500">Ngày trả:</span>
                            <span className="font-medium">
                              {formatAPIDateToHoChiMinh(
                                warrantyTaskDetailForFooter.actualReturnDate,
                                "date"
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tabs for detailed information to save vertical space */}
                  <Tabs defaultValue="issue" className="mt-2">
                    <TabsList className="w-full grid grid-cols-3 mb-3">
                      <TabsTrigger value="issue">Mô tả sự cố</TabsTrigger>
                      <TabsTrigger value="resolution">
                        Giải pháp & Ghi chú
                      </TabsTrigger>
                      <TabsTrigger value="documents">
                        Tài liệu (
                        {warrantyTaskDetailForFooter.documents?.length || 0})
                      </TabsTrigger>
                    </TabsList>

                    {/* Issue Description Tab */}
                    <TabsContent value="issue">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                        {warrantyTaskDetailForFooter.issueDescription ? (
                          <p className="text-sm">
                            {warrantyTaskDetailForFooter.issueDescription}
                          </p>
                        ) : (
                          <p className="text-sm text-gray-500 italic text-center py-4">
                            Không có mô tả sự cố
                          </p>
                        )}
                      </div>
                    </TabsContent>

                    {/* Resolution & Notes Tab */}
                    <TabsContent value="resolution">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                          <h4 className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Giải pháp:
                          </h4>
                          {warrantyTaskDetailForFooter.resolution ? (
                            <p className="text-sm">
                              {warrantyTaskDetailForFooter.resolution}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Chưa có giải pháp
                            </p>
                          )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                          <h4 className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Ghi chú:
                          </h4>
                          {warrantyTaskDetailForFooter.warrantyNotes ? (
                            <p className="text-sm">
                              {warrantyTaskDetailForFooter.warrantyNotes}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Không có ghi chú
                            </p>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents">
                      {warrantyTaskDetailForFooter.documents &&
                      warrantyTaskDetailForFooter.documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {warrantyTaskDetailForFooter.documents.map(
                            (doc, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                  <div className="truncate">
                                    <div className="text-xs font-medium truncate">
                                      {doc.docymentType || "Document"}
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    window.open(doc.documentUrl, "_blank")
                                  }
                                  disabled={!doc.documentUrl}
                                  className="h-7 w-7 p-0"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-gray-500">
                          Không có tài liệu đính kèm
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Device Tab - Updated with pre-fetched data */}
        <TabsContent value="device" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-600" />
                Thông tin Thiết bị
              </CardTitle>
            </CardHeader>
            <CardContent>
              {installationTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Monitor className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Không có nhiệm vụ lắp đặt
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                    Thông tin thiết bị chỉ khả dụng cho các nhiệm vụ lắp đặt.
                    Nhóm nhiệm vụ này không chứa nhiệm vụ lắp đặt nào.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Installation Task Selector */}
                  {installationTasks.length > 1 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                        Chọn nhiệm vụ lắp đặt:
                      </span>
                      {installationTasks.map((task) => (
                        <Button
                          key={task.taskId}
                          variant={
                            selectedInstallationTaskId === task.taskId
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setSelectedInstallationTaskId(task.taskId)
                          }
                          className="flex items-center gap-1"
                        >
                          <Package className="h-3 w-3" />#{task.orderIndex}{" "}
                          {task.taskName}
                        </Button>
                      ))}
                    </div>
                  )}

                  {deviceTabLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2 text-sm text-gray-600">
                        Đang tải thông tin thiết bị...
                      </span>
                    </div>
                  ) : deviceTabOldDevice && deviceTabNewDevice ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 items-center">
                        {/* Old Device */}
                        <Card
                          className="border-red-200 bg-red-50 dark:bg-red-950/30 cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                          onClick={() =>
                            handleDeviceClick(
                              deviceTabOldDevice,
                              "Chi tiết Thiết bị Cũ (Tháo)"
                            )
                          }
                        >
                          <CardHeader className="text-center pb-3">
                            <CardTitle className="text-sm text-red-700 dark:text-red-300">
                              Thiết bị bảo hành (Tháo)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-center">
                              <div className="h-12 w-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Monitor className="h-6 w-6 text-red-600 dark:text-red-400" />
                              </div>
                              <h4 className="font-semibold">
                                {deviceTabOldDevice.deviceName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {deviceTabOldDevice.deviceCode}
                              </p>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span>Model:</span>
                                <span className="font-medium">
                                  {deviceTabOldDevice.model || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vị trí:</span>
                                <span className="font-medium">
                                  {`${deviceTabOldDevice.areaName} ,${deviceTabOldDevice.zoneName}, ${deviceTabOldDevice.positionIndex}` ||
                                    "Trong kho"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-red-200">
                              <p className="text-xs text-red-600 text-center font-medium">
                                Nhấp để xem chi tiết
                              </p>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                            <ArrowRight className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>

                        {/* New Device */}
                        <Card
                          className="border-green-200 bg-green-50 dark:bg-green-950/30 cursor-pointer hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors"
                          onClick={() =>
                            handleDeviceClick(
                              deviceTabNewDevice,
                              "Chi tiết Thiết bị Mới (Lắp)"
                            )
                          }
                        >
                          <CardHeader className="text-center pb-3">
                            <CardTitle className="text-sm text-green-700 dark:text-green-300">
                              Thiết bị thay thế (Lắp)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="text-center">
                              <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Monitor className="h-6 w-6 text-green-600 dark:text-green-400" />
                              </div>
                              <h4 className="font-semibold">
                                {deviceTabNewDevice.deviceName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {deviceTabNewDevice.deviceCode}
                              </p>
                            </div>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between">
                                <span>Model:</span>
                                <span className="font-medium">
                                  {deviceTabNewDevice.model || "N/A"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Vị trí:</span>
                                <span className="font-medium">
                                  {deviceTabNewDevice.zoneName || "Trong kho"}
                                </span>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-green-200">
                              <p className="text-xs text-green-600 text-center font-medium">
                                Nhấp để xem chi tiết
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                        <Monitor className="h-6 w-6 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Thông tin thiết bị không khả dụng
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                        Không thể tải thông tin thiết bị cho nhiệm vụ lắp đặt
                        này.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-600" />
                Tiến trình Nhóm Nhiệm vụ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200 dark:bg-gray-700 ml-2.5"></div>

                <div className="space-y-6 relative z-10 ml-2">
                  {/* Group Created */}
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Nhóm nhiệm vụ được tạo
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatAPIDateToHoChiMinh(
                          taskGroup.createdDate,
                          "datetime"
                        )}
                      </div>
                      <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                        Nhóm nhiệm vụ{" "}
                        <span className="font-medium">
                          {taskGroup.groupName}
                        </span>{" "}
                        loại{" "}
                        <span className="font-medium">
                          {translateGroupType(taskGroup.groupType)}
                        </span>{" "}
                        được tạo với {totalTasks} nhiệm vụ.
                      </div>
                    </div>
                  </div>

                  {/* Tasks Progress */}
                  {completedTasks > 0 && (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Các nhiệm vụ đã hoàn thành
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Tiến độ hiện tại
                        </div>
                        <div className="mt-2 text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-100 dark:border-green-900">
                          {completedTasks} / {totalTasks} nhiệm vụ đã hoàn thành
                          ({Math.round((completedTasks / totalTasks) * 100)}%)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* In Progress Tasks */}
                  {inProgressTasks > 0 && (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Nhiệm vụ đang thực hiện
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Đang tiến hành
                        </div>
                        <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                          {inProgressTasks} nhiệm vụ đang được thực hiện bởi các
                          kỹ thuật viên.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pending Tasks */}
                  {pendingTasks > 0 && (
                    <div className="flex gap-4 items-start opacity-70">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <Timer className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Nhiệm vụ chờ thực hiện
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Chưa bắt đầu
                        </div>
                        <div className="mt-2 text-sm bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border border-yellow-100 dark:border-yellow-900">
                          {pendingTasks} nhiệm vụ đang chờ được giao hoặc bắt
                          đầu thực hiện.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Suggested Tasks */}
                  {suggestedTasks.length > 0 && (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Nhiệm vụ đề xuất
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Chờ xét duyệt
                        </div>
                        <div className="mt-2 text-sm bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md border border-purple-100 dark:border-purple-900">
                          {suggestedTasks.length} nhiệm vụ được hệ thống đề xuất
                          và chờ áp dụng.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
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
