"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { DOCUMENT, WARRANTY_TASK_DETAIL } from "@/types/task.type";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Shield,
  MapPin,
  User,
  Calendar,
  Clock,
  AlertCircle,
  Monitor,
  Phone,
  FileText,
  DollarSign,
  Check,
  X,
  FileIcon,
  FileImage,
  FileText as FileTextIcon,
  ExternalLink,
  Download,
  Eye,
  Info,
  PackageCheck,
  PackageMinus,
  FileType,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import UpdateWarrantyClaimButton from "@/components/warranty/UpdateWarrantyClaimButton";
import CreateWarrantyReturnButton from "@/components/warranty/CreateWarrantyReturnButton";
import Image from "next/image";

const WarrantyTaskDetailPage = () => {
  // State and params setup
  const params = useParams();
  const router = useRouter();
  const taskId = params?.["task-id"] as string;
  const workspaceId = params?.["workspace-id"] as string;

  const [taskDetail, setTaskDetail] = useState<WARRANTY_TASK_DETAIL | null>(
    null
  );
  const [deviceDetail, setDeviceDetail] = useState<DEVICE_WEB | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("details");

  // Fetch task data
  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        let taskData: WARRANTY_TASK_DETAIL | null = null;

        // Try the first API call (getWarrantyTaskDetail)
        try {
          taskData = await apiClient.task.getWarrantyTaskDetail(taskId);
        } catch (firstError) {
          console.warn("getWarrantyTaskDetail failed:", firstError);
          // Fallback to the second API call (getWarrantyReturnTaskDetail)
          try {
            taskData = await apiClient.task.getWarrantyReturnTaskDetail(taskId);
          } catch (secondError) {
            console.error("getWarrantyReturnTaskDetail failed:", secondError);
            throw new Error("Failed to load task details from both endpoints");
          }
        }

        // Log actualReturnDate for debugging
        console.log("taskDetail.actualReturnDate:", taskData?.actualReturnDate);

        // Set task data if successful
        setTaskDetail(taskData);

        // Fetch device details if taskData has a deviceId
        if (taskData?.deviceId) {
          try {
            const deviceData = await apiClient.device.getDeviceById(
              taskData.deviceId
            );
            setDeviceDetail(deviceData);
          } catch (deviceError) {
            console.warn("Could not fetch device details:", deviceError);
          }
        }
      } catch (err) {
        console.error("Failed to fetch task detail:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load task details"
        );
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

  const refreshTaskData = async () => {
    try {
      let taskData = null;

      // Try both APIs as you did in your useEffect
      try {
        taskData = await apiClient.task.getWarrantyTaskDetail(taskId);
      } catch (firstError) {
        console.warn("getWarrantyTaskDetail failed:", firstError);
        taskData = await apiClient.task.getWarrantyReturnTaskDetail(taskId);
      }

      // Log actualReturnDate for debugging
      console.log(
        "taskDetail.actualReturnDate (refresh):",
        taskData?.actualReturnDate
      );

      setTaskDetail(taskData);

      if (taskData?.deviceId) {
        try {
          const deviceData = await apiClient.device.getDeviceById(
            taskData.deviceId
          );
          setDeviceDetail(deviceData);
        } catch (deviceError) {
          console.warn("Could not fetch device details:", deviceError);
        }
      }

      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh task data:", error);
      toast.error("Failed to refresh data");
    }
  };

  // Helper functions for styling
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
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
    switch (priority.toLowerCase()) {
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

  const getClaimStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  // Get file icon based on document type or URL
  const getFileIcon = (document: DOCUMENT) => {
    const type = document.docymentType?.toLowerCase() || "";
    const url = document.documentUrl?.toLowerCase() || "";

    if (type.includes("pdf") || url.endsWith(".pdf")) {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else if (
      type.includes("image") ||
      url.match(/\.(jpg|jpeg|png|gif|webp)$/)
    ) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (type.includes("warranty") || type.includes("claim")) {
      return <Shield className="h-5 w-5 text-indigo-500" />;
    } else if (type.includes("report")) {
      return <FileTextIcon className="h-5 w-5 text-green-500" />;
    } else {
      return <FileIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle document view/download
  const handleViewDocument = (document: DOCUMENT) => {
    window.open(document.documentUrl, "_blank");
  };

  if (loading) {
    return <SkeletonCard />;
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
          {/* Claim Status */}
          <Badge
            className={`${getClaimStatusColor(
              taskDetail.claimStatus
            )} px-3 py-1`}
          >
            <div className="flex items-center gap-1.5">
              {taskDetail.claimStatus.toLowerCase() === "approved" ? (
                <Check className="h-3.5 w-3.5" />
              ) : taskDetail.claimStatus.toLowerCase() === "rejected" ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Timer className="h-3.5 w-3.5" />
              )}
              Claim: {taskDetail.claimStatus}
            </div>
          </Badge>

          {/* Task Status */}
          <Badge className={`${getStatusColor(taskDetail.status)} px-3 py-1`}>
            <div className="flex items-center gap-1.5">
              {taskDetail.status.toLowerCase() === "completed" ? (
                <Check className="h-3.5 w-3.5" />
              ) : taskDetail.status.toLowerCase() === "in progress" ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <Timer className="h-3.5 w-3.5" />
              )}
              Task: {taskDetail.status}
            </div>
          </Badge>

          {/* Uninstall Indicator */}
          {taskDetail.isUninstallDevice && (
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1"
            >
              <div className="flex items-center gap-1.5">
                <PackageMinus className="h-3.5 w-3.5" />
                Requires Uninstallation
              </div>
            </Badge>
          )}

          {/* Priority */}
          <Badge
            className={`${getPriorityColor(taskDetail.priority)} px-3 py-1`}
          >
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              {taskDetail.priority} Priority
            </div>
          </Badge>
        </div>
      </div>

      {/* Page Title */}
      <PageTitle
        title={taskDetail.taskName}
        description={`Warranty Claim: ${taskDetail.claimNumber} | Warranty Claim ID: ${taskDetail.warrantyClaimId}`}
      />

      {/* Main Tabs Navigation */}
      <Tabs
        defaultValue="details"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="details">
            <Shield className="h-4 w-4 mr-2" />
            Claim Details
          </TabsTrigger>
          <TabsTrigger value="documents" className="relative">
            <FileTextIcon className="h-4 w-4 mr-2" />
            Documents
            {taskDetail.documents?.length > 0 && (
              <Badge
                variant="secondary"
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center"
              >
                {taskDetail.documents.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="device">
            <Monitor className="h-4 w-4 mr-2" />
            Device
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Calendar className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Warranty Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Warranty Information
                </CardTitle>
                <CardDescription>
                  Details about the warranty claim
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md border border-blue-100 dark:border-blue-800">
                  <div className="flex-shrink-0 flex justify-center">
                    <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      {taskDetail.warrantyProvider}
                    </div>
                    <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                      {taskDetail.claimNumber}
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-400 flex items-center gap-1">
                      <FileTextIcon className="h-3.5 w-3.5" />
                      Warranty Code: {taskDetail.warrantyCode}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Claim Status
                    </label>
                    <div className="mt-1">
                      <Badge
                        className={getClaimStatusColor(taskDetail.claimStatus)}
                      >
                        {taskDetail.claimStatus}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Contract Number
                    </label>
                    <p className="mt-1 text-sm font-medium">
                      {taskDetail.contractNumber || "Not provided"}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Issue Description
                  </label>
                  <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                    {taskDetail.issueDescription}
                  </p>
                </div>

                {taskDetail.warrantyNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Warranty Notes
                    </label>
                    <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                      {taskDetail.warrantyNotes}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Head of Technical Number
                    </label>
                    <p className="text-sm">
                      <a
                        href={`tel:${taskDetail.hotNumber}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {taskDetail.hotNumber}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-500 mt-1" />
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Service Location
                    </label>
                    <p className="text-sm">{taskDetail.location}</p>
                  </div>
                </div>

                {taskDetail.claimAmount && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-500" />
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Claim Amount
                      </label>
                      <p className="text-sm font-medium">
                        ${taskDetail.claimAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Task Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  Task Information
                </CardTitle>
                <CardDescription>
                  Details about the warranty task
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Task Status
                    </label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(taskDetail.status)}>
                        {taskDetail.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Priority
                    </label>
                    <div className="mt-1">
                      <Badge className={getPriorityColor(taskDetail.priority)}>
                        {taskDetail.priority}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Description
                  </label>
                  <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                    {taskDetail.taskDescription}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Assigned To
                    </label>
                    <p className="text-sm">
                      {taskDetail.assigneeName || "Not assigned"}
                    </p>
                  </div>
                </div>

                {/* Uninstall Information */}
                <div
                  className={`p-3 rounded-md flex items-start gap-3 ${
                    taskDetail.isUninstallDevice
                      ? "bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-800"
                      : "bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
                  }`}
                >
                  {taskDetail.isUninstallDevice ? (
                    <PackageMinus className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <PackageCheck className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {taskDetail.isUninstallDevice
                        ? "Device Uninstallation Required"
                        : "No Uninstallation Required"}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {taskDetail.isUninstallDevice
                        ? "This warranty task requires the device to be uninstalled before sending it to the warranty provider."
                        : "This warranty task can be processed without removing the device from its location."}
                    </p>
                  </div>
                </div>

                {taskDetail.resolution && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Resolution
                    </label>
                    <p className="mt-1 text-sm p-3 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-100 dark:border-green-800">
                      {taskDetail.resolution}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileTextIcon className="h-5 w-5 text-indigo-600" />
                Warranty Documents
              </CardTitle>
              <CardDescription>
                Documents related to this warranty claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              {taskDetail.documents && taskDetail.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskDetail.documents.map((doc, index) => (
                    <Card
                      key={index}
                      className="overflow-hidden border-gray-200 dark:border-gray-700"
                    >
                      <CardHeader className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {getFileIcon(doc)}
                          <div className="truncate">{doc.documentName}</div>
                        </CardTitle>
                        <CardDescription className="text-xs truncate">
                          {doc.docymentType || "Document"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="bg-white dark:bg-gray-900 p-3 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <FileType className="h-4 w-4 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {doc.documentUrl
                                .split(".")
                                .pop()
                                ?.toUpperCase() || "File"}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleViewDocument(doc)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">View</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Document</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={doc.documentUrl}
                                    target="_blank"
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    <span className="sr-only">
                                      Open in New Tab
                                    </span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Open in New Tab</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Link
                                    href={doc.documentUrl}
                                    download
                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-sm font-medium transition-colors hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-800 dark:hover:text-gray-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                                  >
                                    <Download className="h-4 w-4" />
                                    <span className="sr-only">Download</span>
                                  </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Download</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <FileTextIcon className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    No Documents Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                    There are no documents attached to this warranty claim.
                    Documents may include warranty certificates, repair reports,
                    or photos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Device Tab */}
        <TabsContent value="device" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-green-600" />
                Device Information
              </CardTitle>
              <CardDescription>
                Details about the device under warranty
              </CardDescription>
            </CardHeader>
            <CardContent>
              {deviceDetail ? (
                <div className="space-y-6">
                  {/* Device Header */}
                  <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 bg-green-50 dark:bg-green-950/30 rounded-md border border-green-100 dark:border-green-800">
                    <div className="flex-shrink-0 flex justify-center">
                      <div className="h-16 w-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <Monitor className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-green-900 dark:text-green-100">
                        {deviceDetail.deviceName || "N/A"}
                      </h3>
                      <div className="text-sm text-green-800 dark:text-green-300">
                        {deviceDetail.deviceCode || "No Code"}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1 mt-1">
                        <Badge
                          variant="outline"
                          className="bg-white dark:bg-gray-900"
                        >
                          {deviceDetail.status || "Unknown Status"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Device Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        General Information
                      </h4>

                      <div className="space-y-3 text-sm">
                        {deviceDetail.model && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Model
                            </span>
                            <span className="font-medium">
                              {deviceDetail.model}
                            </span>
                          </div>
                        )}

                        {deviceDetail.manufacturer && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Manufacturer
                            </span>
                            <span className="font-medium">
                              {deviceDetail.manufacturer}
                            </span>
                          </div>
                        )}

                        {deviceDetail.serialNumber && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Serial Number
                            </span>
                            <span className="font-medium font-mono">
                              {deviceDetail.serialNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location & Installation
                      </h4>

                      <div className="space-y-3 text-sm">
                        {deviceDetail.zoneName && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Zone
                            </span>
                            <span className="font-medium">
                              {deviceDetail.zoneName}
                            </span>
                          </div>
                        )}

                        {deviceDetail.areaName && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Area
                            </span>
                            <span className="font-medium">
                              {deviceDetail.areaName}
                            </span>
                          </div>
                        )}

                        {deviceDetail.installationDate && (
                          <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">
                              Installation Date
                            </span>
                            <span className="font-medium">
                              {formatAPIDateToHoChiMinh(
                                deviceDetail.installationDate,
                                "date"
                              )}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-center py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                          <span className="text-gray-500 dark:text-gray-400">
                            Under Warranty
                          </span>
                          <Badge
                            className={
                              deviceDetail.isUnderWarranty
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                            }
                          >
                            {deviceDetail.isUnderWarranty ? "Yes" : "No"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Device Details */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      Additional Details
                    </h4>

                    {deviceDetail.specifications && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Specifications
                        </label>
                        <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                          {deviceDetail.specifications}
                        </p>
                      </div>
                    )}

                    {deviceDetail.description && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Description
                        </label>
                        <p className="mt-1 text-sm p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700">
                          {deviceDetail.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {deviceDetail.supplier && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Supplier
                          </label>
                          <p className="mt-1 text-sm font-medium">
                            {deviceDetail.supplier}
                          </p>
                        </div>
                      )}

                      {deviceDetail.purchasePrice > 0 && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            Purchase Price
                          </label>
                          <p className="mt-1 text-sm font-medium">
                            ${deviceDetail.purchasePrice.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {deviceDetail.photoUrl && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Device Photo
                        </label>
                        <div className="mt-2 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
                          <Image
                            src={deviceDetail.photoUrl}
                            alt={deviceDetail.deviceName || "Device photo"}
                            width={800}
                            height={600}
                            className="w-full max-h-64 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                    <Monitor className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    Device Information Not Available
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-md">
                    The detailed information for this device could not be
                    loaded.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => {
                      toast.info("Attempting to reload device information");
                      if (taskDetail.deviceId) {
                        apiClient.device
                          .getDeviceById(taskDetail.deviceId)
                          .then((data) => {
                            setDeviceDetail(data);
                            toast.success(
                              "Device information loaded successfully"
                            );
                          })
                          .catch((err) => {
                            toast.error("Could not load device information");
                            console.error(err);
                          });
                      }
                    }}
                  >
                    Reload Device Information
                  </Button>
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
                Warranty Timeline
              </CardTitle>
              <CardDescription>
                Timeline of events for this warranty claim
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute top-0 bottom-0 left-5 w-0.5 bg-gray-200 dark:bg-gray-700 ml-2.5"></div>

                <div className="space-y-8 relative z-10 ml-2">
                  {/* Claim Created */}
                  <div className="flex gap-4 items-start">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        Warranty Claim Created
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatAPIDateToHoChiMinh(taskDetail.startDate)}
                      </div>
                      <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                        Claim number{" "}
                        <span className="font-medium">
                          {taskDetail.claimNumber}
                        </span>{" "}
                        was created for the device{" "}
                        <span className="font-medium">
                          {deviceDetail?.deviceName || "Unknown Device"}
                        </span>
                        .
                      </div>
                    </div>
                  </div>

                  {/* Expected Return */}
                  {taskDetail.expectedReturnDate && (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Expected Return Date
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatAPIDateToHoChiMinh(
                            taskDetail.expectedReturnDate
                          )}
                        </div>
                        <div className="mt-2 text-sm bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-md border border-yellow-100 dark:border-yellow-900">
                          The device is expected to be returned by this date
                          according to the warranty provider.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actual Return */}
                  {taskDetail.actualReturnDate ? (
                    <div className="flex gap-4 items-start">
                      <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Device Returned
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatAPIDateToHoChiMinh(
                            taskDetail.actualReturnDate
                          )}
                        </div>
                        <div className="mt-2 text-sm bg-green-50 dark:bg-green-950/30 p-3 rounded-md border border-green-100 dark:border-green-900">
                          The device was returned from warranty service.
                          {taskDetail.resolution && (
                            <div className="mt-2">
                              <strong>Resolution:</strong>{" "}
                              {taskDetail.resolution}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-4 items-start opacity-60">
                      <div className="h-10 w-10 rounded-full bg-gray-100 dark:bg-gray-800 border-4 border-white dark:border-gray-900 flex items-center justify-center flex-shrink-0">
                        <Clock className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">
                          Pending Return
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Not returned yet
                        </div>
                        <div className="mt-2 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded-md border border-gray-100 dark:border-gray-700">
                          The device has not been returned from warranty service
                          yet.
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

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-10">
        <div className="container mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Info className="h-4 w-4 mr-2" />
            Last updated: {formatAPIDateToHoChiMinh(new Date().toISOString())}
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tasks
            </Button>

            {taskDetail.taskType === "WarrantySubmission" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      {!taskDetail.actualReturnDate ? (
                        <UpdateWarrantyClaimButton
                          taskDetail={taskDetail}
                          onSuccess={refreshTaskData}
                        />
                      ) : (
                        <Button variant="outline" disabled>
                          Update Claim
                        </Button>
                      )}
                    </span>
                  </TooltipTrigger>
                  {taskDetail.actualReturnDate && (
                    <TooltipContent>
                      <p>Cannot update claim after return task is created</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )}

            <CreateWarrantyReturnButton
              taskDetail={taskDetail}
              onSuccess={refreshTaskData}
              open={false}
              onOpenChange={function (open: boolean): void {
                throw new Error("Function not implemented.");
              }}
            />

            <Button variant="default">
              <Eye className="h-4 w-4 mr-2" />
              View Request
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarrantyTaskDetailPage;
