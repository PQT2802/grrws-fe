import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WARRANTY_TASK_DETAIL } from "@/types/task.type";
import { FileText, User, PackageMinus, PackageCheck } from "lucide-react";

interface TaskInfoCardProps {
  taskDetail: WARRANTY_TASK_DETAIL;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
}

const TaskInfoCard = ({
  taskDetail,
  getStatusColor,
  getPriorityColor,
}: TaskInfoCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-orange-600" />
          Task Information
        </CardTitle>
        <CardDescription>Details about the warranty task</CardDescription>
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
  );
};

export default TaskInfoCard;
