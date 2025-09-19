import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Building, 
  Filter,
  Calendar,
  User,
  Clock
} from "lucide-react";
import { REPAIR_TASK_DETAIL } from "@/types/task.type";
import { formatAPIDateUTC } from "@/lib/utils";
import { getPriorityColor, getStatusColor } from "@/utils/colorUtils";

interface RepairTaskTableProps {
  tasks: REPAIR_TASK_DETAIL[];
  onTaskClick?: (task: REPAIR_TASK_DETAIL) => void;
}

const RepairTaskTable: React.FC<RepairTaskTableProps> = ({ 
  tasks, 
  onTaskClick 
}) => {
  const [activeTab, setActiveTab] = useState<string>("all");

  // Filter tasks based on repair location
  const onSiteTasks = tasks.filter(task => task.isOnSiteRepair);
  const offSiteTasks = tasks.filter(task => !task.isOnSiteRepair);

  const getTasksToDisplay = () => {
    switch (activeTab) {
      case "onsite":
        return onSiteTasks;
      case "offsite":
        return offSiteTasks;
      default:
        return tasks;
    }
  };

  const TaskTableContent = ({ taskList }: { taskList: REPAIR_TASK_DETAIL[] }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên nhiệm vụ</TableHead>
            <TableHead>Loại sửa chữa</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ưu tiên</TableHead>
            <TableHead>Người thực hiện</TableHead>
            <TableHead>Thời gian bắt đầu</TableHead>
            <TableHead>Thời gian dự kiến</TableHead>
            <TableHead>Lỗi</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {taskList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                Không có nhiệm vụ sửa chữa nào
              </TableCell>
            </TableRow>
          ) : (
            taskList.map((task) => (
              <TableRow 
                key={task.taskId} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onTaskClick?.(task)}
              >
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{task.taskName}</span>
                    <span className="text-xs text-gray-500">
                      {task.taskDescription}
                    </span>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge 
                    variant={task.isOnSiteRepair ? "default" : "secondary"}
                    className="flex items-center gap-1 w-fit"
                  >
                    {task.isOnSiteRepair ? (
                      <>
                        <MapPin className="h-3 w-3" />
                        Tại chỗ
                      </>
                    ) : (
                      <>
                        <Building className="h-3 w-3" />
                        Xưởng
                      </>
                    )}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge className={getStatusColor(task.status)}>
    
                  </Badge>
                </TableCell>


                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">
                      {task.assigneeName || "Chưa phân công"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    {formatAPIDateUTC(task.startTime, "datetime")}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {formatAPIDateUTC(task.expectedTime, "datetime")}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium">
                      {task.errorDetails.length} lỗi
                    </span>
                    <div className="text-xs text-gray-500">
                      {task.errorDetails
                        .filter(error => error.isFixed)
                        .length} đã sửa
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.(task);
                    }}
                  >
                    Chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Danh sách nhiệm vụ sửa chữa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Tất cả ({tasks.length})
            </TabsTrigger>
            <TabsTrigger value="onsite" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Sửa tại chỗ ({onSiteTasks.length})
            </TabsTrigger>
            <TabsTrigger value="offsite" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Sửa tại xưởng ({offSiteTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <TaskTableContent taskList={tasks} />
          </TabsContent>

          <TabsContent value="onsite" className="mt-4">
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Nhiệm vụ sửa chữa tại chỗ</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">
                Các nhiệm vụ sửa chữa được thực hiện trực tiếp tại vị trí thiết bị
              </p>
            </div>
            <TaskTableContent taskList={onSiteTasks} />
          </TabsContent>

          <TabsContent value="offsite" className="mt-4">
            <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-orange-700">
                <Building className="h-4 w-4" />
                <span className="font-medium">Nhiệm vụ sửa chữa tại xưởng</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">
                Các nhiệm vụ sửa chữa cần đưa thiết bị về xưởng để thực hiện
              </p>
            </div>
            <TaskTableContent taskList={offSiteTasks} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RepairTaskTable;