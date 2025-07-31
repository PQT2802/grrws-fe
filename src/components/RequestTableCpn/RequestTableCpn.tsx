"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import {
  ColumnDef,
  useReactTable,
  getPaginationRowModel,
  getCoreRowModel,
  flexRender,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { REQUEST_SUMMARY } from "@/types/request.type";
import { REQUEST_ITEM } from "@/types/dashboard.type";
import {
  ArrowDown,
  ArrowUp,
  Eye,
  Search,
  Filter,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { translateTaskStatus, translateTaskPriority } from "@/utils/textTypeTask";
import { apiClient } from "@/lib/api-client";

interface RequestTableCpnProps {
  requestSummary: REQUEST_SUMMARY | null;
  loading: boolean;
}

const RequestTableCpn = ({ requestSummary, loading }: RequestTableCpnProps) => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();

  // Extract workspaceId based on current route
  let workspaceId: string;

  if (pathname?.includes("/workspace/") && params?.["workspace-id"]) {
    workspaceId = params["workspace-id"] as string;
  } else {
    workspaceId = "";
  }

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "requestDate",
      desc: true,
    },
  ]);

  // State for enhanced data from API like in template
  const [enhancedRequests, setEnhancedRequests] = useState<REQUEST_ITEM[]>([]);
  const [userCache, setUserCache] = useState<{ [userId: string]: string }>({});
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

  // Convert single request summary to array format for table
  const tableData = useMemo(() => {
    if (!requestSummary) {
      return [];
    }

    if (Array.isArray(requestSummary)) {
      return requestSummary;
    }

    return [requestSummary];
  }, [requestSummary]);

  // Use enhanced data if available, otherwise fall back to original data
  const displayData = enhancedRequests.length > 0 ? enhancedRequests : tableData;

  // Fetch user name by ID
  const fetchUserNameById = async (userId: string): Promise<string> => {
    if (!userId || userCache[userId]) {
      return userCache[userId] || 'Không xác định';
    }

    try {
      const userResponse = await apiClient.user.getUserById(userId);
      const userName = userResponse.data?.fullName || userResponse.fullName || 'Người dùng không rõ';
      
      // Cache the result
      setUserCache(prev => ({
        ...prev,
        [userId]: userName
      }));
      
      return userName;
    } catch (error) {
      console.error(`Failed to fetch user ${userId}:`, error);
      const fallbackName = 'Người dùng không rõ';
      
      // Cache the fallback result to avoid repeated failed requests
      setUserCache(prev => ({
        ...prev,
        [userId]: fallbackName
      }));
      
      return fallbackName;
    }
  };

  // Fetch enhanced data like in template (with creator info and issue descriptions)
  const fetchEnhancedData = async () => {
    try {
      setIsLoadingEnhanced(true);
      const response = await apiClient.dashboard.getAllRequests(1, 100); // Get more data for better display
      
      if (response?.data && Array.isArray(response.data)) {
        setEnhancedRequests(response.data);
        
        // Fetch user names for all unique user IDs
        const userIds = [...new Set(response.data.map((req: REQUEST_ITEM) => req.createdBy).filter(Boolean))];
        
        // Fetch user names in parallel
        const userNamePromises = userIds.map(async (userId) => {
          const userName = await fetchUserNameById(userId);
          return { userId, userName };
        });
        
        const userNameResults = await Promise.allSettled(userNamePromises);
        const newUserCache: { [userId: string]: string } = { ...userCache };
        
        userNameResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            newUserCache[result.value.userId] = result.value.userName;
          } else {
            // Fallback for failed requests
            newUserCache[userIds[index]] = 'Người dùng không rõ';
          }
        });
        
        setUserCache(newUserCache);
      }
    } catch (error) {
      console.error("Failed to fetch enhanced request data:", error);
      // Fall back to original data on error
    } finally {
      setIsLoadingEnhanced(false);
    }
  };

  // Fetch enhanced data on component mount
  useEffect(() => {
    if (requestSummary && !loading) {
      fetchEnhancedData();
    }
  }, [requestSummary, loading]);

  // Safe translation functions
  const safeTranslateTaskStatus = (status: string) => {
    try {
      return translateTaskStatus(status || 'unknown');
    } catch (error) {
      console.error('Error translating status:', error);
      return status || 'Không xác định';
    }
  };

  const safeTranslateTaskPriority = (priority: string) => {
    try {
      return translateTaskPriority(priority || 'medium');
    } catch (error) {
      console.error('Error translating priority:', error);
      return priority || 'Trung bình';
    }
  };

  // Get unique statuses and priorities for filter dropdowns
  const availableStatuses = useMemo(() => {
    return [...new Set(displayData.map(req => req.status).filter(Boolean))];
  }, [displayData]);

  const availablePriorities = useMemo(() => {
    return [...new Set(displayData.map(req => req.priority).filter(Boolean))];
  }, [displayData]);

  const filteredData = useMemo(() => {
    return displayData.filter((request) => {
      const title = request.requestTitle || request.title || "";
      const matchesSearch = title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || request.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [displayData, search, statusFilter, priorityFilter]);

  const handleViewDetail = (request: REQUEST_SUMMARY | REQUEST_ITEM) => {
    if (!workspaceId) {
      toast.error("Không thể điều hướng: không xác định được workspace");
      return;
    }

    const requestId = 'requestId' in request ? request.requestId : request.id;
    router.push(`/workspace/${workspaceId}/requests/${requestId}`);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const timeString = date.toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      const dateTimeString = date.toLocaleDateString('vi-VN') + ' ' + timeString;
      
      // Calculate relative time
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      let relativeTime = '';
      
      if (diffInHours < 1) {
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
        relativeTime = `${diffInMinutes} phút trước`;
      } else if (diffInHours < 24) {
        relativeTime = `${diffInHours} giờ trước`;
      } else {
        relativeTime = "Trên 1 ngày";
      }
      
      return `${dateTimeString} • ${relativeTime}`;
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateString;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'inprogress':
      case 'in progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <AlertTriangle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const columns: ColumnDef<any>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Chọn tất cả"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Chọn hàng"
        />
      ),
    },
    {
      accessorKey: "requestTitle",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium text-base" // Made text bigger
          >
            Tiêu đề yêu cầu
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const request = row.original;
        return (
          <div>
            <div className="font-medium text-base"> {/* Made title bigger */}
              {request.requestTitle || 'Yêu cầu không có tiêu đề'}
            </div>
            <div className="text-sm text-muted-foreground"> {/* Increased subtitle size */}
              {/* Show device info and issues like in template */}
              {request.deviceName && request.deviceCode ? (
                <span>{request.deviceName} • {request.deviceCode}</span>
              ) : (
                <span>ID: {request.requestId || request.id}</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Người tạo",
      cell: ({ row }) => {
        const request = row.original;
        const createdBy = request.createdBy || request.requestedBy || request.submittedBy;
        
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <div className="font-medium text-sm">
                {/* Display user name from cache, falling back to user ID if name not available */}
                {userCache[createdBy] || createdBy || 'Không xác định'}
              </div>
              {/* Show issue count like in template if available */}
              {request.issues && Array.isArray(request.issues) && (
                <div className="text-xs text-muted-foreground">
                  {request.issues.length} vấn đề
                </div>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Độ ưu tiên",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string;
        if (!priority) return <span className="text-gray-400">---</span>;

        return (
          <Badge 
            variant="secondary" 
            className={`${getPriorityColor(priority)} border-0`}
          >
            {safeTranslateTaskPriority(priority)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        if (!status) return <span className="text-gray-400">---</span>;

        return (
          <div className="flex items-center gap-2">
            {getStatusIcon(status)}
            <Badge 
              variant="secondary" 
              className={`${getStatusColor(status)} border-0`}
            >
              {safeTranslateTaskStatus(status)}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "requestDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium"
          >
            Ngày tạo
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : null}
          </Button>
        );
      },
      cell: ({ row }) => {
        const request = row.original;
        const dateValue = request.requestDate || request.createdDate;
        if (!dateValue) return <span className="text-gray-400">---</span>;

        return (
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div className="text-sm">
              {formatDate(dateValue)}
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Thao tác",
      cell: ({ row }) => {
        const request = row.original;

        return (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewDetail(request)}
            className="h-8 w-8 p-0"
            title="Xem chi tiết"
          >
            <Eye className="h-4 w-4" />
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting: sorting,
      pagination: {
        pageIndex: pageIndex,
        pageSize: pageSize,
      },
      rowSelection,
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
  });

  if (!requestSummary) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 dark:text-gray-400 text-lg">
          Không có dữ liệu yêu cầu
        </div>
        <div className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Các yêu cầu sẽ xuất hiện ở đây khi có sẵn
        </div>
      </div>
    );
  }

  if (loading || isLoadingEnhanced) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <span className="text-gray-500">Đang tải yêu cầu...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Section - Exactly matching template filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo độ ưu tiên" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả độ ưu tiên</SelectItem>
            {availablePriorities.map(priority => (
              <SelectItem key={priority} value={priority}>
                {safeTranslateTaskPriority(priority)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {availableStatuses.map(status => (
              <SelectItem key={status} value={status}>
                {safeTranslateTaskStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={clearFilters}>
          <Filter className="mr-2 h-4 w-4" />
          Xóa bộ lọc
        </Button>
      </div>

      {/* Main Table - Clean without borders/titles */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-muted/30">
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="font-medium">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/20 transition-colors"
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      <div className="flex flex-col items-center justify-center py-8">
                        <FileText className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">Không có yêu cầu nào được tìm thấy</p>
                        {(search || statusFilter !== 'all' || priorityFilter !== 'all') && (
                          <button
                            className="mt-2 text-primary underline text-sm"
                            onClick={clearFilters}
                          >
                            Xóa tất cả bộ lọc
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination - No border */}
      {filteredData.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {`${Object.keys(rowSelection).length} trong số ${filteredData.length} hàng được chọn`}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Hiển thị
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value: string) => {
                  setPageSize(Number(value));
                  setPageIndex(0);
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
              <span className="text-sm text-gray-600 dark:text-gray-400">
                trên tổng số {filteredData.length} mục
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
                disabled={pageIndex === 0}
              >
                Trước
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: table.getPageCount() }, (_, index) => (
                  <Button
                    key={index}
                    variant={index === pageIndex ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPageIndex(index)}
                    className="w-8 h-8 p-0"
                  >
                    {index + 1}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageIndex(Math.min(table.getPageCount() - 1, pageIndex + 1))}
                disabled={pageIndex >= table.getPageCount() - 1}
              >
                Tiếp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestTableCpn;