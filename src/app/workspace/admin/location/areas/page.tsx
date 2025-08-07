'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import AreaModal from '@/components/AdminPositionCpn/PositionModalCpn/AreaModal';
import DeleteConfirmModal from '@/components/AdminPositionCpn/PositionModalCpn/DeleteConfirmModal';
import ImportModal from '@/components/AdminPositionCpn/PositionModalCpn/ImportModal';
import { Area, CreateAreaRequest, UpdateAreaRequest } from '@/types/location.type';
import { apiClient } from '@/lib/api-client';

interface AreaWithCounts extends Area {
  zoneCount: number;
  positionCount: number;
  deviceCount: number;
}

export default function AreasPage() {
  const router = useRouter();

  const [areas, setAreas] = useState<AreaWithCounts[]>([]);
  const [filteredAreas, setFilteredAreas] = useState<AreaWithCounts[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCounts, setIsLoadingCounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  // Modal states
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

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

      console.log(`📊 Zones response for area ${areaId}:`, zonesResponse);

      // Handle different response structures for zones
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
        } else if (zonesResponse.zones && Array.isArray(zonesResponse.zones)) {
          zones = zonesResponse.zones;
          zoneCount = zones.length;
        }

        // For each zone, get position and device counts
        for (const zone of zones) {
          try {
            const positionsResponse = await apiClient.location.getPositionsByZoneId(zone.id, 1, 1000);
            
            if (positionsResponse && typeof positionsResponse === 'object') {
              let positions = [];
              
              // Extract positions array from response
              if (positionsResponse.data?.data && Array.isArray(positionsResponse.data.data)) {
                positions = positionsResponse.data.data;
                positionCount += positionsResponse.data.totalCount || positions.length;
              } else if (positionsResponse.data && Array.isArray(positionsResponse.data)) {
                positions = positionsResponse.data;
                positionCount += positions.length;
              } else if (Array.isArray(positionsResponse)) {
                positions = positionsResponse;
                positionCount += positions.length;
              }

              // Count devices in positions
              deviceCount += positions.filter((position: any) => 
                position.device || position.deviceId || (position.deviceCount && position.deviceCount > 0)
              ).length;
            }
          } catch (error) {
            console.warn(`⚠️ Could not fetch positions for zone ${zone.id}:`, error);
          }
        }
      }

      console.log(`📊 Area ${areaId} counts: zones=${zoneCount}, positions=${positionCount}, devices=${deviceCount}`);
      return { zoneCount, positionCount, deviceCount };
    } catch (error) {
      console.error(`❌ Error fetching counts for area ${areaId}:`, error);
      return { zoneCount: 0, positionCount: 0, deviceCount: 0 };
    }
  }, []);

  // Fetch areas from API
  const fetchAreas = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log(`🔄 Đang tải khu vực (trang ${page}, kích thước ${pageSize})...`);

      const response = await apiClient.location.getAreas(page, pageSize);
      console.log("📦 Phản hồi API khu vực:", response);

      // Handle different API response structures
      let areasData: Area[] = [];
      let total = 0;

      if (response && typeof response === 'object') {
        // Case 1: Response has nested data structure
        if (response.data?.data && Array.isArray(response.data.data)) {
          areasData = response.data.data;
          total = response.data.totalCount || response.data.totalItems || areasData.length;
        }
        // Case 2: Response data is directly in response.data
        else if (response.data && Array.isArray(response.data)) {
          areasData = response.data;
          total = response.totalCount || response.totalItems || areasData.length;
        }
        // Case 3: Response is directly an array
        else if (Array.isArray(response)) {
          areasData = response;
          total = response.length;
        }
        // Case 4: Response has areas property
        else if (response.areas && Array.isArray(response.areas)) {
          areasData = response.areas;
          total = response.totalCount || response.totalItems || areasData.length;
        }
        // Case 5: Response has items property
        else if (response.items && Array.isArray(response.items)) {
          areasData = response.items;
          total = response.totalCount || response.totalItems || areasData.length;
        }
        // Case 6: Response has result property
        else if (response.result && Array.isArray(response.result)) {
          areasData = response.result;
          total = response.totalCount || response.totalItems || areasData.length;
        }
        else {
          console.warn("⚠️ Unrecognized response structure:", response);
          // Try to find any array in the response
          const possibleArrays = Object.values(response).filter(Array.isArray);
          if (possibleArrays.length > 0) {
            areasData = possibleArrays[0] as Area[];
            total = areasData.length;
            console.log("✅ Found array data in response:", areasData.length, "items");
          } else {
            throw new Error("Không tìm thấy dữ liệu khu vực trong phản hồi API");
          }
        }
      } else {
        throw new Error("Phản hồi API không hợp lệ");
      }

      console.log(`📊 Đã trích xuất: ${areasData.length} khu vực, tổng: ${total}`);

      // Fetch counts for each area
      setIsLoadingCounts(true);
      const areasWithCounts: AreaWithCounts[] = await Promise.all(
        areasData.map(async (area) => {
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
      console.log("✅ Khu vực và số liệu đã được xử lý thành công");
    } catch (error: any) {
      console.error("❌ Lỗi khi tải khu vực:", error);
      setError(`Không thể tải khu vực: ${error.message || 'Lỗi không xác định'}`);
      setAreas([]);
      setTotalCount(0);
      setIsLoadingCounts(false);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, fetchAreaCounts]);

  useEffect(() => {
    fetchAreas();
  }, [fetchAreas]);

  // Filter areas based on search term
  useEffect(() => {
    const filtered = areas.filter(area => 
      area.areaName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAreas(filtered);
  }, [areas, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleCreateArea = async (data: CreateAreaRequest) => {
    try {
      setIsLoading(true);
      
      // await apiClient.location.createArea(data);
      // toast.success('Khu vực đã được tạo thành công');
      // setIsAreaModalOpen(false);
      
      // Refresh data
      await fetchAreas();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi thêm khu vực: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error creating area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateArea = async (data: UpdateAreaRequest) => {
    try {
      setIsLoading(true);
      
      if (!selectedArea) {
        throw new Error('Không tìm thấy khu vực được chọn');
      }
      
      // await apiClient.location.updateArea(selectedArea.id, data);
      // toast.success('Khu vực đã được cập nhật thành công');
      // setIsAreaModalOpen(false);
      // setSelectedArea(null);
      
      // Refresh data
      await fetchAreas();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi cập nhật khu vực: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error updating area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!selectedArea) return;

    try {
      setIsLoading(true);
      
      // await apiClient.location.deleteArea(selectedArea.id);
      // toast.success('Khu vực đã được xóa thành công');
      // setIsDeleteModalOpen(false);
      // setSelectedArea(null);
      
      // Refresh data
      await fetchAreas();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi xóa khu vực: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error deleting area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      // await apiClient.location.importAreas(formData);
      // toast.success('Dữ liệu khu vực đã được nhập thành công');
      // setIsImportModalOpen(false);
      
      // Refresh data
      await fetchAreas();
    } catch (error: any) {
      toast.error(`Có lỗi xảy ra khi import dữ liệu: ${error.message || 'Lỗi không xác định'}`);
      console.error('Error importing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewZones = (area: AreaWithCounts) => {
    router.push(`/workspace/admin/location/zones?area=${area.id}`);
  };

  const breadcrumbItems = [
    { label: 'Khu vực', isActive: true }
  ];

  // Loading state
  if (isLoading && areas.length === 0) {
    return (
      <div className="space-y-6 p-2 bg-background min-h-screen">
        <LocationBreadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Đang tải khu vực...</span>
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
              onClick={() => fetchAreas()} 
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
          <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-foreground">Quản lý khu vực</h1>
          <Badge variant="secondary" className="text-sm">
            {totalCount}
          </Badge>
          {isLoadingCounts && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải số liệu...
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* <Button 
            onClick={() => setIsAreaModalOpen(true)} 
            variant="outline" 
            className="gap-2"
          >
            <MapPin className="h-4 w-4" />
            Thêm khu vực
          </Button> */}
          <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Nhập dữ liệu
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm khu vực..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Areas Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground">Tên khu vực</TableHead>
              <TableHead className="font-semibold text-center text-foreground">Khu</TableHead>
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
            ) : filteredAreas.length === 0 ? (
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
              filteredAreas.map((area) => (
                <TableRow key={area.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <button
                      onClick={() => handleViewZones(area)}
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
                  <TableCell className="text-muted-foreground">
                    {formatDate(area.createdDate)}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewZones(area)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem khu
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedArea(area);
                            setIsAreaModalOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedArea(area);
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
              Trang {page} trong số {totalPages} ({totalCount} khu vực)
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
      <AreaModal
        isOpen={isAreaModalOpen}
        onClose={() => {
          setIsAreaModalOpen(false);
          setSelectedArea(null);
        }}
        onSubmit={(data) => {
          if (selectedArea) {
            handleUpdateArea(data as UpdateAreaRequest);
          } else {
            handleCreateArea(data as CreateAreaRequest);
          }
        }}
        area={selectedArea}
        isLoading={isLoading}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedArea(null);
        }}
        onConfirm={handleDeleteArea}
        title="Xóa khu vực"
        message={`Bạn có chắc chắn muốn xóa khu vực "${selectedArea?.areaName}"? Thao tác này không thể hoàn tác.`}
        isLoading={isLoading}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Nhập khu vực"
        description="Chọn file Excel để nhập danh sách khu vực"
        templateFileName="areas_template.xlsx"
        isLoading={isLoading}
      />
    </div>
  );
}