'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Monitor, ArrowLeft } from 'lucide-react';
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
import { Position, Zone, CreatePositionRequest, UpdatePositionRequest } from '@/types/location.type';

// Mock data - will be replaced with actual API calls
const mockZones: Zone[] = [
  {
    id: '1',
    zoneCode: 'Z01',
    zoneName: 'Dây chuyền lắp ráp A',
    description: 'Dây chuyền lắp ráp sản phẩm loại A',
    areaId: '1',
    areaName: 'Khu vực sản xuất chính',
    areaCode: 'KV01',
    createdAt: '2024-01-15T09:30:00Z',
    updatedAt: '2024-01-15T09:30:00Z',
    positionCount: 12
  },
  {
    id: '2',
    zoneCode: 'Z02',
    zoneName: 'Dây chuyền lắp ráp B',
    description: 'Dây chuyền lắp ráp sản phẩm loại B',
    areaId: '1',
    areaName: 'Khu vực sản xuất chính',
    areaCode: 'KV01',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    positionCount: 8
  },
  {
    id: '3',
    zoneCode: 'Z03',
    zoneName: 'Khu kiểm tra đầu vào',
    description: 'Khu kiểm tra chất lượng nguyên liệu đầu vào',
    areaId: '2',
    areaName: 'Khu vực kiểm định',
    areaCode: 'KV02',
    createdAt: '2024-01-16T11:00:00Z',
    updatedAt: '2024-01-16T11:00:00Z',
    positionCount: 6
  }
];

const mockPositions: Position[] = [
  {
    id: '1',
    positionCode: 'P01',
    positionName: 'Máy hàn số 1',
    description: 'Máy hàn tự động cho dây chuyền A',
    zoneId: '1',
    zoneName: 'Dây chuyền lắp ráp A',
    zoneCode: 'Z01',
    areaName: 'Khu vực sản xuất chính',
    areaCode: 'KV01',
    createdAt: '2024-01-15T09:45:00Z',
    updatedAt: '2024-01-15T09:45:00Z',
    deviceCount: 3
  },
  {
    id: '2',
    positionCode: 'P02',
    positionName: 'Máy khoan CNC',
    description: 'Máy khoan CNC 3 trục',
    zoneId: '1',
    zoneName: 'Dây chuyền lắp ráp A',
    zoneCode: 'Z01',
    areaName: 'Khu vực sản xuất chính',
    areaCode: 'KV01',
    createdAt: '2024-01-15T10:15:00Z',
    updatedAt: '2024-01-15T10:15:00Z',
    deviceCount: 2
  },
  {
    id: '3',
    positionCode: 'P03',
    positionName: 'Trạm kiểm tra chất lượng',
    description: 'Trạm kiểm tra chất lượng tự động',
    zoneId: '3',
    zoneName: 'Khu kiểm tra đầu vào',
    zoneCode: 'Z03',
    areaName: 'Khu vực kiểm định',
    areaCode: 'KV02',
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-16T11:30:00Z',
    deviceCount: 1
  }
];

export default function PositionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.["workspace-id"];
  
  const selectedZoneId = searchParams.get('zone');

  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [positions, setPositions] = useState<Position[]>(mockPositions);
  const [filteredPositions, setFilteredPositions] = useState<Position[]>(mockPositions);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterZoneId, setFilterZoneId] = useState<string>(selectedZoneId || 'all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const selectedZone = zones.find(zone => zone.id === selectedZoneId);

  // Filter positions based on search term and zone
  useEffect(() => {
    let filtered = positions;

    // Filter by zone if specified
    if (filterZoneId && filterZoneId !== 'all') {
      filtered = filtered.filter(position => position.zoneId === filterZoneId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(position => 
        position.positionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.positionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredPositions(filtered);
  }, [positions, searchTerm, filterZoneId]);

  const handleCreatePosition = async (data: CreatePositionRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedZoneData = zones.find(zone => zone.id === data.zoneId);
      
      const newPosition: Position = {
        id: Date.now().toString(),
        positionCode: data.positionCode,
        positionName: data.positionName,
        description: data.description,
        zoneId: data.zoneId,
        zoneName: selectedZoneData?.zoneName,
        zoneCode: selectedZoneData?.zoneCode,
        areaName: selectedZoneData?.areaName,
        areaCode: selectedZoneData?.areaCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deviceCount: 0
      };

      setPositions(prev => [newPosition, ...prev]);
      setIsPositionModalOpen(false);
      toast.success('Thêm vị trí thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm vị trí');
      console.error('Error creating position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePosition = async (data: UpdatePositionRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const selectedZoneData = zones.find(zone => zone.id === data.zoneId);

      setPositions(prev => prev.map(position => 
        position.id === data.id 
          ? { 
              ...position, 
              positionCode: data.positionCode,
              positionName: data.positionName,
              description: data.description,
              zoneId: data.zoneId,
              zoneName: selectedZoneData?.zoneName,
              zoneCode: selectedZoneData?.zoneCode,
              areaName: selectedZoneData?.areaName,
              areaCode: selectedZoneData?.areaCode,
              updatedAt: new Date().toISOString()
            }
          : position
      ));

      setIsPositionModalOpen(false);
      setSelectedPosition(null);
      toast.success('Cập nhật vị trí thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật vị trí');
      console.error('Error updating position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePosition = async () => {
    if (!selectedPosition) return;

    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setPositions(prev => prev.filter(position => position.id !== selectedPosition.id));
      setIsDeleteModalOpen(false);
      setSelectedPosition(null);
      toast.success('Xóa vị trí thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa vị trí');
      console.error('Error deleting position:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Simulate import process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful import
      toast.success('Import dữ liệu thành công!');
      setIsImportModalOpen(false);
      
      // Refresh data here in real implementation
      
    } catch (error) {
      toast.error('Có lỗi xảy ra khi import dữ liệu');
      console.error('Error importing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDevices = (position: Position) => {
    router.push(`/workspace/${workspaceId}/admin/location/positions/${position.id}/devices`);
  };

  const handleBackToZones = () => {
    if (selectedZone) {
      router.push(`/workspace/${workspaceId}/admin/location/zones?area=${selectedZone.areaId}`);
    } else {
      router.push(`/workspace/${workspaceId}/admin/location/zones`);
    }
  };

  const breadcrumbItems = [
    { label: 'Areas', href: `/workspace/${workspaceId}/admin/location/areas` },
    { label: 'Zones', href: `/workspace/${workspaceId}/admin/location/zones` },
    ...(selectedZone 
      ? [{ label: selectedZone.zoneName, isActive: true }]
      : [{ label: 'Positions', isActive: true }]
    )
  ];

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
            Quản lý vị trí
            {selectedZone && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                - {selectedZone.zoneName}
              </span>
            )}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {filteredPositions.length}
          </Badge>
        </div>
        
        <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
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

        {!selectedZone && (
          <Select value={filterZoneId} onValueChange={setFilterZoneId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Lọc theo khu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả khu</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.zoneCode} - {zone.zoneName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Positions Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground">Mã vị trí</TableHead>
              <TableHead className="font-semibold text-foreground">Tên vị trí</TableHead>
              {!selectedZone && <TableHead className="font-semibold text-foreground">Khu</TableHead>}
              <TableHead className="font-semibold text-foreground">Mô tả</TableHead>
              <TableHead className="font-semibold text-center text-foreground">Số thiết bị</TableHead>
              <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
              <TableHead className="font-semibold text-center w-12 text-foreground">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPositions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedZone ? 6 : 7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <MapPin className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchTerm ? 'Không tìm thấy vị trí nào' : 'Chưa có vị trí nào'}
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Sử dụng nút Import để thêm dữ liệu vị trí
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredPositions.map((position) => (
                <TableRow key={position.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                    {position.positionCode}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewDevices(position)}
                      className="font-medium hover:text-purple-600 dark:hover:text-purple-400 hover:underline transition-colors text-foreground"
                    >
                      {position.positionName}
                    </button>
                  </TableCell>
                  {!selectedZone && (
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {position.zoneCode} - {position.zoneName}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="max-w-xs">
                    <div className="truncate text-muted-foreground" title={position.description}>
                      {position.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-medium">
                      {position.deviceCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(position.createdAt).toLocaleDateString('vi-VN')}
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewDevices(position)}>
                          <Monitor className="mr-2 h-4 w-4" />
                          Xem thiết bị
                        </DropdownMenuItem>
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
        message={`Bạn có chắc chắn muốn xóa vị trí "${selectedPosition?.positionName}"? Thao tác này không thể hoàn tác.`}
        isLoading={isLoading}
      />

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        title="Import vị trí"
        description="Chọn file Excel để import danh sách vị trí"
        templateFileName="positions_template.xlsx"
        isLoading={isLoading}
      />
    </div>
  );
}