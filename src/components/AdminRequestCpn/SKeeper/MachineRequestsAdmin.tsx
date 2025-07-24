'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, Search, Filter, Settings, Calendar, User, ArrowRightLeft, Clock } from 'lucide-react';
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
import { MACHINE_REPLACEMENT_REQUEST } from '@/types/sparePart.type';
import MachineRequestDetailModal from './MachineRequestDetailModal';

export default function MachineRequestsAdmin() {
  const [requests, setRequests] = useState<MACHINE_REPLACEMENT_REQUEST[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<MACHINE_REPLACEMENT_REQUEST | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deviceCache, setDeviceCache] = useState<{[key: string]: string}>({});
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  useEffect(() => {
    fetchRequests(1, pagination.pageSize);
  }, []);

  // Fetch device name by ID with caching
  const fetchDeviceName = async (deviceId: string): Promise<string> => {
    if (deviceCache[deviceId]) {
      return deviceCache[deviceId];
    }
    
    try {
      const device = await apiClient.device.getDeviceById(deviceId);
      const deviceName = device.deviceName || `Device ${deviceId.slice(0, 8)}`;
      
      // Update cache
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

  // Helper function to get status in Vietnamese
  const getVietnameseStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'Đang chờ',
      'CONFIRMED': 'Đã xác nhận', 
      'INPROGRESS': 'Đang thực hiện',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'REJECTED': 'Từ chối'
    };
    return statusMap[status.toUpperCase()] || status;
  };

  // Helper function to format relative time
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

  const fetchRequests = async (page: number = 1, pageSize: number = 10) => {
    try {
      setIsLoading(true);
      console.log(`Fetching machine replacement requests for page ${page}, size ${pageSize}`);
      
      const response = await apiClient.machine.getReplacementRequests(page, pageSize);
      console.log("Machine replacement requests API response:", response);
      
      let machineData: MACHINE_REPLACEMENT_REQUEST[] = [];
      let totalItems = 0;
      let totalPages = 1;
      let currentPage = page;
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        machineData = response.data.data;
        totalItems = response.data.totalCount || 0;
        totalPages = response.data.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.data.pageNumber || page;
      } else if (response.data && Array.isArray(response.data)) {
        machineData = response.data;
        totalItems = response.totalCount || response.data.length;
        totalPages = response.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.pageNumber || page;
      } else if (Array.isArray(response)) {
        machineData = response;
        totalItems = response.length;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      }

      console.log(`Processed machine data: ${machineData.length} items, ${totalItems} total, ${totalPages} pages`);

      setRequests(machineData);
      setPagination({
        currentPage,
        pageSize,
        totalItems,
        totalPages
      });
      
    } catch (error) {
      console.error("Failed to fetch machine replacement requests:", error);
      toast.error("Không thể tải danh sách yêu cầu thiết bị");
      
      setRequests([]);
      setPagination({
        currentPage: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch device names when requests change
  useEffect(() => {
    const fetchDeviceNames = async () => {
      const deviceIds = new Set<string>();
      
      // Collect all unique device IDs with null checks
      requests.forEach(req => {
        if (req.oldDeviceId) deviceIds.add(req.oldDeviceId);
        if (req.newDeviceId) deviceIds.add(req.newDeviceId);
      });
      
      // Fetch names for devices not in cache
      const promises = Array.from(deviceIds)
        .filter(id => !deviceCache[id])
        .map(id => fetchDeviceName(id));
      
      if (promises.length > 0) {
        try {
          await Promise.all(promises);
        } catch (error) {
          console.error("Failed to fetch device names:", error);
        }
      }
    };
    
    if (requests.length > 0) {
      fetchDeviceNames();
    }
  }, [requests, deviceCache]);

  // Get unique statuses for filter dropdown
  const availableStatuses = useMemo(() => {
    return [...new Set(requests.map(req => req.status))];
  }, [requests]);

  // Filter requests based on search and status
  const filteredRequests = useMemo(() => {
    return requests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  // Prepare requests with device names for display
  const requestsWithDeviceNames = useMemo(() => {
    return filteredRequests.map(req => ({
      ...req,
      requestCode: req.title.includes('-') ? req.title.split('-')[0] : `MR-${req.id.slice(0, 8)}`,
      oldDeviceName: req.oldDeviceId 
        ? (deviceCache[req.oldDeviceId] || `Device ${req.oldDeviceId.slice(0, 8)}`)
        : 'No Device',
      newDeviceName: req.newDeviceId 
        ? (deviceCache[req.newDeviceId] || `Device ${req.newDeviceId.slice(0, 8)}`)
        : 'No Device',
    }));
  }, [filteredRequests, deviceCache]);

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (pagination.totalPages <= maxVisiblePages) {
      for (let i = 1; i <= pagination.totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (pagination.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(pagination.totalPages);
      } else if (pagination.currentPage >= pagination.totalPages - 2) {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = pagination.totalPages - 3; i <= pagination.totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('ellipsis');
        for (let i = pagination.currentPage - 1; i <= pagination.currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(pagination.totalPages);
      }
    }
    
    return pages;
  };

  const handlePageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    fetchRequests(page, pagination.pageSize);
  };

  const handlePageSizeChange = (pageSize: number) => {
    console.log(`Changing page size to ${pageSize}`);
    fetchRequests(1, pageSize);
  };

  const handleViewRequest = async (request: MACHINE_REPLACEMENT_REQUEST) => {
    try {
      // Use the request directly or fetch detailed request data if API exists
      setSelectedRequest(request);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      toast.error('Không thể tải chi tiết yêu cầu');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'inprogress': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tiêu đề, người nhận..."
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
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border border-slate-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-400" />
            Danh sách yêu cầu thiết bị
            <Badge variant="secondary">{requestsWithDeviceNames.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requestsWithDeviceNames.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Không có yêu cầu thiết bị nào
              </p>
              {(searchTerm || statusFilter !== 'all') && (
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
                    <th className="px-4 py-3 text-left font-medium">Thiết bị thay thế</th>
                    <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                    <th className="px-4 py-3 text-center font-medium">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {requestsWithDeviceNames.map((request) => {
                    const requestDate = new Date(request.requestDate);
                    const timeString = requestDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                    const relativeTime = getRelativeTime(request.requestDate);
                    
                    return (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{request.requestCode}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Settings className="h-3 w-3 text-blue-400" />
                            <span>Yêu cầu thiết bị</span>
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
                            <div className="text-xs max-w-48">
                              <div className="font-medium text-red-600 mb-1 truncate" title={request.oldDeviceName}>
                                {request.oldDeviceName}
                              </div>
                              <div className="flex items-center justify-center mb-1">
                                <ArrowRightLeft className="h-3 w-3 text-gray-400" />
                              </div>
                              <div className="font-medium text-green-600 truncate" title={request.newDeviceName}>
                                {request.newDeviceName}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={getStatusColor(request.status)}>
                            {getVietnameseStatus(request.status)}
                          </Badge>
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

          {/* Pagination */}
          {requestsWithDeviceNames.length > 0 && (
            <div className="flex items-center justify-between border-t pt-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Hiển thị
                </span>
                <Select 
                  value={pagination.pageSize.toString()} 
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
                  trên tổng số {pagination.totalItems} mục
                </span>
              </div>

              <div className="flex justify-end">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => pagination.currentPage > 1 && handlePageChange(pagination.currentPage - 1)}
                        className={pagination.currentPage <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                    
                    {pagination.totalPages > 1 ? (
                      generatePageNumbers().map((page, index) => (
                        <PaginationItem key={index}>
                          {page === 'ellipsis' ? (
                            <PaginationEllipsis />
                          ) : (
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={pagination.currentPage === page}
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
                        onClick={() => pagination.currentPage < pagination.totalPages && handlePageChange(pagination.currentPage + 1)}
                        className={pagination.currentPage >= pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <MachineRequestDetailModal
        request={selectedRequest}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedRequest(null);
        }}
      />
    </div>
  );
}