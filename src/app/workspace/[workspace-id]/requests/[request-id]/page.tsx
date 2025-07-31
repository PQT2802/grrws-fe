"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RotateCcw, Eye, Plus } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import TechnicalIssueTableCpn from "@/components/TechnicalIssueTableCpn/TechnicalIssueTableCpn";
import requestService from "@/app/service/request.service";
import WarrantyHistoryModal from "@/components/WarrantyHistoryModal/WarrantyHistoryModal";
import WarrantiesModal from "@/components/WarrantiesModal/WarrantiesModal";
import CreateTaskFromErrorsCpn from "@/components/CreateTaskFromErrorsCpn/CreateTaskFromErrorsCpn";
import CreateTaskFromTechnicalIssuesCpn from "@/components/CreateTaskFromTechnicalIssuesCpn/CreateTaskFromTechnicalIssuesCpn";
import CreateInstallUninstallTaskCpn from "@/components/CreateInstallUninstallTaskCpn/CreateInstallUninstallTaskCpn";
import AddErrorToRequestModal from "@/components/ErrorTableCpn/AddErrorToRequestModal";

// ✅ Updated to include Technical Issues
const TAB_CONTENT_LIST = ["Issues", "Errors", "Tasks", "Technical Issues"];

const RequestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.["request-id"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [requestDetail, setRequestDetail] = useState<REQUEST_DETAIL_WEB | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    "issues" | "technical-issues" | "errors" | "tasks"
  >("issues");
  const [selectedErrors, setSelectedErrors] = useState<
    ERROR_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  // ✅ Add state for selected technical issues
  const [selectedTechnicalIssues, setSelectedTechnicalIssues] = useState<
    TECHNICAL_ISSUE_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [showWarrantyHistory, setShowWarrantyHistory] = useState(false);
  const [showWarranties, setShowWarranties] = useState(false);

  // ✅ Add state for modals
  const [showCreateTaskFromErrors, setShowCreateTaskFromErrors] =
    useState(false);
  const [
    showCreateTaskFromTechnicalIssues,
    setShowCreateTaskFromTechnicalIssues,
  ] = useState(false);
  const [showAddErrorModal, setShowAddErrorModal] = useState(false);

  const [tasks, setTasks] = useState<TASK_FOR_REQUEST_DETAIL_WEB[]>([]);

  // Add new state for the task creation modal
  const [showCreateInstallUninstallTask, setShowCreateInstallUninstallTask] =
    useState(false);

  // Check if uninstall task exists
  const hasUninstallTask = useMemo(() => {
    return tasks.some((task) =>
      task.taskType.toLowerCase().includes("uninstall")
    );
  }, [tasks]);

  const fetchTasks = async () => {
    try {
      const tasksData = await requestService.getTasksByRequestId(requestId);
      setTasks(tasksData);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    }
  };

  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setLoading(true);
        const data = await requestService.getRequestDetail(requestId);
        console.log("Detail", data);
        setRequestDetail(data);
      } catch (error) {
        console.error("Failed to fetch request detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequestDetail();
      fetchTasks(); // ✅ Fetch tasks to check for uninstall task
    }
  }, [requestId]);

  const handleBack = () => {
    router.back();
  };

  // ✅ Updated to use modal instead of direct service call
  const handleCreateTaskFromErrors = async () => {
    if (selectedErrors.length === 0) {
      alert("Please select at least one error to create a task.");
      return;
    }

    setShowCreateTaskFromErrors(true);
  };

  // ✅ Updated to use modal instead of direct service call
  const handleCreateTaskFromTechnicalIssues = async () => {
    if (selectedTechnicalIssues.length === 0) {
      alert("Please select at least one technical issue to create a task.");
      return;
    }

    setShowCreateTaskFromTechnicalIssues(true);
  };

  // ✅ Add a function to refresh all data
  const refreshAllData = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchTasks();
  };

  // ✅ Update the callback functions
  const handleTaskCreated = () => {
    setSelectedErrors([]);
    setSelectedTechnicalIssues([]);
    refreshAllData(); // Use the new refresh function
  };

  // ✅ Helper function to get tab value for technical issues
  const getTabValue = (tab: string) => {
    return tab.toLowerCase().replace(" ", "-");
  };

  return (
    <>
      {loading ? (
        <SkeletonCard />
      ) : (
        <div>
          <div className="w-full flex items-center justify-between mb-8">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <Link href={`/workspace/${workspaceId}/requests`}>
                    <div className="flex items-center gap-3">
                      <span>Requests</span>
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
                title="Back"
                icon={<RotateCcw size={15} />}
                onClick={handleBack}
              />
            </div>
          </div>

          {/* Request Detail Card */}
          <Card className="p-0 bg-zinc-50 dark:bg-slate-900 rounded-md mb-5">
            <CardHeader className="px-5 pt-5 pb-5">
              <div className="flex items-center justify-between">
                <h1 className="text-[1.05rem] font-semibold">
                  Request Overview
                </h1>

                {/* ✅ Add warranty buttons */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWarrantyHistory(true)}
                    className="flex items-center gap-2"
                    disabled={!requestDetail?.deviceId}
                  >
                    <Eye size={16} />
                    View History
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowWarranties(true)}
                    className="flex items-center gap-2"
                    disabled={!requestDetail?.deviceId}
                  >
                    <Eye size={16} />
                    View Warranties
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-5 pt-0 pb-5">
              <div className="pt-5 flex border-t border-dashed border-gray-300 dark:border-gray-700">
                <div className="basis-full flex flex-col gap-5">
                  {/* ✅ Request Title */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Title
                    </h1>
                    <span>{requestDetail?.requestTitle}</span>
                  </div>

                  {/* ✅ Status */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Status
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        requestDetail?.status === "Completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : requestDetail?.status === "In Progress"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                      }`}
                    >
                      {requestDetail?.status}
                    </span>
                  </div>

                  {/* ✅ Request Date */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Request Date
                    </h1>
                    <span className="text-gray-600 dark:text-gray-400">
                      {requestDetail?.requestDate &&
                        formatAPIDateToHoChiMinh(
                          requestDetail.requestDate,
                          "datetime"
                        )}
                    </span>
                  </div>

                  {/* ✅ Warranty Status */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Warranty
                    </h1>
                    <span
                      className={
                        requestDetail?.isWarranty
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {requestDetail?.isWarranty
                        ? `Active (${requestDetail?.remainingWarratyDate} days left)`
                        : "Expired"}
                    </span>
                  </div>

                  {/* ✅ Device Name */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Device
                    </h1>
                    <span>{requestDetail?.deviceName}</span>
                  </div>

                  {/* ✅ Location */}
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Location
                    </h1>
                    <span>{requestDetail?.location}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs Section */}
          <Card className="my-5">
            <Tabs defaultValue="issues" className="w-full">
              <CardHeader className="p-4">
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
                          } bg-zinc-100 dark:text-white dark:bg-gray-900`}
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

                  <div className="flex items-center gap-3">
                    {/* ✅ Add New Issue Button */}
                    {activeTab === "issues" && (
                      <ButtonCpn
                        type="button"
                        title="Add New Issue"
                        icon={<Plus />}
                        onClick={() => {
                          // TODO: Implement add new issue functionality
                          console.log("Add new issue");
                        }}
                      />
                    )}

                    {/* ✅ Add New Error Button */}
                    {activeTab === "errors" && (
                      <>
                        <ButtonCpn
                          type="button"
                          title="Thêm Lỗi Mới"
                          icon={<Plus />}
                          onClick={() => setShowAddErrorModal(true)}
                        />
                        {selectedErrors.length > 0 && (
                          <ButtonCpn
                            type="button"
                            title={`Tạo Nhiệm vụ Sửa chữa (${selectedErrors.length})`}
                            icon={<Plus />}
                            onClick={handleCreateTaskFromErrors}
                          />
                        )}
                      </>
                    )}

                    {/* ✅ Add New Task Button */}
                    {activeTab === "tasks" && (
                      <ButtonCpn
                        type="button"
                        title="Add New Task"
                        icon={<Plus />}
                        onClick={() => setShowCreateInstallUninstallTask(true)}
                      />
                    )}

                    {/* ✅ Add New Technical Issue Button */}
                    {activeTab === "technical-issues" && (
                      <>
                        <ButtonCpn
                          type="button"
                          title="Add New Technical Issue"
                          icon={<Plus />}
                          onClick={() => {
                            // TODO: Implement add new technical issue functionality
                            console.log("Add new technical issue");
                          }}
                        />
                        {selectedTechnicalIssues.length > 0 && (
                          <ButtonCpn
                            type="button"
                            title={`Create Warranty Task (${selectedTechnicalIssues.length})`}
                            icon={<Plus />}
                            onClick={handleCreateTaskFromTechnicalIssues}
                          />
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="px-4 pt-0 pb-4">
                <>
                  <TabsContent value="issues">
                    <IssueTableCpn
                      issues={requestDetail?.issues || []}
                      loading={loading}
                    />
                  </TabsContent>
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
                      workspaceId={workspaceId}
                    />
                  </TabsContent>
                  {/* ✅ Add Technical Issues tab content */}
                  <TabsContent value="technical-issues">
                    <TechnicalIssueTableCpn
                      requestId={requestId}
                      selectedTechnicalIssues={selectedTechnicalIssues}
                      onSelectionChange={setSelectedTechnicalIssues}
                      refreshTrigger={refreshTrigger}
                    />
                  </TabsContent>
                </>
              </CardContent>
            </Tabs>
          </Card>

          {/* ✅ Warranty and History Modals */}
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

          {/* ✅ Task Creation Modals */}
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

          <CreateTaskFromTechnicalIssuesCpn
            open={showCreateTaskFromTechnicalIssues}
            setOpen={setShowCreateTaskFromTechnicalIssues}
            requestId={requestId}
            selectedTechnicalIssues={selectedTechnicalIssues}
            onTaskCreated={handleTaskCreated}
            deviceId={requestDetail?.deviceId || ""}
          ></CreateTaskFromTechnicalIssuesCpn>

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
