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
  Monitor,
  ArrowLeft,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Position, Zone, Area } from "@/types/location.type";
import { DEVICE_WEB } from "@/types/device.type";
import EnhancedExcelImportModal from "@/components/ExcelImportModal/EnhancedExcelImportModal";
import DeviceDetailModal from "@/components/DeviceCpn/DeviceDetailModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";
import { useRouter } from "next/navigation";

interface PositionListCpnProps {
  onEditPosition?: (position: Position) => void;
  onDeletePosition?: (position: Position) => void;
  onViewPosition?: (position: Position) => void;
  selectedZoneId?: string; // When accessed from specific zone
  selectedAreaId?: string; // When accessed from specific area
}

// Add ref interface for parent component access
export interface PositionListCpnRef {
  refetchPositions: () => Promise<void>;
}

const PositionListCpn = forwardRef<PositionListCpnRef, PositionListCpnProps>(
  ({ onEditPosition, onDeletePosition, onViewPosition, selectedZoneId, selectedAreaId }, ref) => {
    const { user } = useAuth();
    const router = useRouter();
    const [areas, setAreas] = useState<Area[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [positions, setPositions] = useState<Position[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAreaId, setFilterAreaId] = useState<string>(selectedAreaId || "all");
    const [filterZoneId, setFilterZoneId] = useState<string>(selectedZoneId || "all");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Device detail modal states
    const [showDeviceModal, setShowDeviceModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null);

    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false);

    const debouncedSearchTerm = useDebounce(searchTerm, 1000);

    // Check if user has access - Both Admin and Stock Keeper can access
    const hasFullAccess =
      user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.STOCK_KEEPER;

    // Get selected zone and area info
    const selectedZone = zones.find(zone => zone.id === selectedZoneId);
    const selectedArea = selectedZone ? areas.find(area => area.id === selectedZone.areaId) : areas.find(area => area.id === selectedAreaId);

    // ✅ Updated warranty badge function to match DeviceListCpn exactly
    const getWarrantyBadgeVariant = (isUnderWarranty: boolean) => {
      return isUnderWarranty
        ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
        : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    };

    // ✅ FIXED: Helper function to convert device data to DEVICE_WEB format
    const convertToDeviceWeb = (deviceData: any, position: Position): DEVICE_WEB => {
      // Find zone and area information for the device
      const zone = zones.find(z => z.id === position.zoneId);
      const area = areas.find(a => a.id === zone?.areaId);

      return {
        ...deviceData,
        // ✅ Add missing required DEVICE_WEB properties
        positionIndex: position.index,
        zoneName: zone?.zoneName || position.zoneName || 'Khu không xác định',
        areaName: area?.areaName || position.areaName || 'Khu vực không xác định',
        machineId: deviceData.machineId || '', // Ensure machineId is always a string
        positionId: position.id, // Add positionId for reference
      };
    };

    // Fetch areas for dropdown filter and position mapping
    const fetchAreas = useCallback(async () => {
      try {
        console.log("🔄 Fetching areas for position filtering and mapping...");
        const response = await apiClient.location.getAreas(1, 1000); // Get all areas
        let areasData: Area[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          areasData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          areasData = response.data;
        } else if (Array.isArray(response)) {
          areasData = response;
        }
        
        console.log("📦 Areas data for mapping:", areasData);
        setAreas(areasData);
      } catch (error) {
        console.error("❌ Error fetching areas:", error);
      }
    }, []);

    // Fetch zones for dropdown filter and position mapping
    const fetchZones = useCallback(async () => {
      try {
        console.log("🔄 Fetching zones for position filtering and mapping...");
        const response = await apiClient.location.getZones(1, 1000); // Get all zones
        let zonesData: Zone[] = [];
        
        if (response?.data?.data && Array.isArray(response.data.data)) {
          zonesData = response.data.data;
        } else if (response?.data && Array.isArray(response.data)) {
          zonesData = response.data;
        } else if (Array.isArray(response)) {
          zonesData = response;
        }
        
        // Map area names to zones
        const zonesWithAreaNames = zonesData.map(zone => {
          const area = areas.find(a => a.id === zone.areaId);
          return {
            ...zone,
            areaName: area?.areaName || zone.areaName || 'Unknown Area',
            areaCode: area?.areaCode || zone.areaCode || 'N/A'
          };
        });
        
        console.log("📦 Zones data for mapping:", zonesWithAreaNames);
        setZones(zonesWithAreaNames);
      } catch (error) {
        console.error("❌ Error fetching zones:", error);
      }
    }, [areas]);

    // Fetch positions from API with enhanced data mapping
    const fetchPositions = useCallback(async () => {
      try {
        setIsLoading(true);
        setError(null);
        console.log(`🔄 Loading positions (page ${page}, size ${pageSize})...`);

        let response;
        if (selectedZoneId) {
          // Fetch positions for specific zone
          response = await apiClient.location.getPositionsByZoneId(selectedZoneId, page, pageSize);
        } else {
          // Fetch all positions
          response = await apiClient.location.getPositions(page, pageSize);
        }
        
        console.log("📦 Positions API response:", response);

        // Handle different response structures
        let positionsData: Position[] = [];
        let total = 0;

        if (response && typeof response === "object") {
          if (Array.isArray(response)) {
            positionsData = response;
            total = response.length;
          } else if (response.data?.data && Array.isArray(response.data.data)) {
            positionsData = response.data.data;
            total = response.data.totalCount || response.data.data.length;
          } else if (response.data && Array.isArray(response.data)) {
            positionsData = response.data;
            total = response.totalCount || response.data.length;
          } else {
            console.error("❌ Unexpected response structure:", response);
            throw new Error("Unexpected API response structure");
          }
        } else {
          throw new Error("Invalid API response");
        }

        console.log(`📊 Extracted: ${positionsData.length} positions, total: ${total}`);

        // Enhanced data mapping with device fetch using getDeviceById
        const enhancedPositions = await Promise.all(
          positionsData.map(async (position) => {
            // Find zone and area information
            const zone = zones.find(z => z.id === position.zoneId);
            const area = areas.find(a => a.id === zone?.areaId);

            // ✅ Use getDeviceById API for device data if position has deviceId
            let deviceData = position.device;
            if (position.deviceId && !position.device) {
              try {
                console.log(`🔄 Fetching device data using getDeviceById for position ${position.id}, deviceId: ${position.deviceId}`);
                const fetchedDevice = await apiClient.device.getDeviceById(position.deviceId);
                
                // ✅ Convert fetched device to DEVICE_WEB format
                if (fetchedDevice) {
                  deviceData = convertToDeviceWeb(fetchedDevice, position);
                }
                console.log(`✅ Device data fetched and converted for position ${position.id}:`, deviceData);
              } catch (error) {
                console.warn(`⚠️ Could not fetch device ${position.deviceId} for position ${position.id}:`, error);
                deviceData = undefined;
              }
            } else if (position.device) {
              // ✅ Convert existing device data to DEVICE_WEB format
              deviceData = convertToDeviceWeb(position.device, position);
            }

            // Create enhanced position with all required fields
            const enhancedPosition: Position = {
              ...position,
              // Ensure we have position code and name
              positionCode: position.positionCode || `P${position.index.toString().padStart(3, '0')}`,
              positionName: position.positionName || `Vị trí ${position.index}`,
              // Map zone information
              zoneName: zone?.zoneName || position.zoneName || 'Khu không xác định',
              zoneCode: zone?.zoneCode || position.zoneCode || 'N/A',
              // Map area information
              areaName: area?.areaName || position.areaName || 'Khu vực không xác định',
              areaCode: area?.areaCode || position.areaCode || 'N/A',
              // Update device information
              device: deviceData,
              // Ensure device count is set correctly
              deviceCount: deviceData ? 1 : (position.deviceCount || 0),
            };

            return enhancedPosition;
          })
        );

        // Apply client-side filtering
        let filteredPositions = enhancedPositions;

        // Apply search filter
        if (debouncedSearchTerm) {
          filteredPositions = filteredPositions.filter((position) =>
            position.positionName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            position.positionCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            position.index.toString().includes(debouncedSearchTerm) ||
            position.device?.deviceName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            position.device?.deviceCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Apply area filter (when not using selectedAreaId from props)
        if (!selectedAreaId && filterAreaId && filterAreaId !== 'all') {
          filteredPositions = filteredPositions.filter(position => {
            const zone = zones.find(z => z.id === position.zoneId);
            return zone?.areaId === filterAreaId;
          });
        }

        // Apply zone filter (when not using selectedZoneId from props)
        if (!selectedZoneId && filterZoneId && filterZoneId !== 'all') {
          filteredPositions = filteredPositions.filter(position => position.zoneId === filterZoneId);
        }

        setPositions(filteredPositions);
        setTotalCount(total);
        console.log("✅ Positions processed successfully");
      } catch (error: any) {
        console.error("❌ Error loading positions:", error);
        setError(`Cannot load positions: ${error.message || "Unknown error"}`);
        setPositions([]);
        setTotalCount(0);
      } finally {
        setIsLoading(false);
      }
    }, [page, pageSize, selectedZoneId, selectedAreaId, debouncedSearchTerm, filterAreaId, filterZoneId, zones, areas]);

    // Expose refetch method to parent component
    useImperativeHandle(
      ref,
      () => ({
        refetchPositions: fetchPositions,
      }),
      [fetchPositions]
    );

    // Load data in sequence: areas → zones → positions
    useEffect(() => {
      fetchAreas();
    }, [fetchAreas]);

    useEffect(() => {
      if (areas.length > 0) {
        fetchZones();
      }
    }, [fetchZones, areas]);

    useEffect(() => {
      if (areas.length > 0 && zones.length > 0) {
        fetchPositions();
      }
    }, [fetchPositions, areas, zones]);

    // Reset to page 1 when search/filter changes
    useEffect(() => {
      if (page !== 1 && (debouncedSearchTerm || filterAreaId !== 'all' || filterZoneId !== 'all')) {
        setPage(1);
      }
    }, [debouncedSearchTerm, filterAreaId, filterZoneId, page]);

    // Reset to page 1 when page size changes
    useEffect(() => {
      setPage(1);
    }, [pageSize]);

    // Import/Export handlers
    const handleImportClick = useCallback(() => {
      if (!hasFullAccess) {
        toast.warning("You don't have permission to import positions");
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
          toast.error("You don't have permission to import positions");
          return;
        }

        const formData = new FormData();
        formData.append("file", file);

        console.log(`📂 Importing position file: ${file.name}`);

        await apiClient.location.importPositions(formData);

        // Refresh the position list
        await fetchPositions();
      },
      [fetchPositions, hasFullAccess]
    );

    // ✅ FIXED: Device modal handlers with proper event handling
    const handleViewDevice = useCallback((device: DEVICE_WEB, event?: React.MouseEvent) => {
      // Prevent event bubbling if this is called from a click handler
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      console.log("🔍 Opening device modal for device:", device);
      setSelectedDevice(device);
      setShowDeviceModal(true);
    }, []);

    const handleCloseDeviceModal = useCallback(() => {
      console.log("🔒 Closing device modal");
      setShowDeviceModal(false);
      setSelectedDevice(null);
    }, []);

    // ✅ FIXED: Device badge click handler
    const handleDeviceBadgeClick = useCallback((device: DEVICE_WEB, event: React.MouseEvent) => {
      console.log("🎯 Device badge clicked for device:", device.deviceName);
      handleViewDevice(device, event);
    }, [handleViewDevice]);

    // ✅ FIXED: Device name click handler  
    const handleDeviceNameClick = useCallback((device: DEVICE_WEB, event: React.MouseEvent) => {
      console.log("🎯 Device name clicked for device:", device.deviceName);
      handleViewDevice(device, event);
    }, [handleViewDevice]);

    // Update the handleViewPosition to show device modal if device exists
    const handleViewPosition = useCallback(
      (position: Position) => {
        if (position.device) {
          // If position has a device, show device modal
          handleViewDevice(position.device as DEVICE_WEB);
        } else {
          // If no device, show position info or default message
          toast.info("Vị trí này chưa có thiết bị.");
        }
      },
      [handleViewDevice]
    );

    const handleEditPosition = useCallback(
      (position: Position) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to edit positions");
          return;
        }
        if (onEditPosition) {
          onEditPosition(position);
        } else {
          toast.info("Edit functionality will be implemented when needed.");
        }
      },
      [onEditPosition, hasFullAccess]
    );

    const handleDeletePosition = useCallback(
      (position: Position) => {
        if (!hasFullAccess) {
          toast.warning("You don't have permission to delete positions");
          return;
        }
        if (onDeletePosition) {
          onDeletePosition(position);
        } else {
          toast.info("Delete functionality will be implemented when needed.");
        }
      },
      [onDeletePosition, hasFullAccess]
    );

    const handlePageSizeChange = useCallback((newPageSize: string) => {
      setPageSize(Number(newPageSize));
    }, []);

    // Navigation
    const handleBackToZones = () => {
      if (selectedZone && selectedArea) {
        router.push(`/workspace/admin/location/zones?area=${selectedArea.id}`);
      } else {
        router.push(`/workspace/admin/location/zones`);
      }
    };

    // Dynamic title based on context
    const getPageTitle = () => {
      if (selectedZoneId && selectedZone) {
        return `Danh sách vị trí (${totalCount} vị trí) - Khu: ${selectedZone.zoneName}`;
      }
      return 'Danh sách vị trí';
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    // Loading state
    if (isLoading && positions.length === 0) {
      return (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading positions...</span>
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
                onClick={() => fetchPositions()}
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
            {selectedZone && (
              <Button
                variant="outline"
                onClick={handleBackToZones}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            )}
            <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            <h1 className="text-2xl font-semibold">
              {getPageTitle()}
            </h1>
            {!selectedZone && (
              <Badge variant="secondary" className="text-sm">
                {totalCount}
              </Badge>
            )}
          </div>
          {hasFullAccess && (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                Nhập vị trí
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
                placeholder="Tìm kiếm vị trí..."
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

            {/* Only show filters when not accessed from specific zone/area */}
            {!selectedZoneId && !selectedAreaId && (
              <>
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

                <Select value={filterZoneId} onValueChange={setFilterZoneId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Lọc theo khu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả khu</SelectItem>
                    {zones
                      .filter(zone => filterAreaId === 'all' || zone.areaId === filterAreaId)
                      .map((zone) => (
                        <SelectItem key={zone.id} value={zone.id}>
                          {zone.zoneCode} {zone.zoneName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* ✅ FIXED: Updated Positions Table with proper click handlers */}
        <div className="rounded-md border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border">
                  <TableHead className="font-semibold text-foreground">Chỉ số vị trí</TableHead>
                  <TableHead className="font-semibold text-foreground">Thiết bị</TableHead>
                  <TableHead className="font-semibold text-foreground w-[200px]">Tên thiết bị</TableHead>
                  <TableHead className="font-semibold text-center text-foreground">Bảo hành</TableHead>
                  <TableHead className="font-semibold text-center w-[100px] text-foreground">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={`skeleton-${index}`} className="animate-pulse">
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto" />
                      </TableCell>
                      <TableCell>
                        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : positions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <MapPin className="h-12 w-12 text-muted-foreground/50" />
                        <div>
                          <p className="text-lg font-medium text-muted-foreground">
                            {searchTerm ? 'Không tìm thấy vị trí' : 'Chưa có vị trí nào'}
                          </p>
                          <p className="text-sm text-muted-foreground/80 mt-1">
                            Sử dụng nút Nhập dữ liệu để thêm vị trí
                          </p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  positions.map((position) => {
                    return (
                      <TableRow key={position.id} className="hover:bg-muted/50 transition-colors">
                        {/* Chỉ số vị trí */}
                        <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                          Vị trí {position.index}
                        </TableCell>
                        
                        {/* ✅ FIXED: Thiết bị - Status Badge with proper click handler */}
                        <TableCell>
                          {position.device ? (
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                                onClick={(e) => handleDeviceBadgeClick(position.device as DEVICE_WEB, e)}
                              >
                                Có thiết bị
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 opacity-50 text-muted-foreground" />
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700/50"
                              >
                                Trống
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                        
                        {/* ✅ FIXED: Tên thiết bị - Clickable when device exists with proper event handling */}
                        <TableCell>
                          {position.device ? (
                            <span 
                              className="text-sm font-medium text-foreground cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors"
                              onClick={(e) => handleDeviceNameClick(position.device as DEVICE_WEB, e)}
                            >
                              {position.device.deviceName}
                            </span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Chưa có thiết bị
                            </span>
                          )}
                        </TableCell>
                        
                        {/* ✅ Bảo hành - Warranty Status using Badge like DeviceListCpn */}
                        <TableCell className="text-center">
                          {position.device ? (
                            <Badge
                              variant="outline"
                              className={`${getWarrantyBadgeVariant(
                                position.device.isUnderWarranty
                              )} border-0`}
                            >
                              {position.device.isUnderWarranty
                                ? "Còn bảo hành"
                                : "Hết bảo hành"}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-gray-100 text-gray-500 border-0 dark:bg-gray-900/30 dark:text-gray-400"
                            >
                              N/A
                            </Badge>
                          )}
                        </TableCell>
                        
                        {/* ✅ FIXED: Thao tác - Updated dropdown menu with proper device modal opening */}
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {/* ✅ FIXED: Show different options based on whether device exists */}
                              {position.device ? (
                                <DropdownMenuItem onClick={() => handleViewDevice(position.device as DEVICE_WEB)}>
                                  <Monitor className="mr-2 h-4 w-4" />
                                  Xem chi tiết
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleViewPosition(position)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Xem vị trí
                                </DropdownMenuItem>
                              )}
                              {hasFullAccess && (
                                <>
                                  {/* <DropdownMenuItem onClick={() => handleEditPosition(position)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Chỉnh sửa
                                  </DropdownMenuItem> */}
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePosition(position)}
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
                    );
                  })
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
                    {totalCount} vị trí
                  </>
                ) : (
                  "Không có vị trí"
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
          <EnhancedExcelImportModal
            isOpen={showImportModal}
            onClose={handleImportModalClose}
            onImport={handleFileImport}
            title="Nhập vị trí từ Excel"
            successMessage="Nhập vị trí thành công"
            importType="position" 
            currentZoneId={selectedZoneId}
            currentZoneName={selectedZone?.zoneName} 
          />
        )}

        {/* ✅ FIXED: Device Detail Modal with proper close handler */}
        <DeviceDetailModal
          open={showDeviceModal}
          onOpenChange={handleCloseDeviceModal}
          device={selectedDevice}
        />
      </div>
    );
  }
);

PositionListCpn.displayName = "PositionListCpn";

export default PositionListCpn;