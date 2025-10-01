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
  Plus,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Area } from "@/types/location.type";
import ExcelImportModal from "@/components/ExcelImportModal/ExcelImportModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";
import { useRouter } from "next/navigation";

interface AreaWithCounts extends Area {
  zoneCount: number;
  positionCount: number;
  deviceCount: number;
}

interface AreaListCpnProps {
  onEditArea?: (area: Area) => void;
  onDeleteArea?: (area: Area) => void;
  onViewArea?: (area: Area) => void;
  onCreateArea?: () => void; // ✅ NEW: Add create handler
}

// Add ref interface for parent component access
export interface AreaListCpnRef {
  refetchAreas: () => Promise<void>;
}

const AreaListCpn = forwardRef<AreaListCpnRef, AreaListCpnProps>(
  ({ onEditArea, onDeleteArea, onViewArea, onCreateArea }, ref) => {
    const { user } = useAuth();
    const router = useRouter();
    const [areas, setAreas] = useState<AreaWithCounts[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [isLoadingCounts, setIsLoadingCounts] = useState(false);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 1000);

    // Check if user has access - Both Admin and Stock Keeper can access
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

    // Fetch area counts (zones, positions, devices)
    const fetchAreaCounts = useCallback(async (areaId: string): Promise<{
      zoneCount: number;
      positionCount: number;
      deviceCount: number;
    }> => {
      try {
        // Get zones for this area
        const zonesResponse = await apiClient.location.getZonesByAreaId(areaId, 1, 1000);
        let zoneCount = 0;
        let positionCount = 0;
        let deviceCount = 0;

        if (zonesResponse && typeof zonesResponse === 'object') {
          let zones = [];
          
          // Extract zones array from response
          if (zonesResponse.data?.data && Array.isArray(zonesResponse.data.data)) {
            zones = zonesResponse.data.data;
            zoneCount = zonesResponse.data.totalCount || zones.length;
          } else if (zonesResponse.data && Array.isArray(zonesResponse.data)) {
            zones = zonesResponse.data;
            zoneCount = zones.length;
          } else if (Array.isArray(zonesResponse)) {
            zones = zonesResponse;
            zoneCount = zones.length;
          }

          // For each zone, get position and device counts
          for (const zone of zones) {
            try {
              const positionsResponse = await apiClient.location.getPositionsByZoneId(zone.id, 1, 1000);
              
              if (positionsResponse && typeof positionsResponse === 'object') {
                let positions = [];
                
                if (positionsResponse.data?.data && Array.isArray(positionsResponse.data.data)) {
                  positions = positionsResponse.data.data;
                  positionCount += positionsResponse.data.totalCount || positions.length;
                } else if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
                  positions = positionsResponse.data;
                  positionCount += positions.length;
                }

                deviceCount += positions.filter((position: any) => 
                  position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
                ).length;
              }
            } catch (error) {
              console.warn(`Could not fetch positions for zone ${zone.id}:`, error);
            }
          }
        }

        return { zoneCount, positionCount, deviceCount };
      } catch (error) {
        console.error(`Error fetching counts for area ${areaId}:`, error);
        return { zoneCount: 0, positionCount: 0, deviceCount: 0 };
      }
    }, []);

    // Fetch areas from API
    const fetchAreas = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`🔄 Loading areas (page ${page}, size ${pageSize})...`);

        const response = await apiClient.location.getAreas(page, pageSize);
        console.log("📦 Areas API response:", response);

        // Handle different response structures
        let areasData: Area[] = [];
        let total = 0;

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            areasData = response;
            total = response.length;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            areasData = response.data.data;
            total = response.data.totalCount || response.data.data.length;
          } else if (response.data && Array.isArray(response.data)) {
            areasData = response.data;
            total = response.totalCount || response.data.length;
          } else {
            console.error("❌ Unexpected response structure:", response);
            throw new Error("Unexpected API response structure");
          }
        } else {
          throw new Error("Invalid API response");
        }

        console.log(`📊 Extracted: ${areasData.length} areas, total: ${total}`);

        // Apply client-side filtering if needed
        let filteredAreas = areasData;

        // Apply search filter
        if (debouncedSearchTerm) {
          filteredAreas = filteredAreas.filter((area) =>
            area.areaName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Fetch counts for each area
        setIsLoadingCounts(true);
        const areasWithCounts: AreaWithCounts[] = await Promise.all(
          filteredAreas.map(async (area) => {
            const counts = await fetchAreaCounts(area.id);
            return {
              ...area,
              ...counts
            };
          })
        );

        setAreas(areasWithCounts);
        setTotalCount(total);
        setIsLoadingCounts(false);
        console.log("✅ Areas processed successfully");
      } catch (error: any) {
        console.error("❌ Error loading areas:", error);
        setError(`Cannot load areas: ${error.message || "Unknown error"}`);
        setAreas([]);
        setTotalCount(0);
        setIsLoadingCounts(false);
      } finally {
        setIsLoading(false);
      }
    }, [page, pageSize, debouncedSearchTerm, fetchAreaCounts]);

    // Expose refetch method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetchAreas: fetchAreas,
      }),
      [fetchAreas]
    );

    useEffect(() => {
      fetchAreas();
    }, [fetchAreas]);

    // Reset to page 1 when search changes
    useEffect(() => {
      if (page !== 1 && debouncedSearchTerm) {
        setPage(1);
      }
    }, [debouncedSearchTerm, page]);

    // Reset to page 1 when page size changes
    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    // Import/Export handlers
    const handleImportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("You don't have permission to import areas");
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
          toast.error("You don't have permission to import areas");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        console.log(`📂 Importing area file: ${file.name}`);

        await apiClient.location.importAreas(formData);

        // Refresh the area list
        await fetchAreas();
      },
      [fetchAreas, hasFullAccess]
    );

    const handleViewArea = useCallback(
      (area: AreaWithCounts) => {
        if (onViewArea) {
          onViewArea(area);
        } else {
          // Default action: navigate to zones
          router.push(`/workspace/admin/location/zones?area=${area.id}`);
        }
      },
      [onViewArea, router]
    );

    const handleEditArea = useCallback(
      (area: AreaWithCounts) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to edit areas");
          return;
        }
        if (onEditArea) {
          onEditArea(area);
        } else {
          toast.info("Edit functionality will be implemented when needed.");
        }
      },
      [onEditArea, hasFullAccess]
    );

    const handleDeleteArea = useCallback(
      (area: AreaWithCounts) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to delete areas");
          return;
        }
        if (onDeleteArea) {
          onDeleteArea(area);
        } else {
          toast.info("Delete functionality will be implemented when needed.");
        }
      },
      [onDeleteArea, hasFullAccess]
    );

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    const totalPages = Math.ceil(totalCount / pageSize);

    // Loading state
    if (isLoading && areas.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading areas...</span>
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
                onClick={() => fetchAreas()}
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
            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-2xl font-semibold">Danh sách khu vực</h1>
            <Badge variant="secondary" className="text-sm">
              {totalCount}
            </Badge>
            {isLoadingCounts && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading statistics...
              </div>
            )}
          </div>
          {hasFullAccess && (
            <div className="flex items-center gap-2">
              {/* ✅ NEW: Create Area Button */}
              {onCreateArea && (
                <Button
                  onClick={onCreateArea}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Tạo khu vực
                </Button>
              )}
              <Button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Nhập khu vực
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
                placeholder="Tìm kiếm khu vực..."
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
          </div>
        </div>

        {/* Areas Table */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="font-semibold text-foreground">Tên khu vực</TableHead>
                  <TableHead className="font-semibold text-center text-foreground">Khu</TableHead>
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
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-12 mx-auto" />
                      </TableCell>
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
                ) : areas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <MapPin className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">
                            {searchTerm ? 'Không tìm thấy khu vực nào' : 'Chưa có khu vực nào'}
                          </p>
                          <p className="text-sm text-muted-foreground/80 mt-1">
                            Sử dụng nút Nhập dữ liệu để thêm khu vực
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  areas.map((area) => (
                    <TableRow key={area.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <button
                          onClick={() => handleViewArea(area)}
                          className="font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-foreground"
                        >
                          {area.areaName}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50">
                          {isLoadingCounts ? '...' : area.zoneCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50">
                          {isLoadingCounts ? '...' : area.positionCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="font-medium bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700/50">
                          {isLoadingCounts ? '...' : area.deviceCount}
                        </Badge>
                      </TableCell>
                      {/* <TableCell className="text-muted-foreground">
                        {formatDate(area.createdDate)}
                      </TableCell> */}
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => handleViewArea(area)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem khu
                            </DropdownMenuItem>
                            {hasFullAccess && (
                              <>
                                <DropdownMenuItem onClick={() => handleEditArea(area)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Chỉnh sửa
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteArea(area)}
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
                    {totalCount} khu vực
                  </>
                ) : (
                  "Không có khu vực"
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
            title="Nhập khu vực từ Excel"
            successMessage="Nhập khu vực thành công"
          />
        )}
      </div>
    );
  }
);

AreaListCpn.displayName = "AreaListCpn";

export default AreaListCpn;