'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Eye, ArrowLeft, Loader2 } from 'lucide-react';
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
import ZoneModal from '@/components/AdminPositionCpn/PositionModalCpn/ZoneModal';
import DeleteConfirmModal from '@/components/AdminPositionCpn/PositionModalCpn/DeleteConfirmModal';
import ImportModal from '@/components/AdminPositionCpn/PositionModalCpn/ImportModal';
import { Zone, Area, CreateZoneRequest, UpdateZoneRequest } from '@/types/location.type';
import { apiClient } from '@/lib/api-client';

interface ZoneWithCounts extends Zone {
  positionCount: number;
  deviceCount: number;
}

export default function ZonesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.["workspace-id"];
  
  const selectedAreaId = searchParams.get('area');

  const [areas, setAreas] = useState<Area[]>([]);
  const [zones, setZones] = useState<ZoneWithCounts[]>([]);
  const [filteredZones, setFilteredZones] = useState<ZoneWithCounts[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAreaId, setFilterAreaId] = useState<string>(selectedAreaId || 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal states
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const selectedArea = areas.find(area => area.id === selectedAreaId);

  // Fetch zone counts (positions, devices)
  const fetchZoneCounts = useCallback(async (zoneId: string): Promise<{
    positionCount: number;
    deviceCount: number;
  }> => {
    try {
      // Get positions for this zone with device information
      const positionsResponse = await apiClient.location.getPositionsByZoneId(zoneId, 1, 1000);
      let positionCount = 0;
      let deviceCount = 0;

      console.log(`📊 Positions response for zone ${zoneId}:`, positionsResponse);

      // Handle different response structures for positions
      if (positionsResponse && typeof positionsResponse === 'object') {
        // Case 1: Response has nested data structure
        if (positionsResponse.data?.data && Array.isArray(positionsResponse.data.data)) {
          const positions = positionsResponse.data.data;
          positionCount = positionsResponse.data.totalCount || positions.length;
          // Count positions that have a device
          deviceCount = positions.filter(position => 
            position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
          ).length;
        }
        // Case 2: Response data is directly in response.data
        else if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
          const positions = positionsResponse.data;
          positionCount = positions.length;
          deviceCount = positions.filter(position => 
            position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
          ).length;
        }
        // Case 3: Response is directly an array
        else if (Array.isArray(positionsResponse)) {
          const positions = positionsResponse;
          positionCount = positions.length;
          deviceCount = positions.filter(position => 
            position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
          ).length;
        }
        // Case 4: Response has positions property
        else if (positionsResponse.positions && Array.isArray(positionsResponse.positions)) {
          const positions = positionsResponse.positions;
          positionCount = positions.length;
          deviceCount = positions.filter(position => 
            position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
          ).length;
        }
      }

      console.log(`📊 Zone ${zoneId} counts: positions=${positionCount}, devices=${deviceCount}`);
      return { positionCount, deviceCount };
    } catch (error) {
      console.error(`❌ Error fetching counts for zone ${zoneId}:`, error);
      return { positionCount: 0, deviceCount: 0 };
    }
  }, []);

  // Fetch areas for dropdown filter
  const fetchAreas = useCallback(async () => {
    try {
      console.log("🔄 Fetching areas for zone filtering...");
      const response = await apiClient.location.getAreas(1, 100); // Get all areas for filter
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
      console.error("❌ Lỗi khi tải khu vực:", error);
    }
  }, []);

  // Fetch zones from API with improved area name mapping
  const fetchZones = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Đang tải khu (trang ${page}, kích thước ${pageSize})...`);

      let response;
      if (selectedAreaId) {
        // Fetch zones for specific area
        response = await apiClient.location.getZonesByAreaId(selectedAreaId, page, pageSize);
      } else {
        // Fetch all zones
        response = await apiClient.location.getZones(page, pageSize);
      }
      
      console.log("📦 Phản hồi API khu:", response);

      // Handle different API response structures
      let zonesData: Zone[] = [];
      let total = 0;

      if (response && typeof response === 'object') {
        // Case 1: Response has nested data structure
        if (response.data?.data && Array.isArray(response.data.data)) {
          zonesData = response.data.data;
          total = response.data.totalCount || response.data.totalItems || zonesData.length;
        }
        // Case 2: Response data is directly in response.data
        else if (response.data && Array.isArray(response.data)) {
          zonesData = response.data;
          total = response.totalCount || response.totalItems || zonesData.length;
        }
        // Case 3: Response is directly an array
        else if (Array.isArray(response)) {
          zonesData = response;
          total = response.length;
        }
        // Case 4: Response has zones property
        else if (response.zones && Array.isArray(response.zones)) {
          zonesData = response.zones;
          total = response.totalCount || response.totalItems || zonesData.length;
        }
        // Case 5: Response has items property
        else if (response.items && Array.isArray(response.items)) {
          zonesData = response.items;
          total = response.totalCount || response.totalItems || zonesData.length;
        }
        else {
          console.warn("⚠️ Unrecognized response structure:", response);
          // Try to find any array in the response
          const possibleArrays = Object.values(response).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            zonesData = possibleArrays[0] as Zone[];
            total = zonesData.length;
            console.log("✅ Found array data in response:", zonesData.length, "items");
          } else {
            throw new Error("Không tìm thấy dữ liệu khu trong phản hồi API");
          }
        }
      } else {
        throw new Error("Phản hồi API không hợp lệ");
      }

      // Map area names if not present in zone data
      const zonesWithAreaNames = await Promise.all(
        zonesData.map(async (zone) => {
          // If zone already has areaName, use it
          if (zone.areaName) {
            return zone;
          }
          
          // Otherwise, find area name from areas array
          const area = areas.find(a => a.id === zone.areaId);
          return {
            ...zone,
            areaName: area?.areaName || 'Unknown Area',
            areaCode: area?.areaCode || 'N/A'
          };
        })
      );

      console.log(`📊 Đã trích xuất: ${zonesWithAreaNames.length} khu, tổng: ${total}`);

      // Fetch counts for each zone
      setIsLoadingCounts(true);
      const zonesWithCounts: ZoneWithCounts[] = await Promise.all(
        zonesWithAreaNames.map(async (zone) => {
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
      console.log("✅ Khu và số liệu đã được xử lý thành công");
    } catch (error: any) {
      console.error("❌ Lỗi khi tải khu:", error);
      setError(`Không thể tải khu: ${error.message || 'Lỗi không xác định'}`);
      setZones([]);
      setTotalCount(0);
      setIsLoadingCounts(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, selectedAreaId, fetchZoneCounts, areas]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  // Filter zones based on search term and area
  useEffect(() => {
    let filtered = zones;

    // Filter by area if specified and not using selectedAreaId
    if (!selectedAreaId && filterAreaId && filterAreaId !== 'all') {
      filtered = filtered.filter(zone => zone.areaId === filterAreaId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(zone => 
        zone.zoneName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredZones(filtered);
  }, [zones, searchTerm, filterAreaId, selectedAreaId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleCreateZone = async (data: CreateZoneRequest) => {
    try {
      setIsLoading(true);
      
      await apiClient.location.createZone(data);
      toast.success('Khu đã được tạo thành công');
      setIsZoneModalOpen(false);
      
      // Refresh data
      await fetchZones();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi thêm khu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error creating zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateZone = async (data: UpdateZoneRequest) => {
    try {
      setIsLoading(true);
      
      if (!selectedZone) {
        throw new Error('Không tìm thấy khu được chọn');
      }
      
      await apiClient.location.updateZone(selectedZone.id, data);
      toast.success('Khu đã được cập nhật thành công');
      setIsZoneModalOpen(false);
      setSelectedZone(null);
      
      // Refresh data
      await fetchZones();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi cập nhật khu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error updating zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;

    try {
      setIsLoading(true);
      
      await apiClient.location.deleteZone(selectedZone.id);
      toast.success('Khu đã được xóa thành công');
      setIsDeleteModalOpen(false);
      setSelectedZone(null);
      
      // Refresh data
      await fetchZones();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi xóa khu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error deleting zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      await apiClient.location.importZones(formData);
      toast.success('Dữ liệu khu đã được nhập thành công');
      setIsImportModalOpen(false);
      
      // Refresh data
      await fetchZones();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi import dữ liệu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error importing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewPositions = (zone: ZoneWithCounts) => {
    router.push(`/workspace/${workspaceId}/admin/location/positions?zone=${zone.id}`);
  };

  const handleBackToAreas = () => {
    router.push(`/workspace/${workspaceId}/admin/location/areas`);
  };

  const breadcrumbItems = [
    { label: 'Khu vực', href: `/workspace/${workspaceId}/admin/location/areas` },
    ...(selectedArea 
      ? [{ label: selectedArea.areaName, isActive: true }]
      : [{ label: 'Khu', isActive: true }]
    )
  ];

  // Loading state
  if (isLoading && zones.length === 0) {
    return (
      <div className="space-y-6 p-2 bg-background min-h-screen">
        <LocationBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải khu...</span>
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
              onClick={() => fetchZones()} 
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
          <h1 className="text-2xl font-bold text-foreground">
            {selectedArea ? `Quản lý khu (${totalCount} khu) - Khu vực: ${selectedArea.areaName}` : 'Quản lý khu'}
          </h1>
          {!selectedArea && (
            <Badge variant="secondary" className="text-sm">
              {totalCount}
            </Badge>
          )}
          {isLoadingCounts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải số liệu...
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* <Button 
            onClick={() => setIsZoneModalOpen(true)} 
            variant="outline" 
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Thêm khu
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
            placeholder="Tìm kiếm khu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
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

      {/* Zones Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground">Tên khu</TableHead>
              {!selectedArea && <TableHead className="font-semibold text-foreground">Khu vực</TableHead>}
              <TableHead className="font-semibold text-center text-foreground">Vị trí</TableHead>
              <TableHead className="font-semibold text-center text-foreground">Thiết bị</TableHead>
              <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
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
            ) : filteredZones.length === 0 ? (
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
              filteredZones.map((zone) => (
                <TableRow key={zone.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <button
                      onClick={() => handleViewPositions(zone)}
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
                  <TableCell className="text-muted-foreground">
                    {formatDate(zone.createdDate)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewPositions(zone)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem vị trí
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedZone(zone);
                            setIsZoneModalOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedZone(zone);
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
            <div className="text-sm text-gray-500">
              Trang {page} trong số {totalPages} ({totalCount} khu)
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
      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => {
          setIsZoneModalOpen(false);
          setSelectedZone(null);
        }}
        onSubmit={(data) => {
          if (selectedZone) {
            handleUpdateZone(data as UpdateZoneRequest);
          } else {
            handleCreateZone(data as CreateZoneRequest);
          }
        }}
        zone={selectedZone}
        areas={areas}
        isLoading={isLoading}
        selectedAreaId={selectedAreaId || undefined}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedZone(null);
        }}
        onConfirm={handleDeleteZone}
        title="Xóa khu"
        message={`Bạn có chắc chắn muốn xóa khu "${selectedZone?.zoneName}"? Thao tác này không thể hoàn tác.`}
        isLoading={isLoading}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Nhập khu"
        description="Chọn file Excel để nhập danh sách khu"
        templateFileName="zones_template.xlsx"
        isLoading={isLoading}
      />
    </div>
  );
}