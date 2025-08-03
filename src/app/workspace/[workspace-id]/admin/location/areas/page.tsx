'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Upload, MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react';
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

export default function AreasPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.["workspace-id"];

  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [filteredAreas, setFilteredAreas] = useState<Area[]>(mockAreas);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal states
  const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);

  // Filter areas based on search term
  useEffect(() => {
    const filtered = areas.filter(area => 
      area.areaCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      area.areaName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (area.description && area.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredAreas(filtered);
  }, [areas, searchTerm]);

  const handleCreateArea = async (data: CreateAreaRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newArea: Area = {
        id: Date.now().toString(),
        areaCode: data.areaCode,
        areaName: data.areaName,
        description: data.description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        zoneCount: 0
      };

      setAreas(prev => [newArea, ...prev]);
      setIsAreaModalOpen(false);
      toast.success('Thêm khu vực thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm khu vực');
      console.error('Error creating area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateArea = async (data: UpdateAreaRequest) => {
    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAreas(prev => prev.map(area => 
        area.id === data.id 
          ? { 
              ...area, 
              areaCode: data.areaCode,
              areaName: data.areaName,
              description: data.description,
              updatedAt: new Date().toISOString()
            }
          : area
      ));

      setIsAreaModalOpen(false);
      setSelectedArea(null);
      toast.success('Cập nhật khu vực thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật khu vực');
      console.error('Error updating area:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async () => {
    if (!selectedArea) return;

    try {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setAreas(prev => prev.filter(area => area.id !== selectedArea.id));
      setIsDeleteModalOpen(false);
      setSelectedArea(null);
      toast.success('Xóa khu vực thành công!');
    } catch (error) {
      toast.error('Có lỗi xảy ra khi xóa khu vực');
      console.error('Error deleting area:', error);
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

  const handleViewZones = (area: Area) => {
    router.push(`/workspace/${workspaceId}/admin/location/zones?area=${area.id}`);
  };

  const breadcrumbItems = [
    { label: 'Areas', isActive: true }
  ];

  return (
    <div className="space-y-6 p-2 bg-background min-h-screen">
      <LocationBreadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h1 className="text-2xl font-bold text-foreground">Quản lý khu vực</h1>
          <Badge variant="secondary" className="text-sm">
            {filteredAreas.length}
          </Badge>
        </div>
        
        <Button onClick={() => setIsImportModalOpen(true)} className="gap-2">
          <Upload className="h-4 w-4" />
          Import
        </Button>
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
              <TableHead className="font-semibold text-foreground">Mã khu vực</TableHead>
              <TableHead className="font-semibold text-foreground">Tên khu vực</TableHead>
              <TableHead className="font-semibold text-foreground">Mô tả</TableHead>
              <TableHead className="font-semibold text-center text-foreground">Số lượng khu</TableHead>
              <TableHead className="font-semibold text-foreground">Ngày tạo</TableHead>
              <TableHead className="font-semibold text-center w-12 text-foreground">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAreas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <MapPin className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchTerm ? 'Không tìm thấy khu vực nào' : 'Chưa có khu vực nào'}
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Sử dụng nút Import để thêm dữ liệu khu vực
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAreas.map((area) => (
                <TableRow key={area.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-blue-600 dark:text-blue-400">
                    {area.areaCode}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleViewZones(area)}
                      className="font-medium hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors text-foreground"
                    >
                      {area.areaName}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="truncate text-muted-foreground" title={area.description}>
                      {area.description || '-'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-medium">
                      {area.zoneCount || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(area.createdAt).toLocaleDateString('vi-VN')}
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
        title="Import khu vực"
        description="Chọn file Excel để import danh sách khu vực"
        templateFileName="areas_template.xlsx"
        isLoading={isLoading}
      />
    </div>
  );
}