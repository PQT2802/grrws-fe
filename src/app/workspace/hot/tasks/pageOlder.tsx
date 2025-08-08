"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Package,
  Clock,
  CircleCheckBig,
  AlertCircle,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from "@/components/ui/pagination";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import TaskGroupModal from "@/components/TaskGroupModal/TaskGroupModal";
import { formatTimeStampDate } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import {
  TASK_GROUP_WEB,
  TASK_GROUP_RESPONSE,
  SINGLE_TASK_WEB,
} from "@/types/task.type";

const TaskManagementPage = () => {
  const { canAccessWorkspace } = useAuth();
  const router = useRouter();

  // Task Groups State
  const [taskGroups, setTaskGroups] = useState<TASK_GROUP_WEB[]>([]);
  const [taskGroupsLoading, setTaskGroupsLoading] = useState<boolean>(false);
  const [taskGroupsSearch, setTaskGroupsSearch] = useState("");
  const [taskGroupsPage, setTaskGroupsPage] = useState<number>(1);
  const [taskGroupsPageSize, setTaskGroupsPageSize] = useState<number>(10);
  const [taskGroupsTotalCount, setTaskGroupsTotalCount] = useState<number>(0);
  const [selectedTaskGroup, setSelectedTaskGroup] =
    useState<TASK_GROUP_WEB | null>(null);
  const [showTaskGroupModal, setShowTaskGroupModal] = useState(false);

  // Single Tasks State
  const [singleTasks, setSingleTasks] = useState<SINGLE_TASK_WEB[]>([]);
  const [singleTasksLoading, setSingleTasksLoading] = useState<boolean>(false);
  const [singleTasksSearch, setSingleTasksSearch] = useState("");
  const [singleTasksPage, setSingleTasksPage] = useState<number>(1);
  const [singleTasksPageSize, setSingleTasksPageSize] = useState<number>(10);
  const [singleTasksTotalCount, setSingleTasksTotalCount] = useState<number>(0);
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Redirect if user can't access workspace
  useEffect(() => {
    if (!canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [canAccessWorkspace, router]);

  // Fetch Task Groups
  const fetchTaskGroups = useCallback(async () => {
    try {
      setTaskGroupsLoading(true);
      const response: TASK_GROUP_RESPONSE =
        await apiClient.task.getAllTaskGroups(
          taskGroupsPage,
          taskGroupsPageSize
        );
      setTaskGroups(response.data || []);
      setTaskGroupsTotalCount(response.totalCount || 0);
    } catch (error) {
      console.error("Failed to fetch task groups:", error);
      setTaskGroups([]);
      setTaskGroupsTotalCount(0);
    } finally {
      setTaskGroupsLoading(false);
    }
  }, [taskGroupsPage, taskGroupsPageSize]);

  // Fetch Single Tasks
  const fetchSingleTasks = useCallback(async () => {
    try {
      setSingleTasksLoading(true);
      const response: any = await apiClient.task.getSingleTasks(
        singleTasksPage,
        singleTasksPageSize,
        taskTypeFilter !== "all" ? taskTypeFilter : undefined,
        statusFilter !== "all" ? statusFilter : undefined,
        priorityFilter !== "all" ? priorityFilter : undefined,
        "Latest"
      );
      console.log("Single Tasks Response:", response);
      if (response) {
        setSingleTasks(response.data);
        setSingleTasksTotalCount(response.data.totalCount || 0);
      } else {
        setSingleTasks([]);
        setSingleTasksTotalCount(0);
      }
    } catch (error) {
      console.error("Failed to fetch single tasks:", error);
      setSingleTasks([]);
      setSingleTasksTotalCount(0);
    } finally {
      setSingleTasksLoading(false);
    }
  }, [
    singleTasksPage,
    singleTasksPageSize,
    taskTypeFilter,
    statusFilter,
    priorityFilter,
  ]);

  useEffect(() => {
    if (canAccessWorkspace) {
      fetchTaskGroups();
    }
  }, [canAccessWorkspace, fetchTaskGroups]);

  useEffect(() => {
    if (canAccessWorkspace) {
      fetchSingleTasks();
    }
  }, [canAccessWorkspace, fetchSingleTasks]);

  // Filter functions
  const filteredTaskGroups = useMemo(() => {
    return taskGroups.filter((group) => {
      const searchableText =
        `${group.groupName} ${group.groupType}`.toLowerCase();
      return searchableText.includes(taskGroupsSearch.toLowerCase());
    });
  }, [taskGroups, taskGroupsSearch]);

  const filteredSingleTasks = useMemo(() => {
    return singleTasks.filter((task) => {
      const searchableText =
        `${task.taskName} ${task.taskDescription} ${task.assigneeName}`.toLowerCase();
      return searchableText.includes(singleTasksSearch.toLowerCase());
    });
  }, [singleTasks, singleTasksSearch]);

  // Helper functions
  const getGroupTypeIcon = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return <Package className="h-4 w-4 text-blue-500" />;
      case "repair":
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case "warranty":
        return <CircleCheckBig className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getGroupTypeColor = (groupType: string) => {
    switch (groupType.toLowerCase()) {
      case "replacement":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "repair":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "warranty":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "inprogress":
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

  const handleViewTaskGroup = (taskGroup: TASK_GROUP_WEB) => {
    setSelectedTaskGroup(taskGroup);
    setShowTaskGroupModal(true);
  };

  if (!canAccessWorkspace) {
    return null;
  }

  return (
    <div className="space-y-6">
      <PageTitle
        title="Task Management"
        description="Monitor all task groups and individual tasks"
      />

      <Tabs defaultValue="task-groups" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="task-groups">Task Groups</TabsTrigger>
          <TabsTrigger value="individual-tasks">Individual Tasks</TabsTrigger>
        </TabsList>

        {/* Task Groups Tab */}
        <TabsContent value="task-groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Search task groups..."
                value={taskGroupsSearch}
                onChange={(e) => setTaskGroupsSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {taskGroupsTotalCount} groups total
              </span>
            </div>
          </div>

          {taskGroupsLoading ? (
            <SkeletonCard />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Tasks Summary</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTaskGroups.length > 0 ? (
                      filteredTaskGroups.map((group) => {
                        const totalTasks = group.tasks.length;
                        const completedTasks = group.tasks.filter(
                          (t) => t.status === "Completed"
                        ).length;
                        const inProgressTasks = group.tasks.filter(
                          (t) => t.status === "In Progress"
                        ).length;
                        const pendingTasks = group.tasks.filter(
                          (t) => t.status === "Pending"
                        ).length;

                        return (
                          <TableRow
                            key={group.taskGroupId}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => handleViewTaskGroup(group)}
                          >
                            <TableCell>
                              <div className="font-medium">
                                {group.groupName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getGroupTypeIcon(group.groupType)}
                                <Badge
                                  className={`${getGroupTypeColor(
                                    group.groupType
                                  )} text-xs`}
                                >
                                  {group.groupType}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {totalTasks} tasks total
                                </div>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-green-600">
                                    ✓ {completedTasks}
                                  </span>
                                  <span className="text-blue-600">
                                    ⟳ {inProgressTasks}
                                  </span>
                                  <span className="text-yellow-600">
                                    ⏸ {pendingTasks}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-gray-600 text-sm">
                                {formatTimeStampDate(
                                  group.createdDate,
                                  "datetime"
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewTaskGroup(group);
                                }}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No task groups found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Task Groups Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select
                    value={taskGroupsPageSize.toString()}
                    onValueChange={(value) => {
                      setTaskGroupsPageSize(Number(value));
                      setTaskGroupsPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    {Array.from(
                      {
                        length: Math.ceil(
                          taskGroupsTotalCount / taskGroupsPageSize
                        ),
                      },
                      (_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            href="#"
                            isActive={index + 1 === taskGroupsPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setTaskGroupsPage(index + 1);
                            }}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </TabsContent>

        {/* Individual Tasks Tab */}
        <TabsContent value="individual-tasks" className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                className="pl-10"
                placeholder="Search tasks..."
                value={singleTasksSearch}
                onChange={(e) => setSingleTasksSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Task Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Installation">Installation</SelectItem>
                  <SelectItem value="Uninstallation">Uninstallation</SelectItem>
                  <SelectItem value="WarrantySubmission">Warranty</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {singleTasksLoading ? (
            <SkeletonCard />
          ) : (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Expected Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSingleTasks.length > 0 ? (
                      filteredSingleTasks.map((task) => (
                        <TableRow
                          key={task.taskId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{task.taskName}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{task.taskType}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getStatusColor(
                                task.status
                              )} text-xs`}
                            >
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getPriorityColor(
                                task.priority
                              )} text-xs`}
                            >
                              {task.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{task.assigneeName}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-gray-600 text-sm">
                              {formatTimeStampDate(
                                task.expectedTime,
                                "datetime"
                              )}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No tasks found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>

              {/* Individual Tasks Pagination */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Items per page:</span>
                  <Select
                    value={singleTasksPageSize.toString()}
                    onValueChange={(value) => {
                      setSingleTasksPageSize(Number(value));
                      setSingleTasksPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 20, 50].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Pagination>
                  <PaginationContent>
                    {Array.from(
                      {
                        length: Math.ceil(
                          singleTasksTotalCount / singleTasksPageSize
                        ),
                      },
                      (_, index) => (
                        <PaginationItem key={index}>
                          <PaginationLink
                            href="#"
                            isActive={index + 1 === singleTasksPage}
                            onClick={(e) => {
                              e.preventDefault();
                              setSingleTasksPage(index + 1);
                            }}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Task Group Modal */}
      <TaskGroupModal
        open={showTaskGroupModal}
        onOpenChange={setShowTaskGroupModal}
        taskGroup={selectedTaskGroup}
      />
    </div>
  );
};

export default TaskManagementPage;
