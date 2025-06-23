"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { WARRANTY_TASK_DETAIL } from "@/types/task.type";
import { DEVICE_WEB } from "@/types/device.type";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import PageTitle from "@/components/PageTitle/PageTitle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
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
} from "lucide-react";

const WarrantyTaskDetailPage = () => {
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

  useEffect(() => {
    const fetchTaskDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const taskData = await apiClient.task.getWarrantyTaskDetail(taskId);
        setTaskDetail(taskData);

        // Fetch device details
        if (taskData.deviceId) {
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={handleBack} variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <PageTitle
        title={taskDetail.taskName}
        description="Warranty Submission Task Details"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Task Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="mt-1">
                  <Badge className={getStatusColor(taskDetail.status)}>
                    {taskDetail.status}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
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
              <label className="text-sm font-medium text-gray-500">
                Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {taskDetail.taskDescription}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Issue Description
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {taskDetail.issueDescription}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Assigned To
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.assigneeName}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warranty Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Warranty Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Claim Number
              </label>
              <p className="mt-1 text-sm font-medium text-blue-600">
                {taskDetail.claimNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Warranty Provider
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.warrantyProvider}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Warranty Code
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.warrantyCode}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">
                Claim Status
              </label>
              <div className="mt-1">
                <Badge className={getClaimStatusColor(taskDetail.claimStatus)}>
                  {taskDetail.claimStatus}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-1" />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Service Location
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.location}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Hotline
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.hotNumber}
                </p>
              </div>
            </div>

            {taskDetail.claimAmount && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Claim Amount
                  </label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    ${taskDetail.claimAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Device Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deviceDetail && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Device Name
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">
                    {deviceDetail.deviceName || "N/A"}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Device Code
                  </label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {deviceDetail.deviceCode || "N/A"}
                  </p>
                </div>

                <div className="space-y-2 text-sm">
                  {deviceDetail.model && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Model:</span>
                      <span>{deviceDetail.model}</span>
                    </div>
                  )}
                  {deviceDetail.manufacturer && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Manufacturer:</span>
                      <span>{deviceDetail.manufacturer}</span>
                    </div>
                  )}
                  {deviceDetail.status && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Device Status:</span>
                      <Badge variant="outline">{deviceDetail.status}</Badge>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Start Date
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.startDate
                    ? formatAPIDateToHoChiMinh(taskDetail.startDate, "datetime")
                    : "Not started"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Expected Return
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.expectedReturnDate
                    ? formatAPIDateToHoChiMinh(
                        taskDetail.expectedReturnDate,
                        "datetime"
                      )
                    : "TBD"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    taskDetail.actualReturnDate ? "bg-green-100" : "bg-gray-100"
                  }`}
                >
                  <Clock
                    className={`h-4 w-4 ${
                      taskDetail.actualReturnDate
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Actual Return
                </label>
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.actualReturnDate
                    ? formatAPIDateToHoChiMinh(
                        taskDetail.actualReturnDate,
                        "datetime"
                      )
                    : "Not returned yet"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Information */}
      {(taskDetail.warrantyNotes || taskDetail.resolution) && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {taskDetail.warrantyNotes && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Warranty Notes
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.warrantyNotes}
                </p>
              </div>
            )}
            {taskDetail.resolution && (
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Resolution
                </label>
                <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {taskDetail.resolution}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WarrantyTaskDetailPage;
