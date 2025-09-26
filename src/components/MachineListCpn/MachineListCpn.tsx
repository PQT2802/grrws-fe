"use client";

import {
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
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
  Loader2,
  Settings,
  Factory,
  Calendar,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { MACHINE_WEB } from "@/types/device.type";
import ExcelImportModal from "@/components/ExcelImportModal/ExcelImportModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";

interface MachineListCpnProps {
  onEditMachine?: (machine: MACHINE_WEB) => void;
  onDeleteMachine?: (machine: MACHINE_WEB) => void;
  onViewMachine?: (machine: MACHINE_WEB) => void;
}

// Add ref interface for parent component access
export interface MachineListCpnRef {
  refetchMachines: () => Promise<void>;
}

const MachineListCpn = forwardRef<MachineListCpnRef, MachineListCpnProps>(
  ({ onEditMachine, onDeleteMachine, onViewMachine }, ref) => {
    const { user } = useAuth();
    const [machines, setMachines] = useState<MACHINE_WEB[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 1000);

    // ✅ Check if user has access - Both Admin and Stock Keeper can access
    const hasFullAccess =
      user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STOCK_KEEPER;

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    };

    // ✅ Vietnamese status translations
    const getStatusDisplayText = (status: string) => {
      switch (status?.toLowerCase()) {
        case "active":
          return "Hoạt động";
        case "discontinued":
          return "Ngừng sản xuất";
        default:
          return status;
      }
    };

    // Status badge colors for machine status
    const getStatusBadgeVariant = (status: string) => {
      switch (status?.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
        case "discontinued":
          return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
      }
    };

    // Get device count badge variant
    const getDeviceCountBadgeVariant = (deviceCount: number) => {
      if (deviceCount === 0) {
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
      } else if (deviceCount <= 5) {
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      } else if (deviceCount <= 10) {
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      } else {
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      }
    };

    // Fetch machines from API
    const fetchMachines = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(
          `🔄 Đang tải máy (trang ${page}, kích thước ${pageSize})...`
        );

        const response = await apiClient.machine.getMachines(page, pageSize);
        console.log("📦 Phản hồi API máy:", response);

        // Handle different response structures
        let machinesData: MACHINE_WEB[] = [];
        let total = 0;

        if (response && typeof response === "object") {
          // Case 1: Direct array response
          if (Array.isArray(response)) {
            machinesData = response;
            total = response.length;
          } else if (
            (response as any).data &&
            Array.isArray((response as any).data)
          ) {
            machinesData = (response as any).data;
            total =
              (response as any).totalCount || (response as any).data.length;
          } else if (
            (response as any).data &&
            (response as any).data.data &&
            Array.isArray((response as any).data.data)
          ) {
            machinesData = (response as any).data.data;
            total =
              (response as any).data.totalCount ||
              (response as any).data.data.length;
          } else {
            console.error("❌ Cấu trúc phản hồi không mong đợi:", response);
            throw new Error("Cấu trúc phản hồi API không mong đợi");
          }
        } else {
          throw new Error("Phản hồi API không hợp lệ");
        }

        console.log(
          `📊 Đã trích xuất: ${machinesData.length} máy, tổng: ${total}`
        );

        // Apply client-side filtering if needed
        let filteredMachines = machinesData;

        // Apply search filter
        if (debouncedSearchTerm) {
          filteredMachines = filteredMachines.filter(
            (machine) =>
              machine.machineName
                ?.toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase()) ||
              machine.machineCode
                ?.toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase()) ||
              machine.model
                ?.toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase()) ||
              machine.manufacturer
                ?.toLowerCase()
                .includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Apply status filter
        if (filterStatus !== "all") {
          filteredMachines = filteredMachines.filter(
            (machine) =>
              machine.status?.toLowerCase() === filterStatus.toLowerCase()
          );
        }

        setMachines(filteredMachines);
        setTotalCount(total);
        console.log("✅ Máy đã được xử lý thành công");
      } catch (error: any) {
        console.error("❌ Lỗi khi tải máy:", error);
        setError(`Không thể tải máy: ${error.message || "Lỗi không xác định"}`);
        setMachines([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }, [page, pageSize, debouncedSearchTerm, filterStatus]);

    // Expose refetch method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetchMachines: fetchMachines,
      }),
      [fetchMachines]
    );

    useEffect(() => {
      fetchMachines();
    }, [fetchMachines]);

    // Reset to page 1 when search/filter/pageSize changes
    useEffect(() => {
      if (page !== 1 && (debouncedSearchTerm || filterStatus !== "all")) {
        setPage(1);
      }
    }, [debouncedSearchTerm, filterStatus, page]);

    // Reset to page 1 when page size changes
    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    // ✅ Import handler - Available for both Admin and Stock Keeper
    const handleImportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("Bạn không có quyền nhập máy");
        return;
      }
      setShowImportModal(true);
    }, [hasFullAccess]);

    const handleImportModalClose = useCallback(() => {
      setShowImportModal(false);
    }, []);

    // Handle file import
    const handleFileImport = useCallback(
      async (file: File) => {
        if (!hasFullAccess) {
          toast.error("Bạn không có quyền nhập máy");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        console.log(`📂 Đang nhập tệp máy: ${file.name}`);

        await apiClient.machine.importMachine(formData);

        // Refresh the machine list
        await fetchMachines();
      },
      [fetchMachines, hasFullAccess]
    );

    const handleViewMachine = useCallback(
      (machine: MACHINE_WEB) => {
        if (onViewMachine) {
          onViewMachine(machine);
        } else {
          toast.info("Chức năng xem sẽ được triển khai khi cần thiết.");
        }
      },
      [onViewMachine]
    );

    const handleEditMachine = useCallback(
      (machine: MACHINE_WEB) => {
        if (!hasFullAccess) {
          toast.warning("Bạn không có quyền chỉnh sửa máy");
          return;
        }
        if (onEditMachine) {
          onEditMachine(machine);
        } else {
          toast.info("Chức năng chỉnh sửa sẽ được triển khai khi API có sẵn.");
        }
      },
      [onEditMachine, hasFullAccess]
    );

    const handleDeleteMachine = useCallback(
      (machine: MACHINE_WEB) => {
        if (!hasFullAccess) {
          toast.warning("Bạn không có quyền xóa máy");
          return;
        }
        if (onDeleteMachine) {
          onDeleteMachine(machine);
        } else {
          toast.info("Chức năng xóa sẽ được triển khai khi API có sẵn.");
        }
      },
      [onDeleteMachine, hasFullAccess]
    );

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const totalPages = Math.ceil(totalCount / pageSize);

    // Loading state
    if (isLoading && machines.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải máy...</span>
          </CardContent>
        </Card>
      );
    }

    // Error state
    if (error) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8 text-center">
            <div>
              <p className="text-red-500 mb-2">{error}</p>
              <p className="text-sm text-gray-500 mb-4">
                Kiểm tra bảng điều khiển trình duyệt để biết thông tin lỗi chi
                tiết.
              </p>
              <button
                onClick={() => fetchMachines()}
                className="text-blue-500 underline text-sm"
              >
                Thử lại
              </button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Danh sách loại máy</h1>
          {hasFullAccess && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Nhập máy
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã, mẫu hoặc nhà sản xuất..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">
                  Đang tìm...
                </span>
              )}
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="discontinued">Ngừng sản xuất</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Machine Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">Tên máy</th>
                  <th className="px-4 py-3 text-left">Mẫu & Nhà sản xuất</th>
                  <th className="px-4 py-3 text-left">Thiết bị liên kết</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Ngày phát hành</th>
                  <th className="w-[100px] px-4 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <tr
                      key={`skeleton-${index}`}
                      className="border-b animate-pulse"
                    >
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : machines.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy máy
                    </td>
                  </tr>
                ) : (
                  machines.map((machine) => (
                    <tr key={machine.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{machine.machineName}</div>
                        <div className="text-sm text-muted-foreground">
                          {machine.machineCode || "N/A"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <div>
                            <div className="text-sm font-medium">
                              {machine.model || "N/A"}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Factory className="h-3 w-3" />
                              {machine.manufacturer || "Không rõ"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`${getDeviceCountBadgeVariant(
                            machine.deviceIds?.length || 0
                          )} border-0`}
                        >
                          {machine.deviceIds?.length || 0} thiết bị
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeVariant(
                            machine.status
                          )} border-0`}
                        >
                          {getStatusDisplayText(machine.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(machine.releaseDate)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewMachine(machine)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {hasFullAccess && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleEditMachine(machine)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Sửa máy
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteMachine(machine)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa máy
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Hiển thị:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
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
                    {totalCount} máy
                  </>
                ) : (
                  "Không có máy"
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
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={page >= totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ✅ Import Modal - Available for both Admin and Stock Keeper */}
        {hasFullAccess && (
          <ExcelImportModal
            isOpen={showImportModal}
            onClose={handleImportModalClose}
            onImport={handleFileImport}
            title="Nhập máy từ Excel"
            successMessage="Nhập máy thành công"
          />
        )}
      </div>
    );
  }
);

MachineListCpn.displayName = "MachineListCpn";

export default MachineListCpn;
