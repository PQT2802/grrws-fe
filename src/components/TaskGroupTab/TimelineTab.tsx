"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  Timer,
  AlertCircle,
} from "lucide-react";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import { TASK_GROUP_WEB, TASK_IN_GROUP } from "@/types/task.type";
import { translateGroupType } from "@/utils/textTypeTask";

interface TimelineTabProps {
  taskGroup: TASK_GROUP_WEB;
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  suggestedTasks: TASK_IN_GROUP[];
}

const TimelineTab = ({
  taskGroup,
  totalTasks,
  completedTasks,
  inProgressTasks,
  pendingTasks,
  suggestedTasks,
}: TimelineTabProps) => {
  return (
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
                  {formatAPIDateToHoChiMinh(taskGroup.createdDate, "datetime")}
                </div>
                <div className="mt-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-100 dark:border-blue-900">
                  Nhóm nhiệm vụ{" "}
                  <span className="font-medium">{taskGroup.groupName}</span> loại{" "}
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
                    {completedTasks} / {totalTasks} nhiệm vụ đã hoàn thành (
                    {Math.round((completedTasks / totalTasks) * 100)}%)
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
                    {inProgressTasks} nhiệm vụ đang được thực hiện bởi các kỹ
                    thuật viên.
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
                    {pendingTasks} nhiệm vụ đang chờ được giao hoặc bắt đầu thực
                    hiện.
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
                  <div className="text-sm font-medium">Nhiệm vụ đề xuất</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Chờ xét duyệt
                  </div>
                  <div className="mt-2 text-sm bg-purple-50 dark:bg-purple-950/30 p-3 rounded-md border border-purple-100 dark:border-purple-900">
                    {suggestedTasks.length} nhiệm vụ được hệ thống đề xuất và
                    chờ áp dụng.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimelineTab;