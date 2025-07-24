'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Settings, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Eye, Search, Filter, Calendar, User, ArrowRightLeft } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious, 
  PaginationEllipsis 
} from '@/components/ui/pagination';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { SPAREPART_REQUEST, MACHINE_REPLACEMENT_REQUEST } from '@/types/sparePart.type';
import SparePartRequestDetailModal from './SparePartRequestDetailModal';
import MachineRequestDetailModal from './MachineRequestDetailModal';

interface RequestSummaryData {
  sparePartRequests: {
    total: number;
    confirmed: number;
    unconfirmed: number;
    insufficient: number;
    delivered: number;
  };
  machineRequests: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

// Unified request interface for the merged list
interface UnifiedRequest {
  id: string;
  type: 'sparepart' | 'machine';
  title: string;
  description: string;
  requestDate: string;
  status: string;
  assigneeName: string;
  // Spare part specific
  requestCode?: string;
  sparePartCount?: number;
  assigneeConfirm?: boolean;
  stockKeeperConfirm?: boolean;
  // Machine specific
  oldDeviceName?: string;
  newDeviceName?: string;
  // Original data for detail modal
  originalData: SPAREPART_REQUEST | MACHINE_REPLACEMENT_REQUEST;
}

export default function RequestSummaryAdmin() {
  const [summaryData, setSummaryData] = useState<RequestSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  
  // Request list states
  const [allRequests, setAllRequests] = useState<UnifiedRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deviceCache, setDeviceCache] = useState<{[key: string]: string}>({});
  
  // Modal states
  const [selectedSparePartRequest, setSelectedSparePartRequest] = useState<any>(null);
  const [selectedMachineRequest, setSelectedMachineRequest] = useState<MACHINE_REPLACEMENT_REQUEST | null>(null);
  const [isSparePartModalOpen, setIsSparePartModalOpen] = useState(false);
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  
  // Pagination state for requests list
  const [requestsPagination, setRequestsPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchSummaryData();
    fetchAllRequests(1, requestsPagination.pageSize);
  }, []);

  // Fetch device name by ID with caching
  const fetchDeviceName = async (deviceId: string): Promise<string> => {
    if (deviceCache[deviceId]) {
      return deviceCache[deviceId];
    }
    
    try {
      const device = await apiClient.device.getDeviceById(deviceId);
      const deviceName = device.deviceName || `Device ${deviceId.slice(0, 8)}`;
      
      setDeviceCache(prev => ({
        ...prev,
        [deviceId]: deviceName
      }));
      
      return deviceName;
    } catch (error) {
      console.error(`Failed to fetch device name for ID: ${deviceId}`, error);
      return `Device ${deviceId.slice(0, 8)}`;
    }
  };

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch both spare part and machine requests to create summary
      const [sparePartResponse, machineResponse] = await Promise.all([
        apiClient.sparePart.getRequests(1, 100), // Get first 100 to calculate stats
        apiClient.machine.getReplacementRequests(1, 100)
      ]);

      // Process spare part data
      const sparePartData = sparePartResponse.data?.data || sparePartResponse.data || [];
      const sparePartStats = {
        total: sparePartData.length,
        unconfirmed: sparePartData.filter((req: any) => req.status.toLowerCase() === 'unconfirmed').length,
        confirmed: sparePartData.filter((req: any) => req.status.toLowerCase() === 'confirmed').length,
        insufficient: sparePartData.filter((req: any) => req.status.toLowerCase() === 'insufficient').length,
        delivered: sparePartData.filter((req: any) => req.status.toLowerCase() === 'delivered').length,
      };

      // Process machine data
      const machineData = machineResponse.data?.data || machineResponse.data || [];
      const machineStats = {
        total: machineData.length,
        pending: machineData.filter((req: any) => req.status.toLowerCase() === 'pending').length,
        confirmed: machineData.filter((req: any) => req.status.toLowerCase() === 'confirmed').length,
        completed: machineData.filter((req: any) => req.status.toLowerCase() === 'completed').length,
        cancelled: machineData.filter((req: any) => req.status.toLowerCase() === 'cancelled').length,
      };

      setSummaryData({
        sparePartRequests: sparePartStats,
        machineRequests: machineStats,
      });

    } catch (error) {
      console.error('Failed to fetch summary data:', error);
      toast.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllRequests = async (page: number = 1, pageSize: number = 10) => {
    try {
      setIsLoadingRequests(true);
      
      // Fetch both spare part and machine requests
      const [sparePartResponse, machineResponse] = await Promise.all([
        apiClient.sparePart.getRequests(page, Math.ceil(pageSize / 2)), // Split page size
        apiClient.machine.getReplacementRequests(page, Math.ceil(pageSize / 2))
      ]);

      // Process spare part data
      let sparePartData: SPAREPART_REQUEST[] = [];
      if (sparePartResponse.data?.data && Array.isArray(sparePartResponse.data.data)) {
        sparePartData = sparePartResponse.data.data;
      } else if (Array.isArray(sparePartResponse.data)) {
        sparePartData = sparePartResponse.data;
      } else if (Array.isArray(sparePartResponse)) {
        sparePartData = sparePartResponse;
      }

      // Process machine data
      let machineData: MACHINE_REPLACEMENT_REQUEST[] = [];
      if (machineResponse.data?.data && Array.isArray(machineResponse.data.data)) {
        machineData = machineResponse.data.data;
      } else if (Array.isArray(machineResponse.data)) {
        machineData = machineResponse.data;
      } else if (Array.isArray(machineResponse)) {
        machineData = machineResponse;
      }

      // Fetch device names for machine requests
      const deviceIds = new Set<string>();
      machineData.forEach(req => {
        if (req.oldDeviceId) deviceIds.add(req.oldDeviceId);
        if (req.newDeviceId) deviceIds.add(req.newDeviceId);
      });

      // Fetch device names not in cache
      const devicePromises = Array.from(deviceIds)
        .filter(id => !deviceCache[id])
        .map(id => fetchDeviceName(id));
      
      if (devicePromises.length > 0) {
        await Promise.all(devicePromises);
      }

      // Transform to unified format
      const unifiedRequests: UnifiedRequest[] = [
        // Transform spare part requests
        ...sparePartData.map(req => ({
          id: req.id,
          type: 'sparepart' as const,
          title: req.requestCode,
          description: `Yêu cầu ${req.sparePartUsages?.length || 0} linh kiện`,
          requestDate: req.requestDate,
          status: req.status,
          assigneeName: req.assigneeName,
          requestCode: req.requestCode,
          sparePartCount: req.sparePartUsages?.length || 0,
          originalData: req
        })),
        // Transform machine requests
        ...machineData.map(req => {
          const oldDeviceName = req.oldDeviceId 
            ? (deviceCache[req.oldDeviceId] || `Device ${req.oldDeviceId.slice(0, 8)}`)
            : 'No Device';
          const newDeviceName = req.newDeviceId 
            ? (deviceCache[req.newDeviceId] || `Device ${req.newDeviceId.slice(0, 8)}`)
            : 'No Device';
          
          return {
            id: req.id,
            type: 'machine' as const,
            title: req.title.includes('-') ? req.title.split('-')[0] : `MR-${req.id.slice(0, 8)}`,
            description: req.description || 'Yêu cầu thay thế thiết bị',
            requestDate: req.requestDate,
            status: req.status,
            assigneeName: req.assigneeName,
            oldDeviceName,
            newDeviceName,
            originalData: req
          };
        })
      ];

      // Sort by newest first
      const sortedRequests = unifiedRequests.sort((a, b) => 
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
      );

      setAllRequests(sortedRequests);
      
      // Calculate total items and pages
      const totalItems = sparePartData.length + machineData.length;
      const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      
      setRequestsPagination({
        currentPage: page,
        pageSize,
        totalItems,
        totalPages
      });

    } catch (error) {
      console.error('Failed to fetch all requests:', error);
      toast.error('Không thể tải danh sách yêu cầu');
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Helper functions
  const getVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Đang chờ xử lý',
      'APPROVED': 'Đã duyệt',
      'CONFIRMED': 'Đã xác nhận',
      'UNCONFIRMED': 'Chưa xác nhận',
      'DELIVERED': 'Đã giao',
      'INSUFFICIENT': 'Thiếu hàng',
      'REJECTED': 'Từ chối',
      'CANCELLED': 'Đã hủy',
      'INPROGRESS': 'Đang thực hiện',
      'COMPLETED': 'Hoàn thành'
    };
    return statusMap[status.toUpperCase()] || status;
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} phút trước`;
    } else if (diffInHours < 24) {
      return `${diffInHours} giờ trước`;
    } else {
      return "Trên 1 ngày";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'delivered': case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'insufficient': case 'cancelled': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': case 'unconfirmed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'delivered': case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'insufficient': case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    return [...new Set(allRequests.map(req => req.status))];
  }, [allRequests]);

  // Filter requests based on search, status, and type
  const filteredRequests = useMemo(() => {
    return allRequests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allRequests, searchTerm, statusFilter, typeFilter]);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (requestsPagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= requestsPagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (requestsPagination.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(requestsPagination.totalPages);
      } else if (requestsPagination.currentPage >= requestsPagination.totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = requestsPagination.totalPages - 3; i <= requestsPagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = requestsPagination.currentPage - 1; i <= requestsPagination.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(requestsPagination.totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    fetchAllRequests(page, requestsPagination.pageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    fetchAllRequests(1, pageSize);
  };

  const handleViewRequest = async (request: UnifiedRequest) => {
    try {
      if (request.type === 'sparepart') {
        // Fetch detailed spare part request data
        const detailResponse = await apiClient.sparePart.getRequestById(request.id);
        setSelectedSparePartRequest(detailResponse.data || detailResponse);
        setIsSparePartModalOpen(true);
      } else {
        // Use machine request data directly
        setSelectedMachineRequest(request.originalData as MACHINE_REPLACEMENT_REQUEST);
        setIsMachineModalOpen(true);
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      toast.error('Không thể tải chi tiết yêu cầu');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!summaryData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Không thể tải dữ liệu tổng quan</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards - Updated with AdminQuickActions color palette */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Spare Parts Summary */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu linh kiện</CardTitle>
            <div className="p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <Package className="h-4 w-4 text-green-700 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.sparePartRequests.total}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Chờ xử lý</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {summaryData.sparePartRequests.unconfirmed}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Đã xác nhận</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {summaryData.sparePartRequests.confirmed}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Thiếu hàng</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {summaryData.sparePartRequests.insufficient}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Đã giao</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {summaryData.sparePartRequests.delivered}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Machine Requests Summary */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu thiết bị</CardTitle>
            <div className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <Settings className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.machineRequests.total}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Chờ xử lý</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {summaryData.machineRequests.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Đã xác nhận</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {summaryData.machineRequests.confirmed}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Hoàn thành</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {summaryData.machineRequests.completed}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Đã hủy</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {summaryData.machineRequests.cancelled}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* All Requests List */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tất cả yêu cầu
            <Badge variant="secondary">{filteredRequests.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo mã, người nhận..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loại yêu cầu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="sparepart">Linh kiện</SelectItem>
                <SelectItem value="machine">Thiết bị</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {availableStatuses.map(status => (
                  <SelectItem key={status} value={status}>{getVietnameseStatus(status)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Xóa bộ lọc
            </Button>
          </div>

          {/* Requests Table - Removed "Chi tiết" column */}
          {isLoadingRequests ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Không có yêu cầu nào
              </p>
              {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
                <button
                  className="mt-2 text-primary underline text-sm"
                  onClick={clearFilters}
                >
                  Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-200">
                    <th className="px-4 py-3 text-left font-medium">Mã yêu cầu</th>
                    <th className="px-4 py-3 text-left font-medium">Ngày yêu cầu</th>
                    <th className="px-4 py-3 text-left font-medium">Người nhận</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map((request) => {
                    const requestDate = new Date(request.requestDate);
                    const timeString = requestDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const relativeTime = getRelativeTime(request.requestDate);
                    
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{request.title}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {request.type === 'sparepart' ? (
                              <Package className="h-3 w-3 text-green-400" />
                            ) : (
                              <Settings className="h-3 w-3 text-blue-400" />
                            )}
                            <span>
                              {request.type === 'sparepart' ? 'Yêu cầu linh kiện' : 'Yêu cầu thiết bị'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {requestDate.toLocaleDateString('vi-VN')}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            <span>{timeString} • {relativeTime}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className={`${!request.assigneeName || request.assigneeName.trim() === '' ? 'text-gray-400 italic' : ''}`}>
                              {request.assigneeName || 'Chưa có người nhận'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(request.status)}
                            <Badge className={getStatusColor(request.status)}>
                              {getVietnameseStatus(request.status)}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewRequest(request)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination - Fixed implementation */}
          {filteredRequests.length > 0 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị
                </span>
                <Select 
                  value={requestsPagination.pageSize.toString()} 
                  onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  trên tổng số {requestsPagination.totalItems} mục
                </span>
              </div>

              <div className="flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => requestsPagination.currentPage > 1 && handlePageChange(requestsPagination.currentPage - 1)}
                        className={requestsPagination.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {requestsPagination.totalPages > 1 ? (
                      generatePageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={requestsPagination.currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          )}
                        </PaginationItem>
                      ))
                    ) : (
                      <PaginationItem>
                        <PaginationLink isActive={true} className="cursor-default">
                          1
                        </PaginationLink>
                      </PaginationItem>
                    )}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => requestsPagination.currentPage < requestsPagination.totalPages && handlePageChange(requestsPagination.currentPage + 1)}
                        className={requestsPagination.currentPage >= requestsPagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modals */}
      <SparePartRequestDetailModal
        request={selectedSparePartRequest}
        isOpen={isSparePartModalOpen}
        onClose={() => {
          setIsSparePartModalOpen(false);
          setSelectedSparePartRequest(null);
        }}
      />

      <MachineRequestDetailModal
        request={selectedMachineRequest}
        isOpen={isMachineModalOpen}
        onClose={() => {
          setIsMachineModalOpen(false);
          setSelectedMachineRequest(null);
        }}
      />
    </div>
  );
}