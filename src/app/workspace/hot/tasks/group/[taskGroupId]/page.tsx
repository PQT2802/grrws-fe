"use client";

import { useEffect, useState, useCallback, use } from "react";
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
import CreateInstallUninstallTaskCpn from "@/components/CreateInstallUninstallTaskCpn/CreateInstallUninstallTaskCpn";
import CreateReinstallTaskButton from "@/components/warranty/CreateReinstallTaskButton";
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
import useNotificationStore from "@/store/notifications";
import TimelineTab from "@/components/TaskGroupTab/TimelineTab";
import DeviceTab from "@/components/TaskGroupTab/DeviceTab";
import WarrantyTab from "@/components/TaskGroupTab/WarrantyTab";
import OverviewTab from "@/components/TaskGroupTab/OverViewTab";
import useSignalRStore from "@/store/useSignalRStore";
import RepairTab from "@/components/TaskGroupTab/RepairTab";
import SingleDeviceCard from "@/components/TaskGroupTab/SingleDeviceCard";
import Link from "next/link";
import DeviceDetailModal from "@/components/DeviceCpn/DeviceDetailModal";
import CreateRepairAfterWarrantyModal from "@/components/warranty/CreateRepairAfterWarrantyModal";
const GroupTaskDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskGroupId = params?.["taskGroupId"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [taskGroup, setTaskGroup] = useState<TASK_GROUP_WEB | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingTasks, setApplyingTasks] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<TASK_IN_GROUP | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [repairTask, setRepairTask] = useState<TASK_IN_GROUP | null>(null);
  const [warrantyReturnTask, setWarrantyReturnTask] =
    useState<TASK_IN_GROUP | null>(null);
  const [warrantySubmissionTask, setWarrantySubmissionTask] =
    useState<TASK_IN_GROUP | null>(null);
  const [dropdownTaskDetails, setDropdownTaskDetails] = useState<
    Record<
      string,
      WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | REPAIR_TASK_DETAIL | null
    >
  >({});
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<
    WARRANTY_TASK_DETAIL | INSTALL_TASK_DETAIL | REPAIR_TASK_DETAIL | null
  >(null);
  const [showCreateInstallModal, setShowCreateInstallModal] = useState(false);

  const [installationTasks, setInstallationTasks] = useState<TASK_IN_GROUP[]>(
    []
  );

  const [reInstallTask, setReinstallTask] = useState<TASK_IN_GROUP | null>();
  const [stockinTask, setStockinTask] = useState<TASK_IN_GROUP | null>(null);
  const [showCreateRepairModal, setShowCreateRepairModal] = useState(false);
  useEffect(() => {
    if (taskGroup) {
      const repairTask =
        taskGroup?.tasks.find((task) => task.taskType === "Repair") || null;
      const warrantyReturnTask =
        taskGroup?.tasks.find((task) => task.taskType === "WarrantyReturn") ||
        null;
      const warrantySubmissionTask =
        taskGroup?.tasks.find(
          (task) => task.taskType === "WarrantySubmission"
        ) || null;
      const stockinTask =
        taskGroup?.tasks.find((task) => task.taskType === "StockIn") || null;
      setRequestId(taskGroup.requestId || null);
      setRepairTask(repairTask);
      setStockinTask(stockinTask);
      setWarrantyReturnTask(warrantyReturnTask);
      setWarrantySubmissionTask(warrantySubmissionTask);
      const filtered = taskGroup.tasks.filter(
        (task) => task.taskType.toLowerCase() === "installation"
      );
      const reinstallTask = filtered.find(
        (task) => task.taskType === "Installation" && task.orderIndex !== 1
      );
      setReinstallTask(reinstallTask);
      setInstallationTasks(filtered);
    } else {
      setInstallationTasks([]);
    }
  }, [taskGroup]);

  const warrantyTaskDetailForFooter = warrantySubmissionTask
    ? (dropdownTaskDetails[
        warrantySubmissionTask.taskId
      ] as WARRANTY_TASK_DETAIL | null)
    : null;

  const repairTaskDetail = repairTask
    ? (dropdownTaskDetails[repairTask.taskId] as REPAIR_TASK_DETAIL | null)
    : null;

  const [showSidePanel, setShowSidePanel] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");

  const [installationTaskDetails, setInstallationTaskDetails] = useState<
    Record<string, INSTALL_TASK_DETAIL>
  >({});

  // Moved here so it's defined before any use (e.g., in effects and callbacks above)
  const fetchInstallationTaskDetails = useCallback(
    async (tasks: TASK_IN_GROUP[]) => {
      const installationTasks = tasks.filter(
        (task) => task.taskType.toLowerCase() === "installation"
      );

      if (installationTasks.length === 0) return;

      const installTaskDetailsMap: Record<string, INSTALL_TASK_DETAIL> = {};

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

      if (installationTasks.length > 0) {
        setSelectedInstallationTaskId(installationTasks[0].taskId);
      }
    },
    [] // state setters are stable; no dependencies needed
  );

  const [deviceTabOldDevice, setDeviceTabOldDevice] =
    useState<DEVICE_WEB | null>(null);
  const [deviceModalOpen, setDeviceModalOpen] = useState<boolean>(false);
  const [selectedDeviceForModal, setSelectedDeviceForModal] =
    useState<DEVICE_WEB | null>(null);
  const [singleDevice, setSingleDevice] = useState<DEVICE_WEB | null>(null);
  const [singleDeviceLoading, setSingleDeviceLoading] = useState(false);
  const [deviceModalTitle, setDeviceModalTitle] = useState<string>("");
  const [deviceTabNewDevice, setDeviceTabNewDevice] =
    useState<DEVICE_WEB | null>(null);
  const [deviceTabLoading, setDeviceTabLoading] = useState<boolean>(false);
  const [selectedInstallationTaskId, setSelectedInstallationTaskId] = useState<
    string | null
  >(null);

  const [suggestedTasks, setSuggestedTasks] = useState<TASK_IN_GROUP[]>([]);
  const hasSuggestedTasks = suggestedTasks.length > 0;

  // Memoized fetchTaskDetail, removing apiClient from dependencies
  const fetchTaskDetail = useCallback(
    async (task: TASK_IN_GROUP) => {
      try {
        let taskDetail = null;
        switch (task.taskType.toLowerCase()) {
          case "warrantysubmission":
            taskDetail = await apiClient.task.getWarrantyTaskDetail(
              task.taskId
            );
            break;
          case "warrantyreturn":
            taskDetail = await apiClient.task.getWarrantyReturnTaskDetail(
              task.taskId
            );
            break;
          case "repair":
            taskDetail = await apiClient.task.getRepairTaskDetail(task.taskId);
            break;
          case "installation":
            taskDetail = installationTaskDetails[task.taskId] || null;
            if (!taskDetail) {
              taskDetail = await apiClient.task.getInstallTaskDetail(
                task.taskId
              );
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
    },
    [installationTaskDetails] // Removed apiClient
  );

  // Memoized fetchWarrantyTaskDetailForFooter, removing apiClient from dependencies
  const fetchWarrantyTaskDetailForFooter = useCallback(async () => {
    if (!warrantySubmissionTask) return null;

    if (dropdownTaskDetails[warrantySubmissionTask.taskId]) {
      return dropdownTaskDetails[
        warrantySubmissionTask.taskId
      ] as WARRANTY_TASK_DETAIL;
    }

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
  }, [warrantySubmissionTask, dropdownTaskDetails]); // Removed apiClient

  // Memoized handleFullDataRefresh to ensure stability
  const handleFullDataRefresh = useCallback(async () => {
    console.log("🔄 Performing full data refresh...");
    try {
      const response = await apiClient.task.getAllTaskGroups(1, 100);
      const group = response.data.find((g) => g.taskGroupId === taskGroupId);

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
  }, [
    taskGroupId,
    fetchInstallationTaskDetails,
    fetchWarrantyTaskDetailForFooter,
    selectedTask,
    setTaskGroup,
    setDropdownTaskDetails,
    setSelectedTask,
    setSelectedTaskDetail,
    fetchTaskDetail,
  ]);

  useEffect(() => {
    const fetchTaskGroupDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.task.getAllTaskGroups(1, 100);
        const group = response.data.find((g) => g.taskGroupId === taskGroupId);

        if (group) {
          setTaskGroup(group);
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
  }, [taskGroupId, fetchInstallationTaskDetails]);

  // SignalR connection setup
  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    if (!token || !taskGroupId) return;

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    const roleName = "HOT";
    const { connect, disconnect } = useSignalRStore.getState();

    const handleEvent = async (eventName: string, data: any) => {
      console.log(`📩 SignalR event: ${eventName}`, data);
      if (
        (eventName === "TaskGroupUpdated" &&
          data?.taskGroupId === taskGroupId) ||
        eventName === "NotificationReceived"
      ) {
        await handleFullDataRefresh();
      }
    };

    connect(token, backendUrl, [`role:${roleName}`], handleEvent);

    return () => {
      disconnect();
    };
  }, [taskGroupId, handleFullDataRefresh]);

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
  }, [
    warrantySubmissionTask,
    dropdownTaskDetails,
    fetchWarrantyTaskDetailForFooter,
    repairTask,
  ]);

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
        const oldDeviceId = installDetail?.stockInDeviceId
          ? installDetail?.stockInDeviceId
          : installDetail?.deviceId;
        const newDeviceId = installDetail?.stockOutDeviceId;
        console.log("concac", oldDeviceId, newDeviceId);
        if (oldDeviceId) {
          try {
            const oldDeviceData = await apiClient.device.getDeviceById(
              oldDeviceId
            );
            setDeviceTabOldDevice(oldDeviceData);
          } catch (error) {
            console.warn("Could not fetch old device details:", error);
            setDeviceTabOldDevice(null);
          }
        }

        // Fetch new device
        if (newDeviceId) {
          try {
            const newDeviceData = await apiClient.device.getDeviceById(
              newDeviceId
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
        setDropdownTaskDetails({});
        await fetchInstallationTaskDetails(group.tasks);

        const warrantyTask = group.tasks.find(
          (task) => task.taskType === "WarrantySubmission"
        );
        if (warrantyTask) {
          await fetchWarrantyTaskDetailForFooter();
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

        console.log("✅ Dữ liệu nhóm nhiệm vụ đã được làm mới thành công");
        toast.success("Đã làm mới dữ liệu thành công", {
          description: "Thông tin nhóm nhiệm vụ đã được cập nhật",
        });
      }
    } catch (error) {
      console.error("❌ Lỗi khi làm mới dữ liệu nhóm nhiệm vụ:", error);
      toast.error("Lỗi khi làm mới dữ liệu", {
        description: "Vui lòng thử lại sau",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const refreshTaskDetail = async (taskId: string) => {
    if (!taskId) return;
    try {
      const task = taskGroup?.tasks.find((t) => t.taskId === taskId);
      if (!task) return;

      let detail = null;
      switch (task.taskType.toLowerCase()) {
        case "repair":
          detail = await apiClient.task.getRepairTaskDetail(taskId);
          break;
        case "warrantysubmission":
          detail = await apiClient.task.getWarrantyTaskDetail(taskId);
          break;
        case "installation":
          detail = await apiClient.task.getInstallTaskDetail(taskId);
          break;
        default:
          break;
      }

      if (detail) {
        setDropdownTaskDetails((prev) => ({
          ...prev,
          [taskId]: detail,
        }));
        if (selectedTask?.taskId === taskId) {
          setSelectedTaskDetail(detail);
        }
      }
    } catch (error) {
      console.error("Failed to refresh task detail:", error);
      toast.error("Không thể tải lại chi tiết nhiệm vụ");
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

  const handleDetailModalClose = useCallback((open: boolean) => {
    setDeviceModalOpen(open);

    if (!open) {
      // Immediate cleanup
      if (typeof document !== "undefined") {
        document.body.style.pointerEvents = "auto";
        document.body.style.overflow = "auto";
      }

      // Clear selected device after a short delay
      setTimeout(() => {
        setSelectedDeviceForModal(null);
      }, 100);
    }
  }, []);

  const handleTaskClick = async (task: TASK_IN_GROUP) => {
    setSelectedTask(task);
    setShowSidePanel(true);
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

  useEffect(() => {
    if (taskGroup?.tasks) {
      const filtered = taskGroup.tasks.filter(
        (task) => task.status.toLowerCase() === "suggested"
      );
      setSuggestedTasks(filtered);
    } else {
      setSuggestedTasks([]);
    }
  }, [taskGroup]);

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

  useEffect(() => {
    const fetchSingleDevice = async () => {
      if (installationTasks.length === 0) {
        try {
          let deviceObj: DEVICE_WEB | null = null;
          if (stockinTask) {
            deviceObj = await apiClient.device.getDeviceById(
              warrantyTaskDetailForFooter?.deviceId || ""
            );
          } else if (
            repairTaskDetail &&
            repairTaskDetail.machineActionConfirmations?.[0]?.deviceId
          ) {
            deviceObj = await apiClient.device.getDeviceById(
              repairTaskDetail.machineActionConfirmations[0].deviceId
            );
          }
          setSingleDevice(deviceObj);
        } catch (error) {
          setSingleDevice(null);
        }
      } else {
        setSingleDevice(null);
      }
    };
    fetchSingleDevice();
  }, [
    installationTasks,
    repairTaskDetail,
    stockinTask,
    warrantyTaskDetailForFooter,
  ]);

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
          {installationTasks.length > 0 ? (
            <TabsTrigger value="device">
              <Monitor className="h-4 w-4 mr-2" />
              Thiết bị
            </TabsTrigger>
          ) : (
            <TabsTrigger value="single-device">
              <Monitor className="h-4 w-4 mr-2" />
              Thiết bị
            </TabsTrigger>
          )}
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Tiến trình
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <OverviewTab 
            taskGroup={taskGroup} 
            onTaskClick={handleTaskClick}
            onTaskStatusUpdate={refreshTaskData} 
          />
        </TabsContent>

        {repairTask ? (
          <TabsContent value="repair" className="mt-6">
            <RepairTab
              repairTask={repairTask}
              repairTaskDetail={repairTaskDetail}
              onErrorsAdded={() => {
                if (repairTask) {
                  refreshTaskDetail(repairTask.taskId);
                }
              }}
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

        {installationTasks.length > 0 ? (
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
        ) : (
          <TabsContent value="single-device" className="mt-6">
            <SingleDeviceCard
              singleDevice={singleDevice}
              singleDeviceLoading={singleDeviceLoading}
              onDeviceClick={handleDeviceClick}
            />
          </TabsContent>
        )}

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

      <TaskDetailSidePanel
        isOpen={showSidePanel}
        onClose={handleCloseSidePanel}
        task={selectedTask}
        taskDetail={selectedTaskDetail}
        oldDevice={null}
        newDevice={null}
        onRefreshTaskDetail={refreshTaskDetail}
      />

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

            {warrantySubmissionTask &&
              warrantyReturnTask?.status !== "Completed" &&
              warrantySubmissionTask.status !== "Rejected" &&
              warrantySubmissionTask.status === "Completed" &&
              (warrantyTaskDetailForFooter ? (
                <UpdateWarrantyClaimButton
                  taskDetail={warrantyTaskDetailForFooter}
                  onSuccess={async () => {
                    await refreshTaskData();
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
              warrantySubmissionTask.status === "Rejected" && (
                <Button
                  variant="destructive"
                  onClick={() => setShowCreateRepairModal(true)}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  <Wrench className="h-4 w-4 mr-2" />
                  Tạo nhiệm vụ sửa chữa
                </Button>
              )}

            {warrantySubmissionTask &&
              warrantySubmissionTask.status !== "Rejected" &&
              reInstallTask &&
              reInstallTask.status !== "Completed" &&
              (warrantyTaskDetailForFooter ? (
                warrantySubmissionTask.status === "Completed" &&
                (!warrantyReturnTask ||
                  warrantyReturnTask.status === "Delayed") && (
                  <CreateWarrantyReturnButton
                    taskDetail={warrantyTaskDetailForFooter}
                    taskReturnWarranty={warrantyReturnTask}
                    onSuccess={async () => {
                      await refreshTaskData();
                      await fetchWarrantyTaskDetailForFooter();
                    }}
                  />
                )
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

            {(warrantyTaskDetailForFooter || repairTask) &&
              ((!reInstallTask && warrantyReturnTask?.status === "Completed") ||
                (reInstallTask && reInstallTask.status !== "Completed") ||
                (repairTask &&
                  repairTask.status === "Completed" &&
                  !reInstallTask)) && (
                <CreateReinstallTaskButton
                  requestId={taskGroup.requestId}
                  taskGroupId={taskGroupId}
                  deviceId={
                    warrantyTaskDetailForFooter?.deviceId ||
                    repairTaskDetail?.machineActionConfirmations[0].deviceId ||
                    ""
                  }
                  deviceName="Thiết bị Bảo hành"
                  onSuccess={refreshTaskData}
                />
              )}
            {requestId && (
              <Link href={`/workspace/hot/reports/${requestId}`}>
                <Button variant="secondary" size="sm" className="ml-2">
                  <Eye className="h-4 w-4 mr-2" />
                  Xem chi tiết yêu cầu
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
      <DeviceDetailModal
        open={deviceModalOpen}
        onOpenChange={handleDetailModalClose}
        device={selectedDeviceForModal}
      />
      <CreateRepairAfterWarrantyModal
        open={showCreateRepairModal}
        onOpenChange={setShowCreateRepairModal}
        requestId={requestId || ""}
        deviceName={deviceTabOldDevice?.deviceName || ""}
        onSuccess={() => {
          refreshTaskData();
        }}
      />
    </div>
  );
};

export default GroupTaskDetailsPage;
