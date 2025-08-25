"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Loader2,
  Bug,
  TrendingUp,
  CheckCircle2,
  Clock,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorIncident } from "@/types/incident.type";
import { apiClient } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { 
  translateCommonStatus, 
  translateSeverity
} from "@/utils/textTypeTask";

interface ErrorListCpnProps {
  onEditError: (error: ErrorIncident) => void;
  onDeleteError: (error: ErrorIncident) => void;
  onViewError: (error: ErrorIncident) => void;
}

export interface ErrorListCpnRef {
  refetchErrors: () => Promise<void>;
}

const ErrorListCpn = forwardRef<ErrorListCpnRef, ErrorListCpnProps>(
  ({ onEditError, onDeleteError, onViewError }, ref) => {
    const [errors, setErrors] = useState<ErrorIncident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    
    // ✅ Use debounce for search
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchErrors = useCallback(async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching errors (page ${page}, search: "${debouncedSearchTerm}")`);
        
        const response = await apiClient.incident.getErrors(
          page,
          pageSize,
          debouncedSearchTerm || undefined
        );

        console.log("📋 Errors API response:", response);

        // ✅ Enhanced response handling for multiple possible structures
        let errorsData: ErrorIncident[] = [];
        let totalCountValue = 0;

        if (response && typeof response === 'object') {
          const responseAny = response as any;
          // Structure 1: { extensions: { data: { data: [], totalCount: number } } }
          if (responseAny.extensions?.data?.data && Array.isArray(responseAny.extensions.data.data)) {
            errorsData = responseAny.extensions.data.data;
            totalCountValue = responseAny.extensions.data.totalCount || errorsData.length;
            console.log("✅ Using structure: extensions.data.data");
          }
          // Structure 2: { data: { data: [], totalCount: number } }
          else if (responseAny.data?.data && Array.isArray(responseAny.data.data)) {
            errorsData = responseAny.data.data;
            totalCountValue = responseAny.data.totalCount || errorsData.length;
            console.log("✅ Using structure: data.data");
          }
          // Structure 3: { data: [] } with totalCount at root
          else if (responseAny.data && Array.isArray(responseAny.data)) {
            errorsData = responseAny.data;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || errorsData.length;
            console.log("✅ Using structure: data (array)");
          }
          // Structure 4: Direct array response
          else if (Array.isArray(response)) {
            errorsData = response;
            totalCountValue = errorsData.length;
            console.log("✅ Using structure: direct array");
          }
          // Structure 5: { errors: [] } (alternative field name)
          else if (responseAny.errors && Array.isArray(responseAny.errors)) {
            errorsData = responseAny.errors;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || errorsData.length;
            console.log("✅ Using structure: errors field");
          }
          // Structure 6: { items: [] } (pagination wrapper)
          else if (responseAny.items && Array.isArray(responseAny.items)) {
            errorsData = responseAny.items;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || errorsData.length;
            console.log("✅ Using structure: items field");
          }
          else {
            console.warn("⚠️ Unrecognized response structure, attempting to find array data...");
            console.log("🔍 Response keys:", Object.keys(response));
            
            // Try to find any array in the response object
            const possibleArrays = Object.values(response).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              errorsData = possibleArrays[0] as ErrorIncident[];
              totalCountValue = errorsData.length;
              console.log("✅ Found array data in response:", errorsData.length, "items");
            } else {
              console.error("❌ No array data found in response");
              errorsData = [];
              totalCountValue = 0;
            }
          }
        } else {
          console.error("❌ Invalid response type:", typeof response);
          errorsData = [];
          totalCountValue = 0;
        }

        // Set the extracted data
        setErrors(errorsData);
        setTotalCount(totalCountValue);
        
        console.log(`✅ Successfully loaded ${errorsData.length} errors (total: ${totalCountValue})`);
        
      } catch (error) {
        console.error("❌ Failed to fetch errors:", error);
        toast.error("Không thể tải danh sách lỗi");
        setErrors([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, [page, pageSize, debouncedSearchTerm]);

    useEffect(() => {
      fetchErrors();
    }, [fetchErrors]);

    // ✅ Reset to page 1 when search term or page size changes
    useEffect(() => {
      if (page !== 1 && debouncedSearchTerm) {
        setPage(1);
      }
    }, [debouncedSearchTerm]);

    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    useImperativeHandle(ref, () => ({
      refetchErrors: fetchErrors,
    }));

    const handleSearch = (value: string) => {
      setSearchTerm(value);
    };

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const getSeverityColor = (severity: string) => {
      switch (severity?.toLowerCase()) {
        case "critical":
          return "bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/20 dark:text-red-300";
        case "high":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "medium":
          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300";
        case "low":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    const getCommonBadgeVariant = (isCommon: boolean) => {
      return isCommon
        ? "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300"
        : "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (loading && errors.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Đang tải lỗi...
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Lỗi thiết bị
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Giám sát và quản lý lỗi thiết bị trong xưởng may
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất danh sách lỗi
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Nhập lỗi
            </Button>
          </div>
        </div>

        {/* ✅ Search Bar matching DeviceListCpn style */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm lỗi theo mã, tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">
                  Đang tìm...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Error Logs Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Chi tiết lỗi</th>
                  <th className="px-4 py-3 text-left font-semibold">Mức độ nghiêm trọng</th>
                  <th className="px-4 py-3 text-left font-semibold">Loại</th>
                  <th className="px-4 py-3 text-left font-semibold">Thời gian sửa chữa</th>
                  <th className="px-4 py-3 text-left font-semibold">Số lần xuất hiện</th>
                  <th className="w-[100px] px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr key={`skeleton-${index}`} className="border-b animate-pulse">
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : errors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Bug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          {searchTerm ? `Không tìm thấy lỗi nào cho "${searchTerm}"` : "Không tìm thấy lỗi nào"}
                        </p>
                        <p className="text-sm text-muted-foreground/80 mt-1">
                          Thử điều chỉnh tiêu chí tìm kiếm
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  errors.map((error) => (
                    <tr key={error.errorCode} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {/* ✅ Name/Title at the top */}
                          <div className="font-medium text-foreground text-base">
                            {error.name}
                          </div>
                          {/* ✅ Description below the name */}
                          <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                            {error.description}
                          </div>
                          {/* ✅ Code at the bottom with orange color for Error */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-orange-500">
                              {error.errorCode}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getSeverityColor(error.severity)}>
                          {translateSeverity(error.severity)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getCommonBadgeVariant(error.isCommon)}>
                          {error.isCommon ? (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              {translateCommonStatus(true)}
                            </>
                          ) : (
                            <>
                              <Clock className="h-3 w-3 mr-1" />
                              {translateCommonStatus(false)}
                            </>
                          )}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-blue-400" />
                          <span className="text-sm text-foreground">
                            {error.estimatedRepairTime}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-medium text-foreground">
                            {error.occurrenceCount}x
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewError(error)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditError(error)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Cập nhật trạng thái
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteError(error)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ✅ DeviceListCpn-style Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Hiển thị:</span>
                <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500">
                {totalCount > 0 ? (
                  <>
                    {(page - 1) * pageSize + 1}-
                    {Math.min(page * pageSize, totalCount)} trong số{" "}
                    {totalCount} lỗi
                  </>
                ) : (
                  "Không có lỗi"
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Trang {page} trong số {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={page >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ErrorListCpn.displayName = "ErrorListCpn";

export default ErrorListCpn;