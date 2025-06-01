"use client";

import { useEffect, useState } from "react";
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
import { formatTimeStampDate, getFirstLetterUppercase } from "@/lib/utils";
import {
  REQUEST_DETAIL_WEB,
  ISSUE_FOR_REQUEST_DETAIL_WEB,
  ERROR_FOR_REQUEST_DETAIL_WEB,
  TASK_FOR_REQUEST_DETAIL_WEB,
} from "@/types/request.type";
import IssueTableCpn from "@/components/IssueTableCpn/IssueTableCpn";
import ErrorTableCpn from "@/components/ErrorTableCpn/ErrorTableCpn";
import TaskTableCpn from "@/components/TaskTableCpn/TaskTableCpn";
import requestService from "@/app/service/request.service";

const TAB_CONTENT_LIST = ["Issues", "Errors", "Tasks"];

const RequestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const requestId = params?.["request-id"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [requestDetail, setRequestDetail] = useState<REQUEST_DETAIL_WEB | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"issues" | "errors" | "tasks">(
    "issues"
  );
  const [selectedErrors, setSelectedErrors] = useState<
    ERROR_FOR_REQUEST_DETAIL_WEB[]
  >([]);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

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
    }
  }, [requestId]);

  const handleBack = () => {
    router.back();
  };

  const handleCreateTaskFromErrors = async () => {
    if (selectedErrors.length === 0) {
      alert("Please select at least one error to create a task.");
      return;
    }

    try {
      await requestService.createTaskFromErrors(requestId, selectedErrors);

      setSelectedErrors([]);
      setRefreshTrigger((prev) => prev + 1);
      alert("Task created successfully!");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert("Failed to create task. Please try again.");
    }
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
              </div>
            </CardHeader>

            <CardContent className="px-5 pt-0 pb-5">
              <div className="pt-5 flex border-t border-dashed border-gray-300 dark:border-gray-700">
                <div className="basis-full flex flex-col gap-5">
                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Title
                    </h1>
                    <span>{requestDetail?.requestTitle}</span>
                  </div>

                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Priority
                    </h1>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        requestDetail?.priority === "High"
                          ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          : requestDetail?.priority === "Medium"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                          : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      }`}
                    >
                      {requestDetail?.priority}
                    </span>
                  </div>

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

                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Request Date
                    </h1>
                    <span className="text-gray-600 dark:text-gray-400">
                      {requestDetail?.requestDate &&
                        formatTimeStampDate(
                          requestDetail.requestDate,
                          "datetime"
                        )}
                    </span>
                  </div>

                  <div className="text-[0.9rem] flex items-center gap-3">
                    <h1 className="w-[150px] max-w-[150px] truncate font-semibold text-gray-400">
                      Device
                    </h1>
                    <span>{requestDetail?.deviceName}</span>
                  </div>

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
                      return (
                        <TabsTrigger
                          key={tab}
                          className={`${
                            activeTab === tab.toLowerCase() &&
                            "data-[state=active]:bg-zinc-200 data-[state=active]:dark:bg-gray-700"
                          } bg-zinc-100 dark:text-white dark:bg-gray-900`}
                          value={tab.toLowerCase()}
                          onClick={() => {
                            setActiveTab(tab.toLowerCase() as any);
                          }}
                        >
                          {tab}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>

                  <div className="flex items-center gap-3">
                    {activeTab === "errors" && selectedErrors.length > 0 && (
                      <ButtonCpn
                        type="button"
                        title={`Create Task (${selectedErrors.length})`}
                        icon={<Plus />}
                        onClick={handleCreateTaskFromErrors}
                      />
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
                    />
                  </TabsContent>
                </>
              </CardContent>
            </Tabs>
          </Card>
        </div>
      )}
    </>
  );
};

export default RequestDetailPage;
