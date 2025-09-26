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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  Wrench,
  TrendingUp,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { TechnicalIssue } from "@/types/incident.type";
import { apiClient } from "@/lib/api-client";
import { useDebounce } from "@/hooks/useDebounce";
import { translateCommonStatus } from "@/utils/textTypeTask";

interface TechnicalIssueListCpnProps {
  onEditTechnicalIssue: (issue: TechnicalIssue) => void;
  onDeleteTechnicalIssue: (issue: TechnicalIssue) => void;
  onViewTechnicalIssue: (issue: TechnicalIssue) => void;
}

export interface TechnicalIssueListCpnRef {
  refetchTechnicalIssues: () => Promise<void>;
}

const TechnicalIssueListCpn = forwardRef<
  TechnicalIssueListCpnRef,
  TechnicalIssueListCpnProps
>(
  (
    { onEditTechnicalIssue, onDeleteTechnicalIssue, onViewTechnicalIssue },
    ref
  ) => {
    const [technicalIssues, setTechnicalIssues] = useState<TechnicalIssue[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    
    // ✅ Use debounce for search
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    const fetchTechnicalIssues = useCallback(async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching technical issues (page ${page}, search: "${debouncedSearchTerm}")`);
        
        const response = await apiClient.incident.getTechnicalIssues(
          page,
          pageSize,
          debouncedSearchTerm || undefined
        );

        console.log("📋 Technical Issues API response:", response);

        // ✅ Enhanced response handling for multiple possible structures
        let technicalIssuesData: TechnicalIssue[] = [];
        let totalCountValue = 0;

        if (response && typeof response === 'object') {
          const responseAny = response as any;
          // Structure 1: { extensions: { data: { data: [], totalCount: number } } }
          if (responseAny.extensions?.data?.data && Array.isArray(responseAny.extensions.data.data)) {
            technicalIssuesData = responseAny.extensions.data.data;
            totalCountValue = responseAny.extensions.data.totalCount || technicalIssuesData.length;
            console.log("✅ Using structure: extensions.data.data");
          }
          // Structure 2: { data: { data: [], totalCount: number } }
          else if (responseAny.data?.data && Array.isArray(responseAny.data.data)) {
            technicalIssuesData = responseAny.data.data;
            totalCountValue = responseAny.data.totalCount || technicalIssuesData.length;
            console.log("✅ Using structure: data.data");
          }
          // Structure 3: { data: [] } with totalCount at root
          else if (responseAny.data && Array.isArray(responseAny.data)) {
            technicalIssuesData = responseAny.data;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: data (array)");
          }
          // Structure 4: Direct array response
          else if (Array.isArray(response)) {
            technicalIssuesData = response;
            totalCountValue = technicalIssuesData.length;
            console.log("✅ Using structure: direct array");
          }
          // Structure 5: { technicalIssues: [] } (alternative field name)
          else if (responseAny.technicalIssues && Array.isArray(responseAny.technicalIssues)) {
            technicalIssuesData = responseAny.technicalIssues;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: technicalIssues field");
          }
          // Structure 6: { symptoms: [] } (possible API field name)
          else if (responseAny.symptoms && Array.isArray(responseAny.symptoms)) {
            technicalIssuesData = responseAny.symptoms;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: symptoms field");
          }
          // Structure 7: { items: [] } (pagination wrapper)
          else if (responseAny.items && Array.isArray(responseAny.items)) {
            technicalIssuesData = responseAny.items;
            totalCountValue = responseAny.totalCount || responseAny.totalItems || technicalIssuesData.length;
            console.log("✅ Using structure: items field");
          }
          else {
            console.warn("⚠️ Unrecognized response structure, attempting to find array data...");
            console.log("🔍 Response keys:", Object.keys(response));
            
            // Try to find any array in the response object
            const possibleArrays = Object.values(response).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              technicalIssuesData = possibleArrays[0] as TechnicalIssue[];
              totalCountValue = technicalIssuesData.length;
              console.log("✅ Found array data in response:", technicalIssuesData.length, "items");
            } else {
              console.error("❌ No array data found in response");
              technicalIssuesData = [];
              totalCountValue = 0;
            }
          }
        } else {
          console.error("❌ Invalid response type:", typeof response);
          technicalIssuesData = [];
          totalCountValue = 0;
        }

        // Set the extracted data
        setTechnicalIssues(technicalIssuesData);
        setTotalCount(totalCountValue);
        
        console.log(`✅ Successfully loaded ${technicalIssuesData.length} technical issues (total: ${totalCountValue})`);
        
      } catch (error) {
        console.error("❌ Failed to fetch technical issues:", error);
        toast.error("Không thể tải danh sách sự cố kỹ thuật");
        setTechnicalIssues([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }, [page, pageSize, debouncedSearchTerm]);

    useEffect(() => {
      fetchTechnicalIssues();
    }, [fetchTechnicalIssues]);

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
      refetchTechnicalIssues: fetchTechnicalIssues,
    }));

    const handleSearch = (value: string) => {
      setSearchTerm(value);
    };

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const getCommonBadgeVariant = (isCommon: boolean) => {
      return isCommon
        ? "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300"
        : "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
    };

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (loading && technicalIssues.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Đang tải sự cố kỹ thuật...
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
              Danh sách triệu chứng kỹ thuật
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Theo dõi và quản lý các triệu chứng kỹ thuật trên thiết bị trong xưởng may
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Xuất danh sách sự cố kỹ thuật
            </Button> */}
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Nhập triệu chứng kỹ thuật
            </Button>
          </div>
        </div>

        {/* ✅ Search Bar matching DeviceListCpn style */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm sự cố kỹ thuật theo tên hoặc mô tả..."
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

        {/* Technical Issues Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-semibold">Chi tiết sự cố</th>
                  <th className="px-4 py-3 text-left font-semibold">Loại</th>
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
                      <td className="px-4 py-3 text-right">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : technicalIssues.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium text-muted-foreground">
                          {searchTerm ? `Không tìm thấy sự cố kỹ thuật nào cho "${searchTerm}"` : "Không tìm thấy sự cố kỹ thuật nào"}
                        </p>
                        <p className="text-sm text-muted-foreground/80 mt-1">
                          Thử điều chỉnh tiêu chí tìm kiếm
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  technicalIssues.map((issue) => (
                    <tr key={issue.symptomCode} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {/* ✅ Name/Title at the top */}
                          <div className="font-medium text-foreground text-base">
                            {issue.name}
                          </div>
                          {/* ✅ Description below the name */}
                          <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                            {issue.description}
                          </div>
                          {/* ✅ Code at the bottom with blue color for Technical Issue */}
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium text-blue-500">
                              {issue.symptomCode}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getCommonBadgeVariant(issue.isCommon)}>
                          {issue.isCommon ? (
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
                          <TrendingUp className="h-4 w-4 text-orange-400" />
                          <span className="text-sm font-medium text-foreground">
                            {issue.occurrenceCount}x
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
                            <DropdownMenuItem onClick={() => onViewTechnicalIssue(issue)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditTechnicalIssue(issue)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => onDeleteTechnicalIssue(issue)}
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
                    {totalCount} sự cố kỹ thuật
                  </>
                ) : (
                  "Không có sự cố kỹ thuật"
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

TechnicalIssueListCpn.displayName = "TechnicalIssueListCpn";

export default TechnicalIssueListCpn;