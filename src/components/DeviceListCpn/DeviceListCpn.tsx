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
  Download,
  Plus,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { DEVICE_WEB } from "@/types/device.type";
import OperationStatsCpn from "../ChartCpn/OperationStatsCpn";
import EnhancedExcelImportModal from "@/components/ExcelImportModal/EnhancedExcelImportModal";
import DeviceExportModal from "@/components/DeviceCpn/DeviceExportModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";

type DeviceStatus =
  | "Active"
  | "Inactive"
  | "InUse"
  | "InRepair"
  | "InWarranty"
  | "Decommissioned";

interface DeviceListCpnProps {
  onCreateDevice?: () => void;
  onEditDevice?: (device: DEVICE_WEB) => void;
  onDeleteDevice?: (device: DEVICE_WEB) => void;
  onViewDevice?: (device: DEVICE_WEB) => void;
  onCreateTask?: (device: DEVICE_WEB) => void;
  showCreateTaskButton?: boolean;
}

export interface DeviceListCpnRef {
  refetchDevices: () => Promise<void>;
}

const DeviceListCpn = forwardRef<DeviceListCpnRef, DeviceListCpnProps>(
  (
    {
      onCreateDevice,
      onEditDevice,
      onDeleteDevice,
      onViewDevice,
      onCreateTask,
      showCreateTaskButton,
    },
    ref
  ) => {
    const { user } = useAuth();
    const [devices, setDevices] = useState<DEVICE_WEB[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const hasFullAccess =
      user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STOCK_KEEPER;

    const debouncedSearchTerm = useDebounce(searchTerm, 1000);

    // Manage body scroll for modals in this component
    useEffect(() => {
      if (showImportModal || showExportModal) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "auto";
      }
      return () => {
        document.body.style.overflow = "auto";
      };
    }, [showImportModal, showExportModal]);

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    };

    const getStatusDisplayText = (status: string) => {
      switch (status?.toLowerCase()) {
        case "active":
          return "Hoạt động";
        case "inactive":
          return "Không hoạt động";
        case "inuse":
          return "Đang sử dụng";
        case "inrepair":
          return "Đang sửa chữa";
        case "inwarranty":
          return "Đang bảo hành";
        case "decommissioned":
          return "Ngừng sử dụng";
        default:
          return status;
      }
    };

    const getStatusBadgeVariant = (status: string) => {
      switch (status?.toLowerCase()) {
        case "active":
          return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
        case "inactive":
          return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
        case "inuse":
          return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
        case "inrepair":
          return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
        case "inwarranty":
          return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400";
        case "decommissioned":
          return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
        default:
          return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
      }
    };

    const getWarrantyBadgeVariant = (isUnderWarranty: boolean) => {
      return isUnderWarranty
        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    };

    // Server-side search and filter
    const fetchDevices = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build filters for API
        const filters: {
          deviceName?: string;
          deviceCode?: string;
          status?: string;
        } = {};

        if (debouncedSearchTerm) {
          // Use deviceName primarily, but also deviceCode for broader search
          filters.deviceName = debouncedSearchTerm;
          filters.deviceCode = debouncedSearchTerm;
        }
        if (filterStatus !== "all") {
          filters.status = filterStatus;
        }
        console.log(filters)
        // API expects: pageNumber, pageSize, filters
        const response = await apiClient.device.getDevices(page, pageSize, filters);

        // Standardize response parsing
        let devicesData: DEVICE_WEB[] = [];
        let total = 0;

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            devicesData = response;
            total = response.length;
          } else if (
            (response as any).data &&
            Array.isArray((response as any).data)
          ) {
            devicesData = (response as any).data;
            total =
              (response as any).totalCount ?? (response as any).data.length;
          } else if (
            (response as any).data &&
            (response as any).data.data &&
            Array.isArray((response as any).data.data)
          ) {
            devicesData = (response as any).data.data;
            total =
              (response as any).data.totalCount ??
              (response as any).data.data.length;
          } else {
            throw new Error("Cấu trúc phản hồi API không mong đợi");
          }
        } else {
          throw new Error("Phản hồi API không hợp lệ");
        }

        setDevices(devicesData);
        setTotalCount(total);
      } catch (error: any) {
        setError(
          `Không thể tải thiết bị: ${error.message || "Lỗi không xác định"}`
        );
        setDevices([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }, [page, pageSize, debouncedSearchTerm, filterStatus]);

    useImperativeHandle(
      ref,
      () => ({
        refetchDevices: fetchDevices,
      }),
      [fetchDevices]
    );

    useEffect(() => {
      fetchDevices();
    }, [fetchDevices]);

    useEffect(() => {
      if (page !== 1 && (debouncedSearchTerm || filterStatus !== "all")) {
        setPage(1);
      }
    }, [debouncedSearchTerm, filterStatus, page]);

    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    const handleImportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("Bạn không có quyền nhập thiết bị");
        return;
      }
      setShowImportModal(true);
    }, [hasFullAccess]);

    const handleImportModalClose = useCallback(() => {
      setShowImportModal(false);
    }, []);

    // Load machines for device import
    const loadMachinesForDeviceImport = useCallback(async () => {
      try {
        console.log('📡 Loading machines for device import...');
        const response = await apiClient.machine.getMachines(1, 1000); // Get all machines
        
        let machinesData: any[] = [];
        if (Array.isArray(response)) {
          machinesData = response;
        } else if ((response as any).data && Array.isArray((response as any).data)) {
          machinesData = (response as any).data;
        } else if ((response as any).data?.data && Array.isArray((response as any).data.data)) {
          machinesData = (response as any).data.data;
        }

        // Transform to required format
        const machineOptions = machinesData.map(machine => ({
          id: machine.id,
          name: machine.machineName,
          code: machine.machineCode
        }));

        console.log(`✅ Loaded ${machineOptions.length} machines for selection`);
        return machineOptions;
      } catch (error) {
        console.error('❌ Failed to load machines:', error);
        throw error;
      }
    }, []);

    // Handle file import with processed data (including machineId and positionId = null)
    const handleFileImport = useCallback(
      async (file: File) => {
        if (!hasFullAccess) {
          toast.error("Bạn không có quyền nhập thiết bị");
          return;
        }

        console.log(`📂 Importing device file: ${file.name}`);

        try {
          // ✅ Create FormData and send file directly to API (like MachineListCpn)
          const formData = new FormData();
          formData.append("file", file);

          await apiClient.device.importDevice(formData);

          // Refresh the device list
          await fetchDevices();
        } catch (error) {
          console.error("❌ Import failed:", error);
          throw error; // Re-throw to be handled by modal
        }
      },
      [fetchDevices, hasFullAccess]
    );

    const handleExportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("Bạn không có quyền xuất thiết bị");
        return;
      }
      setShowExportModal(true);
    }, [hasFullAccess]);

    const handleExportModalClose = useCallback(() => {
      setShowExportModal(false);
    }, []);

    const handleViewDevice = useCallback(
      (device: DEVICE_WEB) => {
        if (onViewDevice) {
          onViewDevice(device);
        } else {
          toast.info("Chức năng xem sẽ được triển khai khi cần thiết.");
        }
      },
      [onViewDevice]
    );
    const handleCreateTaskByDevice = useCallback(
      (device: DEVICE_WEB) => {
        if (onCreateTask) {
          onCreateTask(device);
        } else {
          toast.info("Chức năng xem sẽ được triển khai khi cần thiết.");
        }
      },
      [onCreateTask]
    );

    const handleEditDevice = useCallback(
      (device: DEVICE_WEB) => {
        if (!hasFullAccess) {
          toast.warning("Bạn không có quyền chỉnh sửa thiết bị");
          return;
        }
        if (onEditDevice) {
          onEditDevice(device);
        } else {
          toast.info("Chức năng chỉnh sửa sẽ được triển khai khi API có sẵn.");
        }
      },
      [onEditDevice, hasFullAccess]
    );

    const handleCreateDevice = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("Bạn không có quyền tạo thiết bị");
        return;
      }
      if (onCreateDevice) {
        onCreateDevice();
      } else {
        toast.info("Chức năng tạo sẽ được triển khai khi API có sẵn.");
      }
    }, [onCreateDevice, hasFullAccess]);

    const handleDeleteDevice = useCallback(
      (device: DEVICE_WEB) => {
        if (!hasFullAccess) {
          toast.warning("Bạn không có quyền xóa thiết bị");
          return;
        }
        if (onDeleteDevice) {
          onDeleteDevice(device);
        } else {
          toast.info("Chức năng xóa sẽ được triển khai khi API có sẵn.");
        }
      },
      [onDeleteDevice, hasFullAccess]
    );

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    if (isLoading && devices.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Đang tải thiết bị...</span>
          </CardContent>
        </Card>
      );
    }

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
                onClick={() => fetchDevices()}
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
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Danh sách thiết bị</h1>
          <div className="flex items-center gap-2">
            {hasFullAccess && (
              <>
                <Button
                  onClick={handleExportClick}
                  variant="outline"
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Xuất thiết bị
                </Button>
                <Button
                  onClick={handleImportClick}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Nhập thiết bị
                </Button>
              </>
            )}
            {onCreateDevice && hasFullAccess && (
              <Button
                onClick={handleCreateDevice}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tạo thiết bị
              </Button>
            )}
          </div>
        </div>

        <OperationStatsCpn />

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex flex-1 gap-2">
            <div className="relative w-1/3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên, mã hoặc số seri..."
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
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="inuse">Đang sử dụng</SelectItem>
                <SelectItem value="inrepair">Đang sửa chữa</SelectItem>
                <SelectItem value="inwarranty">Đang bảo hành</SelectItem>
                <SelectItem value="decommissioned">Ngừng sử dụng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left">Số seri</th>
                  <th className="px-4 py-3 text-left">Tên thiết bị</th>
                  <th className="px-4 py-3 text-left">Mẫu mã</th>
                  <th className="px-4 py-3 text-left">Trạng thái</th>
                  <th className="px-4 py-3 text-left">Bảo hành</th>
                  <th className="px-4 py-3 text-left">Ngày lắp đặt</th>
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
                      <td className="px-4 py-3">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : devices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      Không tìm thấy thiết bị
                    </td>
                  </tr>
                ) : (
                  devices.map((device) => (
                    <tr key={device.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 text-muted-foreground">
                        {device.serialNumber || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{device.deviceName}</div>
                        <div className="text-sm text-muted-foreground">
                          {device.deviceCode}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div className="text-sm">{device.model || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">
                          {device.manufacturer || "Không rõ"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`${getStatusBadgeVariant(
                            device.status
                          )} border-0`}
                        >
                          {getStatusDisplayText(device.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={`${getWarrantyBadgeVariant(
                            device.isUnderWarranty
                          )} border-0`}
                        >
                          {device.isUnderWarranty
                            ? "Còn bảo hành"
                            : "Hết bảo hành"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(device.installationDate)}
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
                              onClick={() => handleViewDevice(device)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            {showCreateTaskButton && (
                              <DropdownMenuItem
                                onClick={() => handleCreateTaskByDevice(device)}
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo nhiệm vụ
                              </DropdownMenuItem>
                            )}
                            {hasFullAccess && (
                              <>
                                {/* <DropdownMenuItem
                                  onClick={() => handleEditDevice(device)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Sửa thiết bị
                                </DropdownMenuItem> */}
                                <DropdownMenuItem
                                  onClick={() => handleDeleteDevice(device)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa thiết bị
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
                    {totalCount} thiết bị
                  </>
                ) : (
                  "Không có thiết bị"
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

        {hasFullAccess && (
          <EnhancedExcelImportModal
            isOpen={showImportModal}
            onClose={handleImportModalClose}
            onImport={handleFileImport}
            title="Nhập thiết bị từ Excel/CSV"
            successMessage="Nhập thiết bị thành công"
            importType="device"
            onLoadMachines={loadMachinesForDeviceImport}
          />
        )}

        {hasFullAccess && (
          <DeviceExportModal
            isOpen={showExportModal}
            onClose={handleExportModalClose}
            devices={devices}
          />
        )}
      </div>
    );
  }
);

DeviceListCpn.displayName = "DeviceListCpn";

export default DeviceListCpn;