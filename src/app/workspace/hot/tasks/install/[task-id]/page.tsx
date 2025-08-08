"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { INSTALL_TASK_DETAIL } from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import PageTitle from "@/components/PageTitle/PageTitle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Package,
  MapPin,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Settings,
  Monitor,
  Plus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  CircleAlert,
  Loader2,
} from "lucide-react";
import Image from "next/image";

const InstallTaskDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const taskId = params?.["task-id"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [taskDetail, setTaskDetail] = useState<INSTALL_TASK_DETAIL | null>(
    null
  );
  const [newDeviceDetail, setNewDeviceDetail] = useState<DEVICE_WEB | null>(
    null
  );
  const [currentDeviceDetail, setCurrentDeviceDetail] =
    useState<DEVICE_WEB | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const taskData = await apiClient.task.getInstallTaskDetail(taskId);
        setTaskDetail(taskData);

        // Fetch NEW device details (the device being installed)
        if (taskData.newDeviceId) {
          try {
            const newDeviceData = await apiClient.device.getDeviceById(
              taskData.newDeviceId
            );
            setNewDeviceDetail(newDeviceData);
          } catch (deviceError) {
            console.warn("Could not fetch new device details:", deviceError);
          }
        }

        // Fetch CURRENT device details (the device being replaced, if applicable)
        if (taskData.deviceId && taskData.deviceId !== taskData.newDeviceId) {
          try {
            const currentDeviceData = await apiClient.device.getDeviceById(
              taskData.deviceId
            );
            setCurrentDeviceDetail(currentDeviceData);
          } catch (deviceError) {
            console.warn(
              "Could not fetch current device details:",
              deviceError
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch task detail:", err);
        setError("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchTaskDetail();
    }
  }, [taskId]);

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase() || "") {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase() || "") {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-8">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="text-xl font-medium">Loading task details...</span>
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error || !taskDetail) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Task
          </h2>
          <p className="text-gray-600 mb-4">{error || "Task not found"}</p>
          <Button onClick={handleBack} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button
          onClick={handleBack}
          variant="outline"
          size="sm"
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-wrap gap-2">
          {/* Status Badge */}
          <Badge className={getStatusColor(taskDetail.status)}>
            Status: {taskDetail.status}
          </Badge>

          {/* Priority Badge */}
          <Badge className={getPriorityColor(taskDetail.priority)}>
            {taskDetail.priority} Priority
          </Badge>
        </div>
      </div>

      <PageTitle
        title={taskDetail.taskName || "Install New Device"}
        description={`Installation Task: ${taskDetail.taskType} | Task Group: ${
          taskDetail.taskGroupName || "N/A"
        }`}
      />

      {/* Installation Timeline */}
      <Card>
        <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
          <CardTitle className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Installation Timeline
          </CardTitle>
          <CardDescription>
            Timeline for the device installation process
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="relative">
            {/* Timeline Connecting Line */}
            <div className="absolute left-5 top-0 bottom-0 w-1 bg-blue-200 dark:bg-blue-800"></div>

            <div className="space-y-12">
              {/* Start Time */}
              <div className="relative flex gap-x-4">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-900">
                  <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-14 space-y-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Task Started
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {taskDetail.startTime
                      ? formatAPIDateToHoChiMinh(
                          taskDetail.startTime,
                          "datetime"
                        )
                      : "Not started yet"}
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md text-sm border border-blue-100 dark:border-blue-900">
                    Installation process initiated. New device ready to be
                    installed.
                  </div>
                </div>
              </div>

              {/* Expected Completion */}
              <div className="relative flex gap-x-4">
                <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 border-4 border-white dark:border-gray-900">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="ml-14 space-y-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    Expected Completion
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatAPIDateToHoChiMinh(
                      taskDetail.expectedTime,
                      "datetime"
                    )}
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md text-sm border border-amber-100 dark:border-amber-900 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <span>
                      The device installation is expected to be completed by
                      this time.
                      {new Date(taskDetail.expectedTime) < new Date() &&
                        !taskDetail.endTime && (
                          <span className="block mt-2 text-amber-700 dark:text-amber-400 font-medium">
                            This deadline has passed without completion.
                          </span>
                        )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Completion Status */}
              <div className="relative flex gap-x-4">
                <div
                  className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white dark:border-gray-900 ${
                    taskDetail.endTime
                      ? "bg-green-100 dark:bg-green-900"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  {taskDetail.endTime ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <CircleAlert className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  )}
                </div>
                <div className="ml-14 space-y-1">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {taskDetail.endTime
                      ? "Task Completed"
                      : "Pending Completion"}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {taskDetail.endTime
                      ? formatAPIDateToHoChiMinh(taskDetail.endTime, "datetime")
                      : "Not completed yet"}
                  </div>
                  <div
                    className={`p-3 rounded-md text-sm border ${
                      taskDetail.endTime
                        ? "bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {taskDetail.endTime
                      ? "Device installation has been completed successfully."
                      : "The installation process is still ongoing or not yet started."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content: New Device and Task Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEW DEVICE - Highlight with green to indicate it's being installed */}
        <Card className="border-green-200 shadow-md">
          <CardHeader className="bg-green-50 dark:bg-green-950/30 border-b border-green-100">
            <CardTitle className="text-green-800 dark:text-green-300 flex items-center gap-2">
              <Plus className="h-5 w-5" />
              New Device Being Installed
            </CardTitle>
            <CardDescription>
              Details about the new device being added to the system
            </CardDescription>
          </CardHeader>
          {newDeviceDetail ? (
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4 items-start">
                {/* Device Image */}
                {newDeviceDetail.photoUrl ? (
                  <div className="md:w-1/3 w-full mb-4 md:mb-0">
                    <div className="aspect-square rounded-md overflow-hidden border border-green-100 shadow-sm relative">
                      <Image
                        src={newDeviceDetail.photoUrl}
                        alt={newDeviceDetail.deviceName || "Device image"}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                        priority={true}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="md:w-1/3 w-full mb-4 md:mb-0">
                    <div className="aspect-square rounded-md bg-green-50 border border-green-100 flex items-center justify-center">
                      <Monitor className="h-16 w-16 text-green-200" />
                    </div>
                  </div>
                )}

                {/* Device Details */}
                <div className="md:w-2/3 w-full space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {newDeviceDetail.deviceName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Code: {newDeviceDetail.deviceCode}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      NEW
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    {newDeviceDetail.model && (
                      <div className="p-2 bg-green-50/50 dark:bg-green-950/20 rounded flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Model:
                        </span>
                        <span className="font-medium">
                          {newDeviceDetail.model}
                        </span>
                      </div>
                    )}
                    {newDeviceDetail.manufacturer && (
                      <div className="p-2 bg-green-50/50 dark:bg-green-950/20 rounded flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Manufacturer:
                        </span>
                        <span className="font-medium">
                          {newDeviceDetail.manufacturer}
                        </span>
                      </div>
                    )}
                    {newDeviceDetail.serialNumber && (
                      <div className="p-2 bg-green-50/50 dark:bg-green-950/20 rounded flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">
                          Serial:
                        </span>
                        <span className="font-medium font-mono">
                          {newDeviceDetail.serialNumber}
                        </span>
                      </div>
                    )}
                    {newDeviceDetail.status && (
                      <div className="p-2 bg-green-50/50 dark:bg-green-950/20 rounded flex justify-between items-center">
                        <span className="text-gray-500 dark:text-gray-400">
                          Status:
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-white border-green-200"
                        >
                          {newDeviceDetail.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Separator className="my-2 bg-green-100" />

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">
                      Installation Location:{" "}
                    </span>
                    <span className="text-sm">
                      {taskDetail.location || "Not specified"}
                    </span>
                  </div>

                  {/* Specifications */}
                  {newDeviceDetail.specifications && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Specifications:
                      </h4>
                      <p className="text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                        {newDeviceDetail.specifications}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          ) : (
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                  <Info className="h-8 w-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    New Device Information Not Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    The detailed information for this device could not be
                    loaded.
                  </p>
                </div>
              </div>
            </CardContent>
          )}
          <CardFooter className="bg-green-50/50 border-t border-green-100 py-3">
            <div className="w-full flex justify-between items-center text-sm text-green-700">
              <span className="flex items-center gap-1">
                <Plus className="h-4 w-4" />
                New Device ID: {taskDetail.newDeviceId}
              </span>
              {newDeviceDetail?.isUnderWarranty && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Under Warranty
                </Badge>
              )}
            </div>
          </CardFooter>
        </Card>

        {/* Task Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Installation Task Details
            </CardTitle>
            <CardDescription>
              Information about this installation task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
              <User className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Assigned To:
                </p>
                <p className="font-medium">
                  {taskDetail.assigneeName || "Not assigned"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description:
              </h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm">
                  {taskDetail.taskDescription || "No description provided"}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Group:
              </h3>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium">
                  {taskDetail.taskGroupName || "No group assigned"}
                </p>
              </div>
            </div>

            {/* Current Device (if available) */}
            {currentDeviceDetail &&
              currentDeviceDetail.id !== newDeviceDetail?.id && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Current Device Being Replaced:
                  </h3>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-md border border-amber-100 dark:border-amber-900">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {currentDeviceDetail.deviceName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Code: {currentDeviceDetail.deviceCode}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200"
                      >
                        CURRENT
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Model:</span>
                        <span>{currentDeviceDetail.model}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span>{currentDeviceDetail.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons - Fixed at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <Button variant="outline" onClick={handleBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tasks
          </Button>

          <div className="flex gap-2">
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Settings className="h-4 w-4" />
              Manage Installation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallTaskDetailPage;
