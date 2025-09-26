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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Loader2,
  MapPin,
  ArrowLeft,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Zone, Area } from "@/types/location.type";
import ExcelImportModal from "@/components/ExcelImportModal/ExcelImportModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";
import { useRouter } from "next/navigation";

interface ZoneWithCounts extends Zone {
  positionCount: number;
  deviceCount: number;
}

interface ZoneListCpnProps {
  selectedAreaId?: string;
  onEditZone?: (zone: Zone) => void;
  onDeleteZone?: (zone: Zone) => void;
  onViewZone?: (zone: Zone) => void;
  onBackToAreas?: () => void;
}

// Add ref interface for parent component access
export interface ZoneListCpnRef {
  refetchZones: () => Promise<void>;
}

const ZoneListCpn = forwardRef<ZoneListCpnRef, ZoneListCpnProps>(
  ({ selectedAreaId, onEditZone, onDeleteZone, onViewZone, onBackToAreas }, ref) => {
    const { user } = useAuth();
    const router = useRouter();
    const [areas, setAreas] = useState<Area[]>([]);
    const [zones, setZones] = useState<ZoneWithCounts[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAreaId, setFilterAreaId] = useState<string>(selectedAreaId || 'all');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 1000);

    const selectedArea = areas.find(area => area.id === selectedAreaId);

    // Check if user has access
    const hasFullAccess =
      user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STOCK_KEEPER;

    const formatDate = (dateString: string | null | undefined) => {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    };

    // Fetch zone counts (positions, devices)
    const fetchZoneCounts = useCallback(async (zoneId: string): Promise<{
      positionCount: number;
      deviceCount: number;
    }> => {
      try {
        const positionsResponse = await apiClient.location.getPositionsByZoneId(zoneId, 1, 1000);
        let positionCount = 0;
        let deviceCount = 0;

        if (positionsResponse && typeof positionsResponse === 'object') {
          if (positionsResponse.data?.data && Array.isArray(positionsResponse.data.data)) {
            const positions = positionsResponse.data.data;
            positionCount = positionsResponse.data.totalCount || positions.length;
            deviceCount = positions.filter((position: any) => 
              position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
            ).length;
          } else if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
            const positions = positionsResponse.data;
            positionCount = positions.length;
            deviceCount = positions.filter((position: any) => 
              position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
            ).length;
          }
        }

        return { positionCount, deviceCount };
      } catch (error) {
        console.error(`Error fetching counts for zone ${zoneId}:`, error);
        return { positionCount: 0, deviceCount: 0 };
      }
    }, []);

    // Fetch areas for dropdown filter
    const fetchAreas = useCallback(async () => {
      try {
        const response = await apiClient.location.getAreas(1, 1000);
        let areasData: Area[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          areasData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          areasData = response.data;
        } else if (Array.isArray(response)) {
          areasData = response;
        }
        
        setAreas(areasData);
      } catch (error) {
        console.error("Error fetching areas:", error);
      }
    }, []);

    // Fetch zones from API
    const fetchZones = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`🔄 Loading zones (page ${page}, size ${pageSize})...`);

        let response;
        if (selectedAreaId) {
          response = await apiClient.location.getZonesByAreaId(selectedAreaId, page, pageSize);
        } else {
          response = await apiClient.location.getZones(page, pageSize);
        }

        // Handle different response structures
        let zonesData: Zone[] = [];
        let total = 0;

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            zonesData = response;
            total = response.length;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            zonesData = response.data.data;
            total = response.data.totalCount || response.data.data.length;
          } else if (response.data && Array.isArray(response.data)) {
            zonesData = response.data;
            total = response.totalCount || response.data.length;
          } else {
            console.error("❌ Unexpected response structure:", response);
            throw new Error("Unexpected API response structure");
          }
        } else {
          throw new Error("Invalid API response");
        }

        // Map area names if not present
        const zonesWithAreaNames = await Promise.all(
          zonesData.map(async (zone) => {
            if (zone.areaName) {
              return zone;
            }
            
            const area = areas.find(a => a.id === zone.areaId);
            return {
              ...zone,
              areaName: area?.areaName || 'Unknown Area',
              areaCode: area?.areaCode || 'N/A'
            };
          })
        );

        // Apply client-side filtering
        let filteredZones = zonesWithAreaNames;

        if (debouncedSearchTerm) {
          filteredZones = filteredZones.filter((zone) =>
            zone.zoneName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        if (!selectedAreaId && filterAreaId && filterAreaId !== 'all') {
          filteredZones = filteredZones.filter(zone => zone.areaId === filterAreaId);
        }

        // Fetch counts for each zone
        setIsLoadingCounts(true);
        const zonesWithCounts: ZoneWithCounts[] = await Promise.all(
          filteredZones.map(async (zone) => {
            const counts = await fetchZoneCounts(zone.id);
            return {
              ...zone,
              ...counts
            };
          })
        );

        setZones(zonesWithCounts);
        setTotalCount(total);
        setIsLoadingCounts(false);
        console.log("✅ Zones processed successfully");
      } catch (error: any) {
        console.error("❌ Error loading zones:", error);
        setError(`Cannot load zones: ${error.message || "Unknown error"}`);
        setZones([]);
        setTotalCount(0);
        setIsLoadingCounts(false);
      } finally {
        setIsLoading(false);
      }
    }, [page, pageSize, selectedAreaId, debouncedSearchTerm, filterAreaId, fetchZoneCounts, areas]);

    // Expose refetch method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetchZones: fetchZones,
      }),
      [fetchZones]
    );

    useEffect(() => {
      fetchAreas();
    }, [fetchAreas]);

    useEffect(() => {
      fetchZones();
    }, [fetchZones]);

    // Reset to page 1 when search/filter changes
    useEffect(() => {
      if (page !== 1 && (debouncedSearchTerm || filterAreaId !== 'all')) {
        setPage(1);
      }
    }, [debouncedSearchTerm, filterAreaId, page]);

    // Reset to page 1 when page size changes
    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    // Import handlers
    const handleImportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("You don't have permission to import zones");
        return;
      }
      setShowImportModal(true);
    }, [hasFullAccess]);

    const handleImportModalClose = useCallback(() => {
      setShowImportModal(false);
    }, []);

    const handleFileImport = useCallback(
      async (file: File) => {
        if (!hasFullAccess) {
          toast.error("You don't have permission to import zones");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        await apiClient.location.importZones(formData);
        await fetchZones();
      },
      [fetchZones, hasFullAccess]
    );

    const handleViewZone = useCallback(
      (zone: ZoneWithCounts) => {
        if (onViewZone) {
          onViewZone(zone);
        } else {
          router.push(`/workspace/admin/location/positions?zone=${zone.id}`);
        }
      },
      [onViewZone, router]
    );

    const handleEditZone = useCallback(
      (zone: ZoneWithCounts) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to edit zones");
          return;
        }
        if (onEditZone) {
          onEditZone(zone);
        } else {
          toast.info("Edit functionality will be implemented when needed.");
        }
      },
      [onEditZone, hasFullAccess]
    );

    const handleDeleteZone = useCallback(
      (zone: ZoneWithCounts) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to delete zones");
          return;
        }
        if (onDeleteZone) {
          onDeleteZone(zone);
        } else {
          toast.info("Delete functionality will be implemented when needed.");
        }
      },
      [onDeleteZone, hasFullAccess]
    );

    const handleBackToAreas = useCallback(() => {
      if (onBackToAreas) {
        onBackToAreas();
      } else {
        router.push('/workspace/admin/location/areas');
      }
    }, [onBackToAreas, router]);

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const totalPages = Math.ceil(totalCount / pageSize);

    // Loading state
    if (isLoading && zones.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading zones...</span>
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
              <button
                onClick={() => fetchZones()}
                className="text-blue-500 underline text-sm"
              >
                Try again
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
          <div className="flex items-center gap-3">
            {selectedArea && (
              <Button
                variant="outline"
                onClick={handleBackToAreas}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            )}
            <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            <h1 className="text-2xl font-semibold">
              {selectedArea ? `Danh sách khu (${totalCount} khu) - Khu vực: ${selectedArea.areaName}` : 'Danh sách khu'}
            </h1>
            {!selectedArea && (
              <Badge variant="secondary" className="text-sm">
                {totalCount}
              </Badge>
            )}
            {isLoadingCounts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading statistics...
              </div>
            )}
          </div>
          {hasFullAccess && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Nhập khu
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
                placeholder="Tìm kiếm khu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
              {searchTerm && searchTerm !== debouncedSearchTerm && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">
                  Searching...
                </span>
              )}
            </div>

            {!selectedArea && (
              <Select value={filterAreaId} onValueChange={setFilterAreaId}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Lọc theo khu vực" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả khu vực</SelectItem>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.areaName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Zones Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="font-semibold text-foreground w-[350px]">Tên khu</TableHead>
                  {!selectedArea && <TableHead className="font-semibold text-foreground">Khu vực</TableHead>}
                  <TableHead className="font-semibold text-center text-foreground">Vị trí</TableHead>
                  <TableHead className="font-semibold text-center text-foreground">Thiết bị</TableHead>
                  {/* <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead> */}
                  <TableHead className="font-semibold text-center w-[100px] text-foreground">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                      </TableCell>
                      {!selectedArea && (
                        <TableCell>
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : zones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectedArea ? 5 : 6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <MapPin className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">
                            {searchTerm ? 'Không tìm thấy khu nào' : 'Chưa có khu nào'}
                          </p>
                          <p className="text-sm text-muted-foreground/80 mt-1">
                            Sử dụng nút Nhập dữ liệu để thêm khu
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  zones.map((zone) => (
                    <TableRow key={zone.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <button
                          onClick={() => handleViewZone(zone)}
                          className="font-medium hover:text-green-600 dark:hover:text-green-400 hover:underline transition-colors text-foreground"
                        >
                          {zone.zoneName}
                        </button>
                      </TableCell>
                      {!selectedArea && (
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {zone.areaName || 'N/A'}
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">
                          {isLoadingCounts ? '...' : zone.positionCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50">
                          {isLoadingCounts ? '...' : zone.deviceCount}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="text-muted-foreground">
                        {formatDate(zone.createdDate)}
                      </TableCell> */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewZone(zone)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem vị trí
                            </DropdownMenuItem>
                            {hasFullAccess && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditZone(zone)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteZone(zone)}
                                  className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Xóa
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
                    {totalCount} khu
                  </>
                ) : (
                  "Không có khu"
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

        {/* Import Modal */}
        {hasFullAccess && (
          <ExcelImportModal
            isOpen={showImportModal}
            onClose={handleImportModalClose}
            onImport={handleFileImport}
            title="Nhập khu từ Excel"
            successMessage="Nhập khu thành công"
          />
        )}
      </div>
    );
  }
);

ZoneListCpn.displayName = "ZoneListCpn";

export default ZoneListCpn;