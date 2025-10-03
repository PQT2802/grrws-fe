"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Settings,
  Calendar,
  User,
  Clock,
  Package,
  Archive,
  Cog,
  RefreshCw,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import {
  UNIFIED_SKEEPER_REQUEST,
  MachineActionType,
} from "@/types/sparePart.type";
import { Skeleton } from "@/components/ui/skeleton";
import { translateActionType, translateTaskStatus } from "@/utils/textTypeTask";
import { useRouter } from "next/navigation";

export default function MachineRequestsTable() {
  const router = useRouter();
  const [requests, setRequests] = useState<UNIFIED_SKEEPER_REQUEST[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionTypeFilter, setActionTypeFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const fetchRequests = useCallback(
    async (page: number = 1, pageSize: number = 10) => {
      try {
        setIsLoading(true);
        console.log(
          `Fetching machine requests for page ${page}, size ${pageSize}`
        );

        // ✅ FIXED: Always exclude SparePartRequest from machine requests
        let actionTypeParam = undefined;

        if (actionTypeFilter !== "all") {
          // If specific type selected, use it (but never SparePartRequest)
          if (actionTypeFilter.toLowerCase() !== "sparepartrequest") {
            actionTypeParam = actionTypeFilter;
          } else {
            // If somehow SparePartRequest is selected, show no results
            setRequests([]);
            setPagination({
              currentPage: 1,
              pageSize,
              totalItems: 0,
              totalPages: 1,
            });
            return;
          }
        }
        // If "all" is selected, we'll filter out SparePartRequest after getting results

        const response = await apiClient.machineActionConfirmation.getAll(
          page,
          pageSize,
          false, // newest first
          statusFilter !== "all" ? statusFilter : undefined,
          actionTypeParam // This will be undefined for "all", or specific type
        );

        let machineActionData: any[] = [];
        let totalItems = 0;
        let totalPages = 1;
        let currentPage = page;

        if (response?.data?.data && Array.isArray(response.data.data)) {
          machineActionData = response.data.data;
          totalItems = response.data.totalCount || 0;
          totalPages = response.data.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
          currentPage = response.data.pageNumber || page;
        } else if (Array.isArray(response?.data)) {
          machineActionData = response.data;
          totalItems = response.totalCount || response.data.length;
          totalPages = response.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
          currentPage = response.pageNumber || page;
        } else if (Array.isArray(response)) {
          machineActionData = response;
          totalItems = response.length;
          totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        }

        // ✅ ENHANCED: Process requests with additional details
        const processedRequests = await Promise.all(
          machineActionData
            .filter((req) => {
              // ALWAYS exclude SparePartRequest from machine requests
              return req.actionType?.toLowerCase() !== "sparepartrequest";
            })
            .map(async (req) => {
              try {
                // ✅ NEW: Fetch detailed information for each request
                const detailResponse = await apiClient.machineActionConfirmation.getById(req.id);
                const detailData = detailResponse.data || detailResponse;
                
                return {
                  id: req.id,
                  type: "machineAction" as const,
                  title: req.confirmationCode,
                  description: `${safeTranslateActionType(req.actionType)} - ${
                    req.notes || "Không có ghi chú"
                  }`,
                  requestDate: detailData.createdDate || req.createdDate || req.startDate, // ✅ Use createdDate
                  status: req.status,
                  assigneeName: detailData.requestedByName || req.assigneeName, // ✅ Use requestedByName
                  actionType: req.actionType,
                  confirmationCode: req.confirmationCode,
                  mechanicConfirm: req.mechanicConfirm,
                  stockkeeperConfirm: req.stockkeeperConfirm,
                  originalData: req,
                };
              } catch (detailError) {
                console.warn(`Could not fetch details for request ${req.id}:`, detailError);
                // Fallback to original data
                return {
                  id: req.id,
                  type: "machineAction" as const,
                  title: req.confirmationCode,
                  description: `${safeTranslateActionType(req.actionType)} - ${
                    req.notes || "Không có ghi chú"
                  }`,
                  requestDate: req.createdDate || req.startDate,
                  status: req.status,
                  assigneeName: req.assigneeName,
                  actionType: req.actionType,
                  confirmationCode: req.confirmationCode,
                  mechanicConfirm: req.mechanicConfirm,
                  stockkeeperConfirm: req.stockkeeperConfirm,
                  originalData: req,
                };
              }
            })
        );

        console.log(
          `Processed machine data: ${processedRequests.length} items, ${totalItems} total, ${totalPages} pages`
        );

        setRequests(processedRequests);

        // ✅ FIXED: Recalculate pagination based on filtered results
        const filteredTotal = processedRequests.length;
        const recalculatedPages = Math.max(1, Math.ceil(filteredTotal / pageSize));

        setPagination({
          currentPage,
          pageSize,
          totalItems: filteredTotal, // Use filtered count
          totalPages: recalculatedPages, // Use recalculated pages
        });
      } catch (error) {
        console.error("Failed to fetch machine requests:", error);
        toast.error("Không thể tải danh sách yêu cầu thiết bị");

        setRequests([]);
        setPagination({
          currentPage: 1,
          pageSize,
          totalItems: 0,
          totalPages: 1,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [statusFilter, actionTypeFilter]
  );

  useEffect(() => {
    fetchRequests(1, pagination.pageSize);
  }, [statusFilter, actionTypeFilter, pagination.pageSize, fetchRequests]);

  // Safe translation functions
  const safeTranslateTaskStatus = (status: string) => {
    try {
      return translateTaskStatus(status || "unknown");
    } catch (error) {
      console.error("Error translating status:", error);
      return status || "Unknown";
    }
  };

  const safeTranslateActionType = (actionType: string) => {
    try {
      return translateActionType(actionType || "unknown");
    } catch (error) {
      console.error("Error translating action type:", error);
      return actionType || "Unknown";
    }
  };

  // Helper function to get status in Vietnamese
  const getVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      PENDING: "Đang chờ xử lý",
      APPROVED: "Đã duyệt",
      CONFIRMED: "Đã xác nhận",
      INPROGRESS: "Đang thực hiện",
      COMPLETED: "Hoàn thành",
      CANCELLED: "Đã hủy",
      REJECTED: "Đã từ chối",
    };
    return statusMap[status.toUpperCase()] || status;
  };

  // Helper function to format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      return "Trên 1 ngày";
    }
  };

  const getActionTypeIcon = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case "stockout":
        return <Package className="h-4 w-4 text-red-500" />;
      case "stockin":
        return <Archive className="h-4 w-4 text-green-500" />;
      case "installation":
        return <Cog className="h-4 w-4 text-blue-500" />;
      case "warrantysubmission":
        return <RefreshCw className="h-4 w-4 text-orange-500" />;
      default:
        return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeColor = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case "stockout":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "stockin":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "installation":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "warrantysubmission":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  // Get unique statuses and action types for filter dropdown
  const availableStatuses = useMemo(() => {
    return [...new Set(requests.map((req) => req.status))];
  }, [requests]);

  const availableActionTypes = useMemo(() => {
    return [...new Set(requests.map((req) => req.actionType).filter(Boolean))];
  }, [requests]);

  // Filter requests based on search, status, action type, and date range
  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const matchesSearch =
        searchTerm === "" ||
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [requests, searchTerm]);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (pagination.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      } else if (pagination.currentPage >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (
          let i = pagination.totalPages - 3;
          i <= pagination.totalPages;
          i++
        ) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (
          let i = pagination.currentPage - 1;
          i <= pagination.currentPage + 1;
          i++
        ) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(pagination.totalPages);
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    fetchRequests(page, pagination.pageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    console.log(`Changing page size to ${pageSize}`);
    fetchRequests(1, pageSize);
  };

  const handleViewRequest = async (request: UNIFIED_SKEEPER_REQUEST) => {
    try {
      console.log(
        `Navigating to machine request detail with ID: ${request.id}`
      );
      router.push(`./requests/${request.id}/machine?tab=machines`);
    } catch (error) {
      console.error("Failed to navigate to request details:", error);
      toast.error("Không thể mở chi tiết yêu cầu");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "approved":
      case "inprogress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "cancelled":
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setActionTypeFilter("all");
    setFromDate("");
    setToDate("");
  };

  // Update filter change handlers
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRequests(1, pagination.pageSize);
  };

  const handleActionTypeChange = (actionType: string) => {
    setActionTypeFilter(actionType);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    fetchRequests(1, pagination.pageSize);
  };

  return (
    <div className="space-y-6">
      {/* Filters - NO BORDER - Single Row */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search Box - Reduced Width */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Action Type Filter */}
          <Select
            value={actionTypeFilter}
            onValueChange={handleActionTypeChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {availableActionTypes
                .filter((actionType) => actionType)
                .map((actionType) => (
                  <SelectItem key={actionType} value={actionType!}>
                    {safeTranslateActionType(actionType!)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {availableStatuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {getVietnameseStatus(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range - Compact */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">Từ:</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-36"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">
              Đến:
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-36"
            />
          </div>

          {/* Clear Filters Button */}
          <Button variant="outline" onClick={clearFilters} className="shrink-0">
            <Filter className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </div>

      {/* Requests Table */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Danh sách yêu cầu thiết bị
            <Badge variant="secondary">{filteredRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Không có yêu cầu thiết bị nào
              </p>
              {(searchTerm ||
                statusFilter !== "all" ||
                actionTypeFilter !== "all" ||
                fromDate ||
                toDate) && (
                <button
                  className="mt-2 text-primary underline text-sm"
                  onClick={clearFilters}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-200">
                    <th className="px-4 py-3 text-left font-medium w-[400px]">
                      Mã xác nhận
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Loại hành động
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Ngày yêu cầu
                    </th>
                    {/* <th className="px-4 py-3 text-left font-medium">
                      Người thực hiện
                    </th> */}
                    <th className="px-4 py-3 text-left font-medium">
                      Trạng thái
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => {
                    const requestDate = new Date(request.requestDate);
                    const timeString = requestDate.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const relativeTime = getRelativeTime(request.requestDate);

                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{request.title}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {request.actionType &&
                              getActionTypeIcon(request.actionType)}
                            <Badge
                              className={
                                request.actionType
                                  ? getActionTypeColor(request.actionType)
                                  : "bg-gray-100 text-gray-800"
                              }
                            >
                              {request.actionType
                                ? safeTranslateActionType(request.actionType)
                                : "N/A"}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {requestDate.toLocaleDateString("vi-VN")}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>
                              {timeString} • {relativeTime}
                            </span>
                          </div>
                        </td>
                        {/* <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span
                              className={`${
                                !request.assigneeName ||
                                request.assigneeName.trim() === ""
                                  ? "text-gray-400 italic"
                                  : ""
                              }`}
                            >
                              {request.assigneeName ||
                                "Chưa có người thực hiện"}
                            </span>
                          </div>
                        </td> */}
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(request.status)}>
                            {getVietnameseStatus(request.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                            className="text-xs"
                          >
                            Xem chi tiết
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị
                </span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) =>
                    handlePageSizeChange(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  trên tổng số {pagination.totalItems} mục
                </span>
              </div>

              <div className="flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          pagination.currentPage > 1 &&
                          handlePageChange(pagination.currentPage - 1)
                        }
                        className={
                          pagination.currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {pagination.totalPages > 1 ? (
                      generatePageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === "ellipsis" ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={pagination.currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))
                    ) : (
                      <PaginationItem>
                        <PaginationLink
                          isActive={true}
                          className="cursor-default"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          pagination.currentPage < pagination.totalPages &&
                          handlePageChange(pagination.currentPage + 1)
                        }
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
        </CardContent>
      </Card>
    </div>
  );
}
