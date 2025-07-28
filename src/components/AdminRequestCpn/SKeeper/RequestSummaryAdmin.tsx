'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Settings, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Eye, Search, Filter, Calendar, User, Cog, Archive, RefreshCw, Wrench } from 'lucide-react';
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
import { UNIFIED_SKEEPER_REQUEST, MachineActionType } from '@/types/sparePart.type';
import { translateActionType, translateTaskStatus, translateTaskPriority } from '@/utils/textTypeTask';
import UnifiedRequestDetailModal from './UnifiedRequestDetailModal';

interface RequestSummaryData {
  machineActions: {
    total: number;
    stockIn: number;
    stockOut: number;
    installation: number;
    warrantySubmission: number;
    sparePartRequest: number;
    pending: number;
    completed: number;
  };
}

export default function RequestSummaryAdmin() {
  const [summaryData, setSummaryData] = useState<RequestSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  
  // Request list states
  const [allRequests, setAllRequests] = useState<UNIFIED_SKEEPER_REQUEST[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionTypeFilter, setActionTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('startDate');
  const [isAscending, setIsAscending] = useState(false); // Default to newest first
  
  // Modal states
  const [selectedRequest, setSelectedRequest] = useState<UNIFIED_SKEEPER_REQUEST | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
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

  // Safe translation functions
  const safeTranslateTaskStatus = (status: string) => {
    try {
      return translateTaskStatus(status || 'unknown');
    } catch (error) {
      console.error('Error translating status:', error);
      return status || 'Unknown';
    }
  };

  const safeTranslateActionType = (actionType: string) => {
    try {
      return translateActionType(actionType || 'unknown');
    } catch (error) {
      console.error('Error translating action type:', error);
      return actionType || 'Unknown';
    }
  };

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch unified machine action confirmations to create summary
      const response = await apiClient.machineActionConfirmation.getAll(1, 100); // Get first 100 to calculate stats

      // Process machine action data
      let machineActionData: any[] = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        machineActionData = response.data.data;
      } else if (Array.isArray(response?.data)) {
        machineActionData = response.data;
      } else if (Array.isArray(response)) {
        machineActionData = response;
      }

      const machineActionStats = {
        total: machineActionData.length,
        stockIn: machineActionData.filter((req: any) => req.actionType?.toLowerCase() === 'stockin').length,
        stockOut: machineActionData.filter((req: any) => req.actionType?.toLowerCase() === 'stockout').length,
        installation: machineActionData.filter((req: any) => req.actionType?.toLowerCase() === 'installation').length,
        warrantySubmission: machineActionData.filter((req: any) => req.actionType?.toLowerCase() === 'warrantysubmission').length,
        sparePartRequest: machineActionData.filter((req: any) => req.actionType?.toLowerCase() === 'sparepartrequest').length,
        pending: machineActionData.filter((req: any) => req.status?.toLowerCase() === 'pending').length,
        completed: machineActionData.filter((req: any) => req.status?.toLowerCase() === 'completed').length,
      };

      setSummaryData({
        machineActions: machineActionStats,
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
      
      // Fetch unified machine action confirmations
      const response = await apiClient.machineActionConfirmation.getAll(
        page, 
        pageSize, 
        isAscending,
        statusFilter !== 'all' ? statusFilter : undefined,
        actionTypeFilter !== 'all' ? actionTypeFilter : undefined
      );

      let machineActionData: any[] = [];
      let totalItems = 0;
      let totalPages = 1;
      let currentPage = page;

      if (response?.data?.data && Array.isArray(response.data.data)) {
        machineActionData = response.data.data;
        totalItems = response.data.totalCount || 0;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.data.pageNumber || page;
      } else if (Array.isArray(response?.data)) {
        machineActionData = response.data;
        totalItems = response.totalCount || response.data.length;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.pageNumber || page;
      } else if (Array.isArray(response)) {
        machineActionData = response;
        totalItems = response.length;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      }

      // Transform to unified format
      const unifiedRequests: UNIFIED_SKEEPER_REQUEST[] = machineActionData.map(req => ({
        id: req.id,
        type: 'machineAction' as const,
        title: req.confirmationCode,
        description: `${safeTranslateActionType(req.actionType)} - ${req.notes || 'Không có ghi chú'}`,
        requestDate: req.startDate,
        status: req.status,
        assigneeName: req.assigneeName,
        actionType: req.actionType,
        confirmationCode: req.confirmationCode,
        mechanicConfirm: req.mechanicConfirm,
        stockkeeperConfirm: req.stockkeeperConfirm,
        originalData: req
      }));

      setAllRequests(unifiedRequests);
      
      setRequestsPagination({
        currentPage,
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
      'INPROGRESS': 'Đang thực hiện',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'REJECTED': 'Đã từ chối'
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
      case 'confirmed': case 'inprogress': return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled': case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'confirmed': case 'inprogress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled': case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getActionTypeIcon = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case 'stockout': return <Package className="h-4 w-4 text-red-500" />;
      case 'stockin': return <Archive className="h-4 w-4 text-green-500" />;
      case 'installation': return <Cog className="h-4 w-4 text-blue-500" />;
      case 'warrantysubmission': return <RefreshCw className="h-4 w-4 text-orange-500" />;
      case 'sparepartrequest': return <Wrench className="h-4 w-4 text-purple-500" />;
      default: return <Settings className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionTypeColor = (actionType: MachineActionType) => {
    switch (actionType.toLowerCase()) {
      case 'stockout': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'stockin': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'installation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'warrantysubmission': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'sparepartrequest': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  // Get unique statuses and action types for filter dropdown
  const availableStatuses = useMemo(() => {
    return [...new Set(allRequests.map(req => req.status))];
  }, [allRequests]);

  const availableActionTypes = useMemo(() => {
    return [...new Set(allRequests.map(req => req.actionType).filter(Boolean))];
  }, [allRequests]);

  // Filter requests based on search, status, and action type
  const filteredRequests = useMemo(() => {
    return allRequests.filter(request => {
      const matchesSearch = searchTerm === '' || 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.assigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesActionType = actionTypeFilter === 'all' || request.actionType === actionTypeFilter;
      
      return matchesSearch && matchesStatus && matchesActionType;
    });
  }, [allRequests, searchTerm, statusFilter, actionTypeFilter]);

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

  const handleFilterChange = () => {
    // Reset to first page when filters change
    fetchAllRequests(1, requestsPagination.pageSize);
  };

  // Update filter change handlers
  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setRequestsPagination(prev => ({ ...prev, currentPage: 1 }));
    // Note: fetchAllRequests will be called via useEffect
  };

  const handleActionTypeChange = (actionType: string) => {
    setActionTypeFilter(actionType);
    setRequestsPagination(prev => ({ ...prev, currentPage: 1 }));
    // Note: fetchAllRequests will be called via useEffect
  };

  // Add useEffect to refetch when filters change
  useEffect(() => {
    if (!isLoading) { // Only refetch if initial load is complete
      fetchAllRequests(1, requestsPagination.pageSize);
    }
  }, [statusFilter, actionTypeFilter, isAscending]);

  const handleViewRequest = async (request: UNIFIED_SKEEPER_REQUEST) => {
    try {
      // Fetch detailed request data
      const detailResponse = await apiClient.machineActionConfirmation.getById(request.id);
      
      // Update the request with detailed data
      const updatedRequest = {
        ...request,
        originalData: detailResponse.data || detailResponse
      };
      
      setSelectedRequest(updatedRequest);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch request details:', error);
      toast.error('Không thể tải chi tiết yêu cầu');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setActionTypeFilter('all');
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Machine Actions Summary */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yêu cầu xác nhận máy móc</CardTitle>
            <div className="p-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
              <Settings className="h-4 w-4 text-blue-700 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.machineActions.total}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <span className="text-xs font-medium text-red-700 dark:text-red-400">Xuất kho</span>
                <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {summaryData.machineActions.stockOut}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Nhập kho</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {summaryData.machineActions.stockIn}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Lắp đặt</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                  {summaryData.machineActions.installation}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg dark:bg-purple-900/20 dark:border-purple-800">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-400">Linh kiện</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                  {summaryData.machineActions.sparePartRequest}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="border border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái yêu cầu</CardTitle>
            <div className="p-2 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
              <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData.machineActions.total}</div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 hover:bg-yellow-100 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
                <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">Chờ xử lý</span>
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {summaryData.machineActions.pending}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Hoàn thành</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {summaryData.machineActions.completed}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg dark:bg-orange-900/20 dark:border-orange-800">
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Bảo hành</span>
                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                  {summaryData.machineActions.warrantySubmission}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg dark:bg-gray-900/20 dark:border-gray-800">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-400">Khác</span>
                <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                  {summaryData.machineActions.total - summaryData.machineActions.pending - summaryData.machineActions.completed}
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
            Tất cả yêu cầu xác nhận
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
            <Select value={actionTypeFilter} onValueChange={handleActionTypeChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Loại hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {availableActionTypes.map(actionType => (
                  <SelectItem key={actionType} value={actionType}>
                    {safeTranslateActionType(actionType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusChange}>
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

          {/* Requests Table */}
          {isLoadingRequests ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Không có yêu cầu nào
              </p>
              {(searchTerm || statusFilter !== 'all' || actionTypeFilter !== 'all') && (
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
                    <th className="px-4 py-3 text-left font-medium">Mã xác nhận</th>
                    <th className="px-4 py-3 text-left font-medium">Loại hành động</th>
                    <th className="px-4 py-3 text-left font-medium">Ngày bắt đầu</th>
                    <th className="px-4 py-3 text-left font-medium">Người thực hiện</th>
                    <th className="px-4 py-3 text-left font-medium">Xác nhận</th>
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
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {request.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {request.actionType && getActionTypeIcon(request.actionType)}
                            <Badge className={request.actionType ? getActionTypeColor(request.actionType) : 'bg-gray-100 text-gray-800'}>
                              {request.actionType ? safeTranslateActionType(request.actionType) : 'N/A'}
                            </Badge>
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
                              {request.assigneeName || 'Chưa có người thực hiện'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Thợ máy:</span>
                              {request.mechanicConfirm ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">Thủ kho:</span>
                              {request.stockkeeperConfirm ? (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              ) : (
                                <XCircle className="h-3 w-3 text-red-500" />
                              )}
                            </div>
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

          {/* Pagination */}
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

      {/* Detail Modal */}
      <UnifiedRequestDetailModal
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