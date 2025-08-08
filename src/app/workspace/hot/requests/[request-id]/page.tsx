"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  RotateCcw,
  Eye,
  Plus,
  Wrench,
  AlertCircle,
  Package,
  CheckCircle,
  Monitor,
  Calendar,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import PageTitle from "@/components/PageTitle/PageTitle";
import ButtonCpn from "@/components/ButtonCpn/ButtonCpn";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  formatAPIDateToHoChiMinh,
  formatTimeStampDate,
  getFirstLetterUppercase,
} from "@/lib/utils";
import {
  REQUEST_DETAIL_WEB,
  ISSUE_FOR_REQUEST_DETAIL_WEB,
  ERROR_FOR_REQUEST_DETAIL_WEB,
  TASK_FOR_REQUEST_DETAIL_WEB,
  TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import IssueTableCpn from "@/components/IssueTableCpn/IssueTableCpn";
import ErrorTableCpn from "@/components/ErrorTableCpn/ErrorTableCpn";
import TaskTableCpn from "@/components/TaskTableCpn/TaskTableCpn";
import requestService from "@/app/service/request.service";
import WarrantyHistoryModal from "@/components/WarrantyHistoryModal/WarrantyHistoryModal";
import WarrantiesModal from "@/components/WarrantiesModal/WarrantiesModal";
import CreateTaskFromErrorsCpn from "@/components/CreateTaskFromErrorsCpn/CreateTaskFromErrorsCpn";
import CreateTaskFromTechnicalIssuesCpn from "@/components/CreateTaskFromTechnicalIssuesCpn/CreateTaskFromTechnicalIssuesCpn";
import CreateInstallUninstallTaskCpn from "@/components/CreateInstallUninstallTaskCpn/CreateInstallUninstallTaskCpn";
import AddErrorToRequestModal from "@/components/ErrorTableCpn/AddErrorToRequestModal";
import { Badge } from "@/components/ui/badge";
import TechnicalIssueTableCpn from "@/components/TechnicalIssueTableCpn/TechnicalIssueTableCpn";
import { da } from "date-fns/locale";
import { apiClient } from "@/lib/api-client";

// Only keep "Lỗi" and "Nhiệm vụ" tabs
const TAB_CONTENT_LIST = ["Lỗi", "Nhiệm vụ"];

const RequestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.["request-id"] as string;

  const [requestDetail, setRequestDetail] = useState<REQUEST_DETAIL_WEB | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("errors");
  const [selectedErrors, setSelectedErrors] = useState<
    ERROR_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [selectedTechnicalIssues, setSelectedTechnicalIssues] = useState<
    TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showWarrantyHistory, setShowWarrantyHistory] = useState(false);
  const [showWarranties, setShowWarranties] = useState(false);

  const [showCreateTaskFromErrors, setShowCreateTaskFromErrors] =
    useState(false);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  const [tasks, setTasks] = useState<TASK_FOR_REQUEST_DETAIL_WEB[]>([]);
  const [showCreateInstallUninstallTask, setShowCreateInstallUninstallTask] =
    useState(false);

  const [technicalIssues, setTechnicalIssues] = useState<
    TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [showAllTechnicalIssues, setShowAllTechnicalIssues] = useState(false);

  const hasUninstallTask = useMemo(() => {
    return tasks.some((task) =>
      task.taskType.toLowerCase().includes("uninstall")
    );
  }, [tasks]);

  const fetchTasks = useCallback(async () => {
    try {
      const tasksData = await apiClient.request.getTaskOfRequest(requestId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  }, [requestId]);

  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setLoading(true);
        const data = await requestService.getRequestDetail(requestId);
        setRequestDetail(data);
      } catch (error) {
        console.error("Failed to fetch request detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetail();
      fetchTasks();
    }
  }, [fetchTasks, requestId]);

  // Fetch technical issues on mount and when refreshTrigger changes
  useEffect(() => {
    const fetchTechnicalIssues = async () => {
      try {
        const data = await apiClient.request.getTechnicalIssueOfRequest(
          requestId
        );
        setTechnicalIssues(data);
      } catch (error) {
        setTechnicalIssues([]);
      }
    };
    if (requestId) {
      fetchTechnicalIssues();
    }
  }, [requestId, refreshTrigger]);

  const handleBack = () => {
    router.back();
  };

  const handleCreateTaskFromErrors = async () => {
    if (selectedErrors.length === 0) {
      alert("Please select at least one error to create a task.");
      return;
    }
    setShowCreateTaskFromErrors(true);
  };

  const refreshAllData = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchTasks();
  };

  const handleTaskCreated = () => {
    setSelectedErrors([]);
    setSelectedTechnicalIssues([]);
    refreshAllData();
  };

  // Helper function để lấy giá trị tab tiếng Việt
  const getTabValue = (tab: string) => {
    switch (tab) {
      case "Lỗi":
        return "errors";
      case "Nhiệm vụ":
        return "tasks";
      default:
        return tab.toLowerCase().replace(" ", "-");
    }
  };

  // Compact summary layout (like RepairTab)
  const summaryItems = [
    {
      label: "Trạng thái",
      value: (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            requestDetail?.status === "Completed"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : requestDetail?.status === "In Progress"
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
          }`}
        >
          {requestDetail?.status === "Completed"
            ? "Hoàn thành"
            : requestDetail?.status === "In Progress"
            ? "Đang xử lý"
            : "Chờ xử lý"}
        </span>
      ),
      icon: <CheckCircle className="h-4 w-4 text-green-500" />,
    },
    {
      label: "Ngày yêu cầu",
      value: requestDetail?.requestDate
        ? formatAPIDateToHoChiMinh(requestDetail.requestDate, "datetime")
        : "",
      icon: <Calendar className="h-4 w-4 text-gray-500" />,
    },
    {
      label: "Bảo hành",
      value: (
        <span
          className={
            requestDetail?.isWarranty
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }
        >
          {requestDetail?.isWarranty
            ? `Còn hạn (${requestDetail?.remainingWarratyDate} ngày)`
            : "Hết hạn"}
        </span>
      ),
      icon: <Shield className="h-4 w-4 text-yellow-500" />,
    },
    {
      label: "Thiết bị",
      value: requestDetail?.deviceName,
      icon: <Monitor className="h-4 w-4 text-blue-500" />,
    },
    {
      label: "Vị trí",
      value: requestDetail?.location,
      icon: <Package className="h-4 w-4 text-gray-500" />,
    },
  ];

  return (
    <>
      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="space-y-4">
          <div className="w-full flex items-center justify-between">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link href={`/workspace/hot/requests`}>
                    <div className="flex items-center gap-3">
                      <span>Danh sách yêu cầu</span>
                    </div>
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{requestDetail?.requestTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center gap-3">
              <ButtonCpn
                type="button"
                title="Quay lại"
                icon={<RotateCcw size={15} />}
                onClick={handleBack}
              />
            </div>
          </div>

          {/* Compact Summary Section */}
          <Card className="mb-3">
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch">
              <div className="flex-1 flex flex-wrap gap-4 p-3">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className="flex flex-col justify-center items-start gap-1 bg-white dark:bg-gray-900 rounded px-4 py-2 min-w-[140px] flex-grow"
                  >
                    <div className="text-xs flex gap-2 text-gray-600 dark:text-gray-400 mb-1 items-center">
                      {item.icon}
                      {item.label}
                    </div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 break-words">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-2 p-3 sm:w-44 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWarrantyHistory(true)}
                  className="flex items-center text-xs"
                  disabled={!requestDetail?.deviceId}
                >
                  <Eye size={14} className="mr-1" />
                  Lịch sử bảo hành
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowWarranties(true)}
                  className="flex items-center text-xs"
                  disabled={!requestDetail?.deviceId}
                >
                  <Eye size={14} className="mr-1" />
                  Xem bảo hành
                </Button>
              </div>
            </div>
          </Card>

          {/* Compact Issues and Technical Issues Section */}
          <div
            className={
              (requestDetail?.issues?.length ?? 0) > 0 &&
              technicalIssues?.length > 0
                ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                : "grid grid-cols-1 gap-4"
            }
          >
            {/* Sự cố */}
            {requestDetail?.issues && requestDetail.issues.length > 0 && (
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4 px-4 pb-3">
                  <IssueTableCpn
                    issues={
                      showAllIssues
                        ? requestDetail?.issues || []
                        : (requestDetail?.issues || []).slice(0, 3)
                    }
                    loading={loading}
                    showToggle={requestDetail.issues.length > 3}
                    showAll={showAllIssues}
                    onToggle={() => setShowAllIssues((prev) => !prev)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Sự cố kỹ thuật */}
            {technicalIssues && technicalIssues.length > 0 && (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4 px-4 pb-3">
                  <TechnicalIssueTableCpn
                    technicalIssues={
                      showAllTechnicalIssues
                        ? technicalIssues
                        : technicalIssues.slice(0, 3)
                    }
                    requestId={requestId}
                    selectedTechnicalIssues={selectedTechnicalIssues}
                    onSelectionChange={setSelectedTechnicalIssues}
                    refreshTrigger={refreshTrigger}
                    showToggle={technicalIssues.length > 3}
                    showAll={showAllTechnicalIssues}
                    onToggle={() => setShowAllTechnicalIssues((prev) => !prev)}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Compact Tabs Section */}
          <Card>
            <Tabs
              defaultValue="errors"
              value={activeTab}
              className="w-full"
              onValueChange={setActiveTab}
            >
              <CardHeader className="p-3">
                <div className="flex flex-wrap gap-3 items-center justify-between">
                  <TabsList className="flex items-center gap-2 bg-transparent">
                    {TAB_CONTENT_LIST?.map((tab) => {
                      const tabValue = getTabValue(tab);
                      return (
                        <TabsTrigger
                          key={tab}
                          className={`${
                            activeTab === tabValue &&
                            "data-[state=active]:bg-zinc-200 data-[state=active]:dark:bg-gray-700"
                          } bg-zinc-100 dark:text-white dark:bg-gray-900 text-sm px-3 py-2`}
                          value={tabValue}
                          onClick={() => {
                            setActiveTab(tabValue as any);
                          }}
                        >
                          {tab}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  <div className="flex items-center gap-2">
                    {/* Thêm lỗi mới */}
                    {activeTab === "errors" && (
                      <>
                        <ButtonCpn
                          type="button"
                          title="Thêm lỗi mới"
                          icon={<Plus />}
                          onClick={() => setShowAddErrorModal(true)}
                        />
                        {selectedErrors.length > 0 && (
                          <ButtonCpn
                            type="button"
                            title={`Tạo nhiệm vụ sửa chữa (${selectedErrors.length})`}
                            icon={<Plus />}
                            onClick={handleCreateTaskFromErrors}
                          />
                        )}
                      </>
                    )}
                    {/* Thêm nhiệm vụ mới */}
                    {activeTab === "tasks" && (
                      <ButtonCpn
                        type="button"
                        title="Thêm nhiệm vụ mới"
                        icon={<Plus />}
                        onClick={() => setShowCreateInstallUninstallTask(true)}
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pt-0 pb-3">
                <>
                  <TabsContent value="errors">
                    <ErrorTableCpn
                      requestId={requestId}
                      selectedErrors={selectedErrors}
                      onSelectionChange={setSelectedErrors}
                      refreshTrigger={refreshTrigger}
                    />
                  </TabsContent>
                  <TabsContent value="tasks">
                    <TaskTableCpn
                      requestId={requestId}
                      refreshTrigger={refreshTrigger}
                    />
                  </TabsContent>
                </>
              </CardContent>
            </Tabs>
          </Card>

          {/* Modal bảo hành và lịch sử */}
          <WarrantyHistoryModal
            open={showWarrantyHistory}
            onOpenChange={setShowWarrantyHistory}
            deviceId={requestDetail?.deviceId || ""}
            deviceName={requestDetail?.deviceName || ""}
          />
          <WarrantiesModal
            open={showWarranties}
            onOpenChange={setShowWarranties}
            deviceId={requestDetail?.deviceId || ""}
            deviceName={requestDetail?.deviceName || ""}
          />
          {/* Modal tạo nhiệm vụ */}
          <CreateTaskFromErrorsCpn
            open={showCreateTaskFromErrors}
            setOpen={setShowCreateTaskFromErrors}
            requestId={requestId}
            selectedErrors={selectedErrors}
            onTaskCreated={() => {
              handleTaskCreated();
              fetchTasks();
            }}
            hasUninstallTask={hasUninstallTask}
          />
          <CreateInstallUninstallTaskCpn
            open={showCreateInstallUninstallTask}
            setOpen={setShowCreateInstallUninstallTask}
            requestId={requestId}
            onTaskCreated={() => {
              handleTaskCreated();
              fetchTasks();
            }}
          />
          <AddErrorToRequestModal
            open={showAddErrorModal}
            onOpenChange={setShowAddErrorModal}
            requestId={requestId}
            onErrorsAdded={() => {
              setRefreshTrigger((prev) => prev + 1);
            }}
          />
        </div>
      )}
    </>
  );
};

export default RequestDetailPage;
