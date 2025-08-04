'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Monitor, ArrowLeft, Loader2 } from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import LocationBreadcrumb from '@/components/AdminPositionCpn/LocationBreadcrumb';
import PositionModal from '@/components/AdminPositionCpn/PositionModalCpn/PositionModal';
import DeleteConfirmModal from '@/components/AdminPositionCpn/PositionModalCpn/DeleteConfirmModal';
import ImportModal from '@/components/AdminPositionCpn/PositionModalCpn/ImportModal';
import DeviceDetailModal from '@/components/DeviceCpn/DeviceDetailModal';
import { Position, Zone, Area, CreatePositionRequest, UpdatePositionRequest } from '@/types/location.type';
import { DEVICE_WEB } from '@/types/device.type';
import { apiClient } from '@/lib/api-client';

export default function PositionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.["workspace-id"];
  
  // Get zone ID from URL parameters (when accessed from Zone page)
  const selectedZoneId = searchParams.get('zone');

  const [areas, setAreas] = useState<Area[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZoneId, setFilterZoneId] = useState<string>(selectedZoneId || 'all');
  const [filterAreaId, setFilterAreaId] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal states
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  // Device detail modal states
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null);

  // Get selected zone and area info
  const selectedZone = zones.find(zone => zone.id === selectedZoneId);
  const selectedArea = selectedZone ? areas.find(area => area.id === selectedZone.areaId) : null;

  // Fetch areas for dropdown filter and zone mapping
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
        // Fetch positions for specific zone (when accessed from Zone page)
        response = await apiClient.location.getPositionsByZoneId(selectedZoneId, page, pageSize);
      } else {
        // Fetch all positions (when accessed directly)
        response = await apiClient.location.getPositions(page, pageSize);
      }
      
      console.log("📦 Positions API response:", response);

      // Handle different API response structures
      let positionsData: Position[] = [];
      let total = 0;

      if (response && typeof response === 'object') {
        // Case 1: Response has nested data structure
        if (response.data?.data && Array.isArray(response.data.data)) {
          positionsData = response.data.data;
          total = response.data.totalCount || response.data.totalItems || positionsData.length;
        }
        // Case 2: Response data is directly in response.data
        else if (response.data && Array.isArray(response.data)) {
          positionsData = response.data;
          total = response.totalCount || response.totalItems || positionsData.length;
        }
        // Case 3: Response is directly an array
        else if (Array.isArray(response)) {
          positionsData = response;
          total = response.length;
        }
        // Case 4: Response has positions property
        else if (response.positions && Array.isArray(response.positions)) {
          positionsData = response.positions;
          total = response.totalCount || response.totalItems || positionsData.length;
        }
        // Case 5: Response has items property
        else if (response.items && Array.isArray(response.items)) {
          positionsData = response.items;
          total = response.totalCount || response.totalItems || positionsData.length;
        }
        else {
          console.warn("⚠️ Unrecognized response structure:", response);
          // Try to find any array in the response
          const possibleArrays = Object.values(response).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            positionsData = possibleArrays[0] as Position[];
            total = positionsData.length;
            console.log("✅ Found array data in response:", positionsData.length, "items");
          } else {
            throw new Error("No position data found in API response");
          }
        }
      } else {
        throw new Error("Invalid API response");
      }

      // Enhanced data mapping with device fetch for direct access
      const enhancedPositions = await Promise.all(
        positionsData.map(async (position) => {
          // Find zone information
          const zone = zones.find(z => z.id === position.zoneId);
          const area = areas.find(a => a.id === zone?.areaId);

          // If position has deviceId but no device data, fetch it
          let deviceData = position.device;
          if (position.deviceId && !position.device) {
            try {
              console.log(`🔄 Fetching device data for position ${position.id}, deviceId: ${position.deviceId}`);
              deviceData = await apiClient.device.getDeviceById(position.deviceId);
              console.log(`✅ Device data fetched for position ${position.id}:`, deviceData);
            } catch (error) {
              console.warn(`⚠️ Could not fetch device ${position.deviceId} for position ${position.id}:`, error);
              deviceData = null;
            }
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

      console.log(`📊 Extracted: ${enhancedPositions.length} positions, total: ${total}`);
      console.log("Sample enhanced position:", enhancedPositions[0]);

      setPositions(enhancedPositions);
      setTotalCount(total);
      console.log("✅ Positions processed successfully");
    } catch (error: any) {
      console.error("❌ Error loading positions:", error);
      setError(`Không thể tải vị trí: ${error.message || 'Lỗi không xác định'}`);
      setPositions([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedZoneId, zones, areas]);

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

  // Filter positions based on search term, zone, and area
  useEffect(() => {
    let filtered = positions;

    // Filter by zone if specified and not using selectedZoneId from URL
    if (!selectedZoneId && filterZoneId && filterZoneId !== 'all') {
      filtered = filtered.filter(position => position.zoneId === filterZoneId);
    }

    // Filter by area if specified
    if (filterAreaId && filterAreaId !== 'all') {
      filtered = filtered.filter(position => {
        const zone = zones.find(z => z.id === position.zoneId);
        return zone?.areaId === filterAreaId;
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(position => 
        position.positionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.positionCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.index.toString().includes(searchTerm) ||
        position.device?.deviceName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.device?.deviceCode?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredPositions(filtered);
  }, [positions, searchTerm, filterZoneId, filterAreaId, selectedZoneId, zones]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // CRUD operations
  const handleCreatePosition = async (data: CreatePositionRequest) => {
    try {
      setIsLoading(true);
      
      await apiClient.location.createPosition(data);
      toast.success('Vị trí đã được tạo thành công');
      setIsPositionModalOpen(false);
      
      // Refresh data
      await fetchPositions();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi thêm vị trí: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error creating position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePosition = async (data: UpdatePositionRequest) => {
    try {
      setIsLoading(true);
      
      if (!selectedPosition) {
        throw new Error('Không tìm thấy vị trí được chọn');
      }
      
      await apiClient.location.updatePosition(selectedPosition.id, data);
      toast.success('Vị trí đã được cập nhật thành công');
      setIsPositionModalOpen(false);
      setSelectedPosition(null);
      
      // Refresh data
      await fetchPositions();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi cập nhật vị trí: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error updating position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePosition = async () => {
    if (!selectedPosition) return;

    try {
      setIsLoading(true);
      
      await apiClient.location.deletePosition(selectedPosition.id);
      toast.success('Vị trí đã được xóa thành công');
      setIsDeleteModalOpen(false);
      setSelectedPosition(null);
      
      // Refresh data
      await fetchPositions();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi xóa vị trí: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error deleting position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.location.importPositions(formData);
      toast.success('Dữ liệu vị trí đã được nhập thành công');
      setIsImportModalOpen(false);
      
      // Refresh data
      await fetchPositions();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi import dữ liệu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error importing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced device handling with modal
  const handleViewDevice = async (position: Position) => {
    if (position.device) {
      try {
        console.log(`Opening device detail for: ${position.device.deviceName}`);
        // Use the device data from position directly since it contains full device info
        setSelectedDevice(position.device as DEVICE_WEB);
        setShowDeviceModal(true);
      } catch (error) {
        console.error('Error preparing device details:', error);
        toast.error('Cannot load device information');
      }
    }
  };

  // Navigation
  const handleBackToZones = () => {
    if (selectedZone && selectedArea) {
      router.push(`/workspace/${workspaceId}/admin/location/zones?area=${selectedArea.id}`);
    } else {
      router.push(`/workspace/${workspaceId}/admin/location/zones`);
    }
  };

  // Dynamic breadcrumb based on context
  const breadcrumbItems = selectedZoneId && selectedZone ? [
    { label: 'Khu vực', href: `/workspace/${workspaceId}/admin/location/areas` },
    { label: 'Khu', href: `/workspace/${workspaceId}/admin/location/zones` },
    { label: selectedZone.zoneName, isActive: true }
  ] : [
    { label: 'Khu vực', href: `/workspace/${workspaceId}/admin/location/areas` },
    { label: 'Khu', href: `/workspace/${workspaceId}/admin/location/zones` },
    { label: 'Vị trí', isActive: true }
  ];

  // Dynamic title based on context
  const getPageTitle = () => {
    if (selectedZoneId && selectedZone) {
      return `Quản lý vị trí (${totalCount} vị trí) - Khu: ${selectedZone.zoneName}`;
    }
    return 'Quản lý vị trí';
  };

  // Loading state
  if (isLoading && positions.length === 0) {
    return (
      <div className="space-y-6 p-2 bg-background min-h-screen">
        <LocationBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải vị trí...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 p-2 bg-background min-h-screen">
        <LocationBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-8 text-center">
          <div>
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              onClick={() => fetchPositions()} 
              variant="outline"
              className="text-sm"
            >
              Thử lại
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6 p-2 bg-background min-h-screen">
      <LocationBreadcrumb items={breadcrumbItems} />

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
          <h1 className="text-2xl font-bold text-foreground">
            {getPageTitle()}
          </h1>
          {!selectedZone && (
            <Badge variant="secondary" className="text-sm">
              {totalCount}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* <Button 
            onClick={() => setIsPositionModalOpen(true)} 
            variant="outline" 
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Thêm vị trí
          </Button> */}
          <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Nhập dữ liệu
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm vị trí..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Only show filters when not accessed from specific zone */}
        {!selectedZoneId && (
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
                      {zone.zoneCode} - {zone.zoneName}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </>
        )}
      </div>

      {/* Positions Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground">Chỉ số vị trí</TableHead>
              {!selectedZoneId && <TableHead className="font-semibold text-foreground">Tên khu vực</TableHead>}
              {!selectedZoneId && <TableHead className="font-semibold text-foreground">Tên khu</TableHead>}
              <TableHead className="font-semibold text-foreground">Thiết bị</TableHead>
              <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
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
                  {!selectedZoneId && (
                    <>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                      <TableCell>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </TableCell>
                    </>
                  )}
                  <TableCell>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedZoneId ? 4 : 6} className="text-center py-12">
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
              filteredPositions.map((position) => (
                <TableRow key={position.id} className="hover:bg-muted/50 transition-colors">
                  {/* Position Index */}
                  <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                    Vị trí {position.index}
                  </TableCell>
                  
                  {/* Area Name (only when not accessed from zone) */}
                  {!selectedZoneId && (
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {position.areaName || 'Khu vực không xác định'}
                      </span>
                    </TableCell>
                  )}
                  
                  {/* Zone Name (only when not accessed from zone) */}
                  {!selectedZoneId && (
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {position.zoneName || 'Khu không xác định'}
                      </span>
                    </TableCell>
                  )}
                  
                  {/* Device Status Badge */}
                  <TableCell>
                    {position.device ? (
                      <button
                        onClick={() => handleViewDevice(position)}
                        className="flex items-center gap-2 hover:bg-muted/50 p-1 rounded transition-colors"
                      >
                        <Monitor className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700/50"
                        >
                          Có thiết bị
                        </Badge>
                      </button>
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
                  
                  {/* Created Date */}
                  <TableCell className="text-muted-foreground">
                    {formatDate(position.createdDate)}
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {position.device && (
                          <DropdownMenuItem onClick={() => handleViewDevice(position)}>
                            <Monitor className="mr-2 h-4 w-4" />
                            Xem thiết bị
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedPosition(position);
                            setIsPositionModalOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedPosition(position);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Trang {page} trong số {totalPages} ({totalCount} vị trí)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PositionModal
        isOpen={isPositionModalOpen}
        onClose={() => {
          setIsPositionModalOpen(false);
          setSelectedPosition(null);
        }}
        onSubmit={(data) => {
          if (selectedPosition && 'id' in data) {
            handleUpdatePosition(data as UpdatePositionRequest);
          } else {
            handleCreatePosition(data as CreatePositionRequest);
          }
        }}
        position={selectedPosition}
        zones={zones}
        isLoading={isLoading}
        selectedZoneId={selectedZoneId || undefined}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedPosition(null);
        }}
        onConfirm={handleDeletePosition}
        title="Xóa vị trí"
        message={`Bạn có chắc chắn muốn xóa vị trí "${selectedPosition?.positionName || `Vị trí ${selectedPosition?.index}`}"? Thao tác này không thể hoàn tác.`}
        isLoading={isLoading}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Nhập vị trí"
        description="Chọn file Excel để nhập danh sách vị trí"
        templateFileName="positions_template.xlsx"
        isLoading={isLoading}
      />

      {/* Device Detail Modal */}
      <DeviceDetailModal
        open={showDeviceModal}
        onOpenChange={setShowDeviceModal}
        device={selectedDevice}
      />
    </div>
  );
}