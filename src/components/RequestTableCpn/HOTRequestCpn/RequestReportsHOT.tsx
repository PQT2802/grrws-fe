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
  Eye,
  Calendar,
  User,
  MapPin,
  List,
  Loader2,
  RotateCcw,
  Wrench,
  Archive,
  Package,
  Filter,
} from "lucide-react";
import { REQUEST_ITEM } from "@/types/dashboard.type";
import { apiClient } from "@/lib/api-client";
import {
  translateTaskStatus,
  translateTaskPriority,
} from "@/utils/textTypeTask";
import RequestDetailModalHOT from "./RequestDetailModalHOT";

type ReportTabType = "all" | "repair" | "warranty";

interface RequestReportsHOTProps {
  activeTab: ReportTabType;
  onRequestsUpdate?: (requests: REQUEST_ITEM[]) => void;
  refreshTrigger?: number;
}

interface RequestWithTasks extends REQUEST_ITEM {
  tasks?: any[];
  createdByName?: string;
}

export default function RequestReportsHOT({
  activeTab,
  onRequestsUpdate,
  refreshTrigger,
}: RequestReportsHOTProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<RequestWithTasks[]>([]);
  const [selectedRequest, setSelectedRequest] =
    useState<RequestWithTasks | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Page size options
  const pageSizeOptions = [5, 10, 20, 50];

  // Fetch creator name by user ID
  const fetchCreatorName = async (userId: string): Promise<string> => {
    try {
      const userInfo = await apiClient.user.getUserById(userId);
      return userInfo.fullName || userInfo.name || "Unknown User";
    } catch (error) {
      console.error(`Error fetching user info for ID ${userId}:`, error);
      return "Unknown User";
    }
  };

  // ✅ Updated: Fetch requests from API (removed task requirement filter)
  const fetchRequests = useCallback(
    async (page: number = 1, newPageSize?: number) => {
      setIsLoading(true);
      try {
        const currentPageSize = newPageSize || pagination.pageSize;
        console.log(
          `Fetching requests for page ${page}, size ${currentPageSize}`
        );

        const response = await apiClient.dashboard.getAllRequests(
          page,
          currentPageSize
        );
        console.log("API Response:", response);

        // Handle different possible response structures
        let requestsData: REQUEST_ITEM[] = [];

        if (response?.data?.data && Array.isArray(response.data.data)) {
          // Structure: { data: { data: REQUEST_ITEM[] } }
          requestsData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          // Structure: { data: REQUEST_ITEM[] }
          requestsData = response.data;
        } else if (Array.isArray(response)) {
          // Structure: REQUEST_ITEM[]
          requestsData = response;
        } else {
          console.error("Unexpected response structure:", response);
          throw new Error("Invalid response structure");
        }

        // ✅ Updated: Process ALL requests (not just those with tasks)
        const processedRequests = [];
        for (const request of requestsData) {
          try {
            // Try to fetch tasks for each request
            const tasks = await apiClient.request.getTaskOfRequest(request.id);
            
            // Fetch creator name
            const createdByName = await fetchCreatorName(request.createdBy);

            // Add request with tasks (even if tasks array is empty)
            processedRequests.push({
              ...request,
              tasks: tasks || [], // Include empty array if no tasks
              createdByName: createdByName,
            });
          } catch (error) {
            console.error(
              `Error fetching tasks for request ${request.id}:`,
              error
            );
            
            // ✅ Still include the request even if task fetching fails
            const createdByName = await fetchCreatorName(request.createdBy);
            processedRequests.push({
              ...request,
              tasks: [], // Empty tasks array
              createdByName: createdByName,
            });
          }
        }

        console.log(`Processed ${processedRequests.length} total requests`);
        setRequests(processedRequests);

        // Update pagination based on the response structure
        const totalCount = response?.data?.totalCount || processedRequests.length;
        const pageNumber = response?.data?.pageNumber || page;

        setPagination({
          currentPage: pageNumber,
          pageSize: currentPageSize,
          totalItems: processedRequests.length, // Use all requests count
          totalPages: Math.ceil(processedRequests.length / currentPageSize),
        });

        // Update parent component with all requests for counting
        if (onRequestsUpdate) {
          onRequestsUpdate(processedRequests);
        }
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        setRequests([]);
        setPagination({
          currentPage: 1,
          pageSize: pagination.pageSize,
          totalItems: 0,
          totalPages: 1,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [pagination.pageSize, onRequestsUpdate]
  );

  useEffect(() => {
    fetchRequests(1); // Reset to page 1 when filters change
  }, [statusFilter, priorityFilter, refreshTrigger, fetchRequests]);

  // Handle page size change
  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize);
    setPagination((prev) => ({ ...prev, pageSize: size, currentPage: 1 }));
    fetchRequests(1, size);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.totalPages) {
      fetchRequests(page);
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  // Filter requests based on active tab and search term
  const getFilteredRequests = () => {
    let filtered = requests;

    // ✅ Updated: Filter by tab (handle requests without tasks)
    if (activeTab !== "all") {
      filtered = filtered.filter((request) => {
        const tasks = request.tasks || [];
        
        // If no tasks, don't show in specific tabs (only show in "all")
        if (tasks.length === 0) {
          return false;
        }
        
        return tasks.some((task: any) => {
          const taskType = task.taskType?.toLowerCase();
          if (activeTab === "repair") {
            return taskType === "repair";
          } else if (activeTab === "warranty") {
            return (
              taskType === "warranty" ||
              taskType === "warrantysubmission" ||
              taskType === "warrantyreturn"
            );
          }
          return false;
        });
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.requestTitle.toLowerCase().includes(searchLower) ||
          request.deviceName.toLowerCase().includes(searchLower) ||
          (request.createdByName &&
            request.createdByName.toLowerCase().includes(searchLower))
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (request) => request.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by priority
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (request) =>
          request.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    // Sort by creation date (descending)
    return filtered.sort(
      (a, b) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
    );
  };

  const filteredRequests = getFilteredRequests();

  // ✅ Updated: Determine report type based on tasks (handle empty tasks)
  const getReportType = (request: RequestWithTasks) => {
    const tasks = request.tasks || [];
    
    // If no tasks, show as general request
    if (tasks.length === 0) {
      return {
        type: "general",
        label: "Chưa có báo cáo",
        icon: Package,
        color: "text-gray-400",
      };
    }
    
    const taskTypes = tasks.map((task: any) => task.taskType?.toLowerCase());

    if (
      taskTypes.includes("warranty") ||
      taskTypes.includes("warrantysubmission") ||
      taskTypes.includes("warrantyreturn")
    ) {
      return {
        type: "warranty",
        label: "Yêu cầu bảo hành",
        icon: Archive,
        color: "text-blue-400",
      };
    } else if (taskTypes.includes("repair")) {
      return {
        type: "repair",
        label: "Yêu cầu sửa chữa",
        icon: Wrench,
        color: "text-orange-400",
      };
    } else {
      return {
        type: "mixed",
        label: "Yêu cầu hỗn hợp",
        icon: Package,
        color: "text-purple-400",
      };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "approved":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "inprogress":
      case "in-progress":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "completed":
        return "bg-green-500/10 text-green-400 border-green-500/20";
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleViewDetails = (request: RequestWithTasks) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = [];
    const { currentPage, totalPages } = pagination;

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

    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-start">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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

    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-end">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

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
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Đang chờ</SelectItem>
            <SelectItem value="approved">Đã phê duyệt</SelectItem>
            <SelectItem value="rejected">Đã từ chối</SelectItem>
            <SelectItem value="inprogress">Đang thực hiện</SelectItem>
            <SelectItem value="completed">Hoàn thành</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={handleResetFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      </div>

      {/* Main Table Card */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Đang tải yêu cầu...</span>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <List className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không tìm thấy yêu cầu nào phù hợp với tiêu chí</p>
              {(searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all") && (
                <button
                  className="mt-2 text-primary underline text-sm"
                  onClick={handleResetFilters}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-medium w-[300px]">Mã yêu cầu</TableHead>
                    <TableHead className="font-medium">Người tạo</TableHead>

                    <TableHead className="font-medium w-[140px]">Trạng thái</TableHead>
                    <TableHead className="font-medium">Thiết bị</TableHead>
                    <TableHead className="font-medium">Ngày tạo</TableHead>
                    <TableHead className="font-medium">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const reportType = getReportType(request);
                    const ReportIcon = reportType.icon;

                    return (
                      <TableRow
                        key={request.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-base">
                              {request.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="font-medium text-sm">
                                {request.createdByName || "Loading..."}
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(request.status)} border-0`}
                            >
                              {translateTaskStatus(request.status)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">
                              {request.deviceName}
                            </div>
                            <div className="flex items-center gap-1 text-xs">
                              <MapPin className="h-3 w-3" />
                              {request.areaName} - {request.zoneName} (Vị trí{" "}
                              {request.positionIndex})
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>{formatDate(request.createdDate)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(request)}
                            className="text-xs"
                          >
                            Xem chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Layout */}
      {filteredRequests.length > 0 && (
        <div className="flex items-center justify-between pt-4">
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
              <span className="text-sm text-muted-foreground">
                mục mỗi trang
              </span>
            </div>

            <div className="text-sm text-muted-foreground">
              Hiển thị {(pagination.currentPage - 1) * pagination.pageSize + 1}{" "}
              đến{" "}
              {Math.min(
                pagination.currentPage * pagination.pageSize,
                pagination.totalItems
              )}{" "}
              của {pagination.totalItems} yêu cầu
            </div>
          </div>

          {/* Right Side: Pagination Controls */}
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
      )}

      {/* Detail Modal */}
      <RequestDetailModalHOT
        request={selectedRequest}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}