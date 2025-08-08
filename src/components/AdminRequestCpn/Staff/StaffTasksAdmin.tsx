"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  RefreshCw,
  Archive,
  Wrench,
  Settings,
  List,
  Loader2,
  MoreHorizontal,
  Eye,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  Package,
  ArrowUpDown,
  RotateCcw,
} from "lucide-react";
import {
  STAFF_TASK,
  TASK_TYPE_MAPPING,
  TaskTabType,
  TaskType,
} from "@/types/task.type";
import { apiClient } from "@/lib/api-client";

interface StaffTasksAdminProps {
  activeTab: TaskTabType;
  onTasksUpdate?: (tasks: STAFF_TASK[]) => void;
  refreshTrigger?: number;
}

export default function StaffTasksAdmin({
  activeTab,
  onTasksUpdate,
  refreshTrigger,
}: StaffTasksAdminProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [tasks, setTasks] = useState<STAFF_TASK[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Page size options
  const pageSizeOptions = [5, 10, 20, 50];

  // Fetch tasks from API
  const fetchTasks = useCallback(
    async (page: number = 1, newPageSize?: number) => {
      setIsLoading(true);
      try {
        const currentPageSize = newPageSize || pagination.pageSize;
        const response = await apiClient.task.getAllSingleTasks(
          page,
          currentPageSize,
          taskTypeFilter !== "all" ? taskTypeFilter : undefined,
          statusFilter !== "all" ? statusFilter : undefined,
          priorityFilter !== "all" ? priorityFilter : undefined
        );

        setTasks(response.data);
        setPagination((prev) => ({
          ...prev,
          currentPage: response.pageNumber,
          pageSize: currentPageSize,
          totalItems: response.totalCount,
          totalPages: Math.ceil(response.totalCount / currentPageSize),
        }));

        if (onTasksUpdate) {
          onTasksUpdate(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch tasks:", error);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      pagination.pageSize,
      taskTypeFilter,
      statusFilter,
      priorityFilter,
      onTasksUpdate,
    ]
  );

  useEffect(() => {
    fetchTasks(1); // Reset to page 1 when filters change
  }, [
    taskTypeFilter,
    statusFilter,
    priorityFilter,
    refreshTrigger,
    fetchTasks,
  ]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
    fetchTasks(1, size);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchTasks(page);
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchTerm("");
    setTaskTypeFilter("all");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // Filter tasks based on active tab and search term
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filter by tab
    if (activeTab !== "all") {
      const allowedTypes = TASK_TYPE_MAPPING[activeTab];
      filtered = filtered.filter((task) =>
        allowedTypes.includes(task.taskType as TaskType)
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.taskName.toLowerCase().includes(searchLower) ||
          task.taskDescription.toLowerCase().includes(searchLower) ||
          task.assigneeName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by startTime (descending)
    return filtered.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  };

  const filteredTasks = getFilteredTasks();

  const handleViewDetails = (task: STAFF_TASK) => {
    console.log("View task details:", task);
    // TODO: Implement task detail modal or navigation
  };

  // Helper functions for styling and formatting
  const getTypeInfo = (type: string) => {
    switch (type.toLowerCase()) {
      case "repair":
        return { icon: Wrench, label: "Sửa chữa", color: "text-orange-400" };
      case "warranty":
        return { icon: Archive, label: "Bảo hành", color: "text-blue-400" };
      case "warrantysubmission":
        return { icon: Package, label: "Gửi bảo hành", color: "text-blue-400" };
      case "warrantyreturn":
        return {
          icon: ArrowUpDown,
          label: "Nhận máy bảo hành",
          color: "text-green-400",
        };
      case "replacement":
        return { icon: RefreshCw, label: "Thay thế", color: "text-purple-400" };
      case "installation":
        return {
          icon: Settings,
          label: "Lắp đặt máy",
          color: "text-green-400",
        };
      case "uninstallation":
        return { icon: Settings, label: "Tháo máy", color: "text-red-400" };
      default:
        return { icon: List, label: type, color: "text-gray-400" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "inprogress":
      case "in-progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "waitingforconfirmation":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "waitingforinstallation":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "paused":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "urgent":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "inprogress":
      case "in-progress":
        return <RefreshCw className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "waitingforinstallation":
        return <Pause className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: "Đang chờ",
      inprogress: "Đang thực hiện",
      "in-progress": "Đang thực hiện",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
      waitingforconfirmation: "Chờ xác nhận",
      waitingforinstallation: "Chờ lắp đặt",
      paused: "Tạm dừng",
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const formatVietnamesePriority = (priority: string) => {
    const priorityMap: { [key: string]: string } = {
      urgent: "Khẩn cấp",
      high: "Cao",
      medium: "Trung bình",
      low: "Thấp",
    };
    return priorityMap[priority.toLowerCase()] || priority;
  };

  // Calculate time differences
  const calculateTimeDuration = (task: STAFF_TASK) => {
    const startTime = new Date(task.startTime);
    const expectedTime = new Date(task.expectedTime);
    const endTime = task.endTime ? new Date(task.endTime) : null;

    // Calculate estimated hours (expectedTime - startTime)
    const estimatedHours = Math.round(
      (expectedTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    );

    // Calculate actual hours (endTime - startTime) if completed
    let actualHours = null;
    if (endTime && task.status.toLowerCase() === "completed") {
      actualHours = Math.round(
        (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      );
    }

    return { estimatedHours, actualHours };
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case "all":
        return "Tất cả công việc";
      case "warranty":
        return "Công việc bảo hành";
      case "repair":
        return "Công việc sửa chữa";
      case "replace":
        return "Công việc thay thế";
      case "install_uninstall":
        return "Công việc lắp đặt & tháo";
      default:
        return "Công việc";
    }
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;

    // Always show first page
    if (totalPages > 0) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if there's a gap
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Show pages around current page
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={currentPage === i}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Show ellipsis if there's a gap
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Always show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={currentPage === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getTabTitle()}
            <Badge variant="secondary">{pagination.totalItems}</Badge>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm công việc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            <Select value={taskTypeFilter} onValueChange={setTaskTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại công việc" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="Repair">Sửa chữa</SelectItem>
                <SelectItem value="Warranty">Bảo hành</SelectItem>
                <SelectItem value="WarrantySubmission">Gửi bảo hành</SelectItem>
                <SelectItem value="WarrantyReturn">
                  Nhận máy bảo hành
                </SelectItem>
                <SelectItem value="Replacement">Thay thế</SelectItem>
                <SelectItem value="Installation">Lắp đặt máy</SelectItem>
                <SelectItem value="Uninstallation">Tháo máy</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Pending">Đang chờ</SelectItem>
                <SelectItem value="InProgress">Đang thực hiện</SelectItem>
                <SelectItem value="Completed">Hoàn thành</SelectItem>
                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                <SelectItem value="WaitingForInstallation">
                  Chờ lắp đặt
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Ưu tiên" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả mức độ</SelectItem>
                <SelectItem value="Low">Thấp</SelectItem>
                <SelectItem value="Medium">Trung bình</SelectItem>
                <SelectItem value="High">Cao</SelectItem>
                <SelectItem value="Urgent">Khẩn cấp</SelectItem>
              </SelectContent>
            </Select>

            {/* Reset Filters Button */}
            <Button
              variant="outline"
              onClick={handleResetFilters}
              className="text-orange-400 border-orange-500/20 hover:bg-orange-500/10"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Đặt lại bộ lọc
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải công việc...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Không tìm thấy công việc nào phù hợp với tiêu chí</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chi tiết công việc</TableHead>
                <TableHead>Loại công việc</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ưu tiên</TableHead>
                <TableHead>Phân công</TableHead>
                <TableHead>Thời gian thực hiện</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="w-[100px]">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.map((task) => {
                const typeInfo = getTypeInfo(task.taskType);
                const TypeIcon = typeInfo.icon;
                const { estimatedHours, actualHours } =
                  calculateTimeDuration(task);

                return (
                  <TableRow key={task.taskId} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{task.taskName}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                          {task.taskDescription}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className={`flex items-center gap-2 ${typeInfo.color}`}
                      >
                        <TypeIcon className="h-4 w-4" />
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${getStatusColor(
                          task.status
                        )} flex items-center gap-1 w-fit`}
                      >
                        {getStatusIcon(task.status)}
                        {formatVietnameseStatus(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(task.priority)}>
                        {formatVietnamesePriority(task.priority)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {/* Handle unassigned tasks */}
                            {task.assigneeName &&
                            task.assigneeName.trim() !== ""
                              ? task.assigneeName
                              : "Chưa có người nhận"}
                          </span>
                        </div>
                        {task.isUninstallDevice && (
                          <Badge variant="outline" className="text-xs">
                            Cần tháo máy
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>Bắt đầu: {formatDate(task.startTime)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-orange-400">
                          <Clock className="h-3 w-3" />
                          <span>Dự kiến: {formatDate(task.expectedTime)}</span>
                        </div>
                        {task.endTime && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            <span>Hoàn thành: {formatDate(task.endTime)}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-blue-400">
                          ⏱ Ước tính: {estimatedHours}h
                        </div>
                        {actualHours !== null && (
                          <div className="flex items-center gap-1 text-xs text-green-400">
                            🕒 Thực tế: {actualHours}h
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(task)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Updated Pagination Layout - Always Show */}
        <div className="flex items-center justify-between mt-6">
          {/* Left Side: Page Size Selector and Display Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Hiển thị:</span>
              <Select
                value={pagination.pageSize.toString()}
                onValueChange={handlePageSizeChange}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pageSizeOptions.map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* <span className="text-sm text-muted-foreground">mục mỗi trang</span> */}
            </div>

            <div className="text-sm text-muted-foreground">
              {(pagination.currentPage - 1) * pagination.pageSize + 1} đến{" "}
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}{" "}
              trên tổng {pagination.totalItems} công việc
            </div>
          </div>

          {/* Right Side: Pagination Controls - Always Show */}
          <div className="flex items-center justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className={
                      pagination.currentPage <= 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {generatePaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className={
                      pagination.currentPage >= pagination.totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
