'use client';

import { useState, useEffect } from 'react';
import { Search, Monitor, ArrowLeft, Calendar, Settings, Activity, AlertCircle, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
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
import { Position } from '@/types/location.type';

// Device interface for this page
interface Device {
  id: string;
  deviceCode: string;
  deviceName: string;
  deviceType: string;
  status: 'Active' | 'Inactive' | 'Maintenance' | 'Error';
  lastMaintenanceDate: string;
  installationDate: string;
  serialNumber: string;
  manufacturer: string;
  model: string;
}

// Mock data - will be replaced with actual API calls
const mockPosition: Position = {
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
};

const mockDevices: Device[] = [
  {
    id: '1',
    deviceCode: 'WLD001',
    deviceName: 'Máy hàn tự động Model X1',
    deviceType: 'Welding Machine',
    status: 'Active',
    lastMaintenanceDate: '2024-01-10T08:00:00Z',
    installationDate: '2023-06-15T09:00:00Z',
    serialNumber: 'WLD-X1-2023-001',
    manufacturer: 'TechWeld Corp',
    model: 'AutoWeld X1'
  },
  {
    id: '2',
    deviceCode: 'SNS001',
    deviceName: 'Cảm biến nhiệt độ',
    deviceType: 'Temperature Sensor',
    status: 'Active',
    lastMaintenanceDate: '2024-01-08T10:30:00Z',
    installationDate: '2023-06-16T11:00:00Z',
    serialNumber: 'TEMP-SNS-2023-001',
    manufacturer: 'SensorTech Ltd',
    model: 'TempSense Pro'
  },
  {
    id: '3',
    deviceCode: 'CTL001',
    deviceName: 'Bộ điều khiển PLC',
    deviceType: 'Controller',
    status: 'Maintenance',
    lastMaintenanceDate: '2024-01-12T14:00:00Z',
    installationDate: '2023-06-17T13:30:00Z',
    serialNumber: 'PLC-CTL-2023-001',
    manufacturer: 'AutoControl Systems',
    model: 'PLC Master 500'
  },
  {
    id: '4',
    deviceCode: 'PWR001',
    deviceName: 'Nguồn điện 24V',
    deviceType: 'Power Supply',
    status: 'Error',
    lastMaintenanceDate: '2024-01-05T16:00:00Z',
    installationDate: '2023-06-18T15:00:00Z',
    serialNumber: 'PWR-24V-2023-001',
    manufacturer: 'PowerTech Inc',
    model: 'PowerMax 24V-50A'
  },
  {
    id: '5',
    deviceCode: 'MTR001',
    deviceName: 'Motor servo 1.5kW',
    deviceType: 'Servo Motor',
    status: 'Inactive',
    lastMaintenanceDate: '2024-01-03T12:00:00Z',
    installationDate: '2023-06-19T14:30:00Z',
    serialNumber: 'SERVO-1.5KW-2023-001',
    manufacturer: 'MotorWorks Ltd',
    model: 'ServoMax 1.5kW'
  }
];

export default function PositionDevicesPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceId = params?.["workspace-id"];
  const positionId = params?.positionId;

  const [position, setPosition] = useState<Position>(mockPosition);
  const [devices, setDevices] = useState<Device[]>(mockDevices);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>(mockDevices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Get unique device types and statuses for filters
  const deviceTypes = [...new Set(devices.map(device => device.deviceType))];
  const deviceStatuses = [...new Set(devices.map(device => device.status))];

  // Filter devices based on search term, status, and type
  useEffect(() => {
    let filtered = devices;

    // Filter by status
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }

    // Filter by type
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(device => device.deviceType === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(device => 
        device.deviceCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.model.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDevices(filtered);
  }, [devices, searchTerm, statusFilter, typeFilter]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'maintenance': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'inactive': return <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      default: return <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'Active': 'Hoạt động',
      'Inactive': 'Không hoạt động',
      'Maintenance': 'Bảo trì',
      'Error': 'Lỗi'
    };
    return statusMap[status] || status;
  };

  const handleViewDevice = (device: Device) => {
    // Future: Navigate to device detail page
    console.log('View device:', device);
    // toast.info(`Xem chi tiết thiết bị: ${device.deviceName}`);
  };

  const handleEditDevice = (device: Device) => {
    // Future: Open edit device modal
    console.log('Edit device:', device);
    // toast.info(`Chỉnh sửa thiết bị: ${device.deviceName}`);
  };

  const handleDeleteDevice = (device: Device) => {
    // Future: Open delete confirmation modal
    console.log('Delete device:', device);
    // toast.info(`Xóa thiết bị: ${device.deviceName}`);
  };

  const handleBackToPositions = () => {
    router.push(`/workspace/${workspaceId}/admin/location/positions?zone=${position.zoneId}`);
  };

  const breadcrumbItems = [
    { label: 'Areas', href: `/workspace/${workspaceId}/admin/location/areas` },
    { label: 'Zones', href: `/workspace/${workspaceId}/admin/location/zones` },
    { label: 'Positions', href: `/workspace/${workspaceId}/admin/location/positions` },
    { label: position.positionName, isActive: true }
  ];

  return (
    <div className="space-y-6 p-6 bg-background min-h-screen">
      <LocationBreadcrumb items={breadcrumbItems} />

      {/* Position Info Header */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleBackToPositions}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Button>
            
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Monitor className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                <h1 className="text-2xl font-bold text-foreground">
                  {position.positionName}
                </h1>
                <Badge variant="outline" className="text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-600">
                  {position.positionCode}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <span className="font-medium">Khu:</span>
                  <Badge variant="secondary" className="text-xs">
                    {position.zoneCode} - {position.zoneName}
                  </Badge>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium">Khu vực:</span>
                  <Badge variant="secondary" className="text-xs">
                    {position.areaCode} - {position.areaName}
                  </Badge>
                </div>
              </div>
              
              {position.description && (
                <p className="text-muted-foreground mt-2">{position.description}</p>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{filteredDevices.length}</div>
            <div className="text-sm text-muted-foreground">Thiết bị</div>
          </div>
        </div>
      </div>

      {/* Device Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Active', 'Inactive', 'Maintenance', 'Error'].map((status) => {
          const count = devices.filter(d => d.status === status).length;
          const percentage = devices.length > 0 ? Math.round((count / devices.length) * 100) : 0;
          
          return (
            <div key={status} className="bg-card rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium text-muted-foreground">
                      {getVietnameseStatus(status)}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-foreground">{count}</div>
                  <div className="text-xs text-muted-foreground">{percentage}% tổng số</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm thiết bị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            {deviceStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {getVietnameseStatus(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Lọc theo loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả loại thiết bị</SelectItem>
            {deviceTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Devices Table */}
      <div className="bg-card rounded-lg border border-border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border">
              <TableHead className="font-semibold text-foreground">Mã thiết bị</TableHead>
              <TableHead className="font-semibold text-foreground">Tên thiết bị</TableHead>
              <TableHead className="font-semibold text-foreground">Loại</TableHead>
              <TableHead className="font-semibold text-foreground">Trạng thái</TableHead>
              <TableHead className="font-semibold text-foreground">Nhà sản xuất</TableHead>
              <TableHead className="font-semibold text-foreground">Bảo trì gần nhất</TableHead>
              <TableHead className="font-semibold text-center w-12 text-foreground">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDevices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Monitor className="h-12 w-12 text-muted-foreground/50" />
                    <div>
                      <p className="text-lg font-medium text-muted-foreground">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                          ? 'Không tìm thấy thiết bị nào' 
                          : 'Chưa có thiết bị nào'}
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                          ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm'
                          : 'Thiết bị sẽ được hiển thị khi được gán vào vị trí này'}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredDevices.map((device) => (
                <TableRow key={device.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium text-purple-600 dark:text-purple-400">
                    {device.deviceCode}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{device.deviceName}</div>
                      <div className="text-sm text-muted-foreground">
                        {device.model} - S/N: {device.serialNumber}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {device.deviceType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(device.status)}
                      <Badge className={getStatusColor(device.status)}>
                        {getVietnameseStatus(device.status)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {device.manufacturer}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(device.lastMaintenanceDate).toLocaleDateString('vi-VN')}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleViewDevice(device)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteDevice(device)}
                          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Gỡ bỏ
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
    </div>
  );
}