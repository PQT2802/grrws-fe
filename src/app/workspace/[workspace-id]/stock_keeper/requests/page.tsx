'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Settings } from 'lucide-react';
import FilterSection from './components/FilterSection';
import RequestsTable from './components/sparepart/RequestsTable';
import MachineRequestsTable from './components/machine/MachineRequestsTable';
import { FILTER_STATE, SPAREPART_REQUEST } from '@/types/sparePart.type';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

// Mock interface for machine requests (since API doesn't exist yet)
interface MACHINE_REQUEST {
  id: string;
  requestCode: string;
  requestDate: string;
  requestedBy: string;
  status: string;
  reason: string;
  currentMachineName: string;
  replacementMachineName: string;
  priority: string;
}

export default function RequestsPage() {
  const router = useRouter();
  const { user, isStockKeeper } = useAuth();
  
  // Use internal state for tabs instead of URL params
  const [activeTab, setActiveTab] = useState<string>('spare-parts');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sparePartRequests, setSparePartRequests] = useState<SPAREPART_REQUEST[]>([]);
  const [machineRequests, setMachineRequests] = useState<MACHINE_REQUEST[]>([]);
  
  // Pagination state for spare parts
  const [sparePartPagination, setSparePartPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1 // Ensure minimum 1 page
  });

  // Pagination state for machines
  const [machinePagination, setMachinePagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1 // Ensure minimum 1 page
  });
  
  // Filter and search state for spare parts
  const [sparePartFilters, setSparePartFilters] = useState<FILTER_STATE>({
    search: "",
    statusFilter: "",
    startDate: "",
    endDate: "",
    sortBy: "requestDate",
    sortDirection: "desc",
  });
  
  // Filter and search state for machines
  const [machineFilters, setMachineFilters] = useState<FILTER_STATE>({
    search: "",
    statusFilter: "",
    startDate: "",
    endDate: "",
    sortBy: "requestDate",
    sortDirection: "desc",
  });
  
  // Mock data for machine requests (since API doesn't exist yet)
  const mockMachineRequests: MACHINE_REQUEST[] = [
    {
      id: "1",
      requestCode: "MR-001",
      requestDate: "2024-01-15T08:00:00Z",
      requestedBy: "Nguyễn Văn A",
      status: "Unconfirmed",
      reason: "Máy cũ bị hỏng không sửa được",
      currentMachineName: "Máy khoan CNC-01",
      replacementMachineName: "Máy khoan CNC-05",
      priority: "High"
    },
    {
      id: "2",
      requestCode: "MR-002",
      requestDate: "2024-01-14T10:30:00Z",
      requestedBy: "Trần Thị B",
      status: "Confirmed",
      reason: "Nâng cấp thiết bị",
      currentMachineName: "Máy tiện T-02",
      replacementMachineName: "Máy tiện T-06",
      priority: "Medium"
    },
    {
      id: "3",
      requestCode: "MR-003",
      requestDate: "2024-01-13T14:15:00Z",
      requestedBy: "Lê Văn C",
      status: "Delivered",
      reason: "Máy cũ không đạt hiệu suất",
      currentMachineName: "Máy phay M-03",
      replacementMachineName: "Máy phay M-07",
      priority: "Low"
    }
  ];
  
  // Fetch spare part requests
  const fetchSparePartRequests = async (page: number = 1, pageSize: number = 10) => {
    try {
      setIsLoading(true);
      
      console.log(`Fetching spare part requests for page ${page}, size ${pageSize}`);
      
      // Fetch spare part requests directly using API client
      const response = await apiClient.sparePart.getRequests(page, pageSize);
      console.log("Spare part requests API response:", response);
      
      // Handle various response structures
      let sparePartData: SPAREPART_REQUEST[] = [];
      let totalItems = 0;
      let totalPages = 1;
      let currentPage = page;
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        sparePartData = response.data.data;
        totalItems = response.data.totalCount || 0;
        totalPages = response.data.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.data.pageNumber || page;
      } else if (response.data && Array.isArray(response.data)) {
        sparePartData = response.data;
        totalItems = response.totalCount || response.data.length;
        totalPages = response.totalPages || Math.max(1, Math.ceil(totalItems / pageSize));
        currentPage = response.pageNumber || page;
      } else if (Array.isArray(response)) {
        sparePartData = response;
        totalItems = response.length;
        totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
      }

      console.log(`Processed data: ${sparePartData.length} items, ${totalItems} total, ${totalPages} pages`);

      setSparePartRequests(sparePartData);
      setSparePartPagination({
        currentPage,
        pageSize,
        totalItems,
        totalPages
      });
      
    } catch (error) {
      console.error("Failed to fetch spare part requests:", error);
      toast.error("Không thể tải danh sách yêu cầu linh kiện");
      
      // Set empty state with default pagination
      setSparePartRequests([]);
      setSparePartPagination({
        currentPage: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    // Role check - redirect if not stock keeper
    if (user && !isStockKeeper) {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push('/access-denied');
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch spare part requests with pagination
        await fetchSparePartRequests(1, 10);
        
        // Set mock machine requests (replace with real API call when available)
        setMachineRequests(mockMachineRequests);
        setMachinePagination({
          currentPage: 1,
          pageSize: 10,
          totalItems: mockMachineRequests.length,
          totalPages: Math.max(1, Math.ceil(mockMachineRequests.length / 10))
        });
        
        toast.success(`Đã tải yêu cầu linh kiện và ${mockMachineRequests.length} yêu cầu thiết bị`);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        toast.error("Không thể tải danh sách yêu cầu");
      }
    };
    
    fetchData();
  }, [router, user, isStockKeeper]);
  
  // Get unique statuses for filter dropdown
  const sparePartStatuses = useMemo(() => {
    return [...new Set(sparePartRequests.map(req => req.status))];
  }, [sparePartRequests]);
  
  const machineStatuses = useMemo(() => {
    return [...new Set(machineRequests.map(req => req.status))];
  }, [machineRequests]);

  // Filter and sort spare part requests
  const filteredSparePartRequests = useMemo(() => {
    const filtered = sparePartRequests
      .filter(req => {
        if (sparePartFilters.statusFilter && req.status !== sparePartFilters.statusFilter) return false;
        if (sparePartFilters.startDate && new Date(req.requestDate) < new Date(sparePartFilters.startDate)) return false;
        if (sparePartFilters.endDate && new Date(req.requestDate) > new Date(sparePartFilters.endDate)) return false;
        
        if (sparePartFilters.search) {
          const searchLower = sparePartFilters.search.toLowerCase();
          return (
            req.requestCode.toLowerCase().includes(searchLower) ||
            req.assigneeName.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        if (sparePartFilters.sortBy === "requestDate") {
          return sparePartFilters.sortDirection === "asc"
            ? new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
            : new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        }
        
        if (sparePartFilters.sortBy === "status") {
          return sparePartFilters.sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        
        return 0;
      });
    
    return filtered;
  }, [sparePartFilters, sparePartRequests]);

  // Filter and sort machine requests
  const filteredMachineRequests = useMemo(() => {
    const filtered = machineRequests
      .filter(req => {
        if (machineFilters.statusFilter && req.status !== machineFilters.statusFilter) return false;
        if (machineFilters.startDate && new Date(req.requestDate) < new Date(machineFilters.startDate)) return false;
        if (machineFilters.endDate && new Date(req.requestDate) > new Date(machineFilters.endDate)) return false;
        
        if (machineFilters.search) {
          const searchLower = machineFilters.search.toLowerCase();
          return (
            req.requestCode.toLowerCase().includes(searchLower) ||
            req.requestedBy.toLowerCase().includes(searchLower) ||
            req.currentMachineName.toLowerCase().includes(searchLower) ||
            req.replacementMachineName.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        if (machineFilters.sortBy === "requestDate") {
          return machineFilters.sortDirection === "asc"
            ? new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
            : new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        }
        
        if (machineFilters.sortBy === "status") {
          return machineFilters.sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        
        return 0;
      });
    
    return filtered;
  }, [machineFilters, machineRequests]);

  // Handle filter changes
  const handleSparePartFilterChange = (key: keyof FILTER_STATE, value: string) => {
    setSparePartFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleMachineFilterChange = (key: keyof FILTER_STATE, value: string) => {
    setMachineFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination changes
  const handleSparePartPageChange = (page: number) => {
    console.log(`Changing to page ${page}`);
    fetchSparePartRequests(page, sparePartPagination.pageSize);
  };

  const handleSparePartPageSizeChange = (pageSize: number) => {
    console.log(`Changing page size to ${pageSize}`);
    fetchSparePartRequests(1, pageSize);
  };

  const handleMachinePageChange = (page: number) => {
    setMachinePagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleMachinePageSizeChange = (pageSize: number) => {
    setMachinePagination(prev => ({ 
      ...prev, 
      currentPage: 1, 
      pageSize,
      totalPages: Math.max(1, Math.ceil(prev.totalItems / pageSize))
    }));
  };

  // Navigate to request detail
  const handleSparePartRequestClick = (id: string) => {
    console.log(`Navigating to spare part request detail with ID: ${id}`);
    router.push(`./requests/${id}/sparepart`);
  };
  
  const handleMachineRequestClick = (id: string) => {
    console.log(`Navigating to machine request detail with ID: ${id}`);
    router.push(`./requests/${id}/machine`);
  };
  
  // Clear filters
  const clearSparePartFilters = () => {
    setSparePartFilters({
      search: "",
      statusFilter: "",
      startDate: "",
      endDate: "",
      sortBy: "requestDate",
      sortDirection: "desc",
    });
  };
  
  const clearMachineFilters = () => {
    setMachineFilters({
      search: "",
      statusFilter: "",
      startDate: "",
      endDate: "",
      sortBy: "requestDate",
      sortDirection: "desc",
    });
  };

  // Handle tab change using internal state
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h1 className="text-xl font-bold">Quản lý yêu cầu</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý và theo dõi tất cả yêu cầu linh kiện và thiết bị từ kỹ thuật viên
        </p>
      </div>
      
      {/* Tabs - now using internal state */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="spare-parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Yêu cầu linh kiện
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Yêu cầu thiết bị
          </TabsTrigger>
        </TabsList>
        
        {/* Spare Parts Tab */}
        <TabsContent value="spare-parts" className="space-y-6">
          {/* Filter section */}
          <FilterSection
            filters={sparePartFilters}
            statuses={sparePartStatuses}
            onFilterChange={handleSparePartFilterChange}
            onClearFilters={clearSparePartFilters}
          />

          {/* Request list */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Danh sách yêu cầu linh kiện</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <RequestsTable
                requests={filteredSparePartRequests.map(req => ({
                  id: req.id,
                  code: req.requestCode,
                  date: new Date(req.requestDate).toLocaleDateString('vi-VN'),
                  requestedBy: req.assigneeName,
                  items: req.sparePartUsages?.length || 0,
                  status: req.status,
                }))}
                onRequestClick={handleSparePartRequestClick}
                onClearFilters={clearSparePartFilters}
                currentPage={sparePartPagination.currentPage}
                totalPages={sparePartPagination.totalPages}
                pageSize={sparePartPagination.pageSize}
                totalItems={sparePartPagination.totalItems}
                onPageChange={handleSparePartPageChange}
                onPageSizeChange={handleSparePartPageSizeChange}
              />
            )}
          </div>
        </TabsContent>
        
        {/* Machines Tab */}
        <TabsContent value="machines" className="space-y-6">
          {/* Filter section */}
          <FilterSection
            filters={machineFilters}
            statuses={machineStatuses}
            onFilterChange={handleMachineFilterChange}
            onClearFilters={clearMachineFilters}
          />

          {/* Request list */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Danh sách yêu cầu thiết bị</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <MachineRequestsTable
                requests={filteredMachineRequests}
                onRequestClick={handleMachineRequestClick}
                onClearFilters={clearMachineFilters}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}