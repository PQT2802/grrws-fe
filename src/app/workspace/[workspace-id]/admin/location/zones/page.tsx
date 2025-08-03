'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Eye, ArrowLeft } from 'lucide-react';
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

// Mock data - will be replaced with actual API calls
const mockAreas: Area[] = [
  {
    id: '1',
    areaCode: 'KV01',
    areaName: 'Khu vực sản xuất chính',
    description: 'Khu vực sản xuất các sản phẩm chính của nhà máy',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    zoneCount: 5
  },
  {
    id: '2',
    areaCode: 'KV02',
    areaName: 'Khu vực kiểm định',
    description: 'Khu vực kiểm tra chất lượng sản phẩm',
    createdAt: '2024-01-16T10:30:00Z',
    updatedAt: '2024-01-16T10:30:00Z',
    zoneCount: 3
  },
  {
    id: '3',
    areaCode: 'KV03',
    areaName: 'Khu vực kho bãi',
    description: 'Khu vực lưu trữ nguyên liệu và thành phẩm',
    createdAt: '2024-01-17T14:15:00Z',
    updatedAt: '2024-01-17T14:15:00Z',
    zoneCount: 8
  }
];

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

export default function ZonesPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceId = params?.["workspace-id"];
  
  const selectedAreaId = searchParams.get('area');

  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [filteredZones, setFilteredZones] = useState<Zone[]>(mockZones);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAreaId, setFilterAreaId] = useState<string>(selectedAreaId || 'all');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);

  const selectedArea = areas.find(area => area.id === selectedAreaId);

  // Filter zones based on search term and area
  useEffect(() => {
    let filtered = zones;

    // Filter by area if specified
    if (filterAreaId && filterAreaId !== 'all') {
      filtered = filtered.filter(zone => zone.areaId === filterAreaId);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(zone => 
        zone.zoneCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        zone.zoneName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (zone.description && zone.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredZones(filtered);
  }, [zones, searchTerm, filterAreaId]);

  const handleCreateZone = async (data: CreateZoneRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectedAreaData = areas.find(area => area.id === data.areaId);
      
      const newZone: Zone = {
        id: Date.now().toString(),
        zoneCode: data.zoneCode,
        zoneName: data.zoneName,
        description: data.description,
        areaId: data.areaId,
        areaName: selectedAreaData?.areaName,
        areaCode: selectedAreaData?.areaCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        positionCount: 0
      };

      setZones(prev => [newZone, ...prev]);
      setIsZoneModalOpen(false);
      toast.success('Thêm khu thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm khu');
      console.error('Error creating zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateZone = async (data: UpdateZoneRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const selectedAreaData = areas.find(area => area.id === data.areaId);

      setZones(prev => prev.map(zone => 
        zone.id === data.id 
          ? { 
              ...zone, 
              zoneCode: data.zoneCode,
              zoneName: data.zoneName,
              description: data.description,
              areaId: data.areaId,
              areaName: selectedAreaData?.areaName,
              areaCode: selectedAreaData?.areaCode,
              updatedAt: new Date().toISOString()
            }
          : zone
      ));

      setIsZoneModalOpen(false);
      setSelectedZone(null);
      toast.success('Cập nhật khu thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật khu');
      console.error('Error updating zone:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;

    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setZones(prev => prev.filter(zone => zone.id !== selectedZone.id));
      setIsDeleteModalOpen(false);
      setSelectedZone(null);
      toast.success('Xóa khu thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa khu');
      console.error('Error deleting zone:', error);
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

  const handleViewPositions = (zone: Zone) => {
    router.push(`/workspace/${workspaceId}/admin/location/positions?zone=${zone.id}`);
  };

  const handleBackToAreas = () => {
    router.push(`/workspace/${workspaceId}/admin/location/areas`);
  };

  const breadcrumbItems = [
    { label: 'Areas', href: `/workspace/${workspaceId}/admin/location/areas` },
    ...(selectedArea 
      ? [{ label: selectedArea.areaName, isActive: true }]
      : [{ label: 'Zones', isActive: true }]
    )
  ];

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
            Quản lý khu
            {selectedArea && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                - {selectedArea.areaName}
              </span>
            )}
          </h1>
          <Badge variant="secondary" className="text-sm">
            {filteredZones.length}
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
                  {area.areaCode} - {area.areaName}
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
              <TableHead className="font-semibold text-foreground">Mã khu</TableHead>
              <TableHead className="font-semibold text-foreground">Tên khu</TableHead>
              {!selectedArea && <TableHead className="font-semibold text-foreground">Khu vực</TableHead>}
              <TableHead className="font-semibold text-foreground">Mô tả</TableHead>
              <TableHead className="font-semibold text-center text-foreground">Số vị trí</TableHead>
              <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
              <TableHead className="font-semibold text-center w-12 text-foreground">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredZones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={selectedArea ? 6 : 7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <MapPin className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchTerm ? 'Không tìm thấy khu nào' : 'Chưa có khu nào'}
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Sử dụng nút Import để thêm dữ liệu khu
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredZones.map((zone) => (
                <TableRow key={zone.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-green-600 dark:text-green-400">
                    {zone.zoneCode}
                  </TableCell>
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
                      <Badge variant="outline" className="text-xs">
                        {zone.areaCode} - {zone.areaName}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="max-w-xs">
                    <div className="truncate text-muted-foreground" title={zone.description}>
                      {zone.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-medium">
                      {zone.positionCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(zone.createdAt).toLocaleDateString('vi-VN')}
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
        title="Import khu"
        description="Chọn file Excel để import danh sách khu"
        templateFileName="zones_template.xlsx"
        isLoading={isLoading}
      />
    </div>
  );
}