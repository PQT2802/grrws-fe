'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Settings } from 'lucide-react';
import FilterSection from './components/FilterSection';
import RequestsTable from './components/sparepart/RequestsTable';
import MachineRequestsTable from './components/machine/MachineRequestsTable';
import { FILTER_STATE, SPAREPART_REQUEST, MACHINE_REPLACEMENT_REQUEST } from '@/types/sparePart.type';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/components/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isStockKeeper } = useAuth();
  
  // Get initial tab from URL params or default to 'spare-parts'
  const initialTab = searchParams.get('tab') || 'spare-parts';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sparePartRequests, setSparePartRequests] = useState<SPAREPART_REQUEST[]>([]);
  const [machineRequests, setMachineRequests] = useState<MACHINE_REPLACEMENT_REQUEST[]>([]);
  
  // Cache for device names to avoid repeated API calls
  const [deviceCache, setDeviceCache] = useState<{[key: string]: string}>({});
  
  // Pagination state for spare parts
  const [sparePartPagination, setSparePartPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
  });

  // Pagination state for machines
  const [machinePagination, setMachinePagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1
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
  
  // Fetch spare part requests
  const fetchSparePartRequests = async (page: number = 1, pageSize: number = 10) => {
    try {
      setIsLoading(true);
      
      console.log(`Fetching spare part requests for page ${page}, size ${pageSize}`);
      
      const response = await apiClient.sparePart.getRequests(page, pageSize);
      console.log("Spare part requests API response:", response);
      
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

      console.log(`Processed spare part data: ${sparePartData.length} items, ${totalItems} total, ${totalPages} pages`);

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

  // Fetch machine replacement requests with device names
  const fetchMachineRequests = async (page: number = 1, pageSize: number = 10) => {
    try {
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

      setMachineRequests(machineData);
      setMachinePagination({
        currentPage,
        pageSize,
        totalItems,
        totalPages
      });
      
    } catch (error) {
      console.error("Failed to fetch machine replacement requests:", error);
      toast.error("Không thể tải danh sách yêu cầu thiết bị");
      
      setMachineRequests([]);
      setMachinePagination({
        currentPage: 1,
        pageSize,
        totalItems: 0,
        totalPages: 1
      });
    }
  };
  
  // Fetch data on component mount
  useEffect(() => {
    if (user && !isStockKeeper) {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push('/access-denied');
      return;
    }
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch both spare part and machine requests concurrently
        await Promise.all([
          fetchSparePartRequests(1, 10),
          fetchMachineRequests(1, 10)
        ]);
        
        toast.success("Đã tải danh sách yêu cầu thành công");
      } catch (error) {
        console.error("Failed to fetch requests:", error);
        toast.error("Không thể tải danh sách yêu cầu");
      } finally {
        setIsLoading(false);
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
            req.title.toLowerCase().includes(searchLower) ||
            req.assigneeName.toLowerCase().includes(searchLower) ||
            req.description.toLowerCase().includes(searchLower)
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

  // Prepare machine requests with device names
  const machineRequestsWithDeviceNames = useMemo(() => {
    return filteredMachineRequests.map(req => ({
      id: req.id,
      requestCode: req.title.includes('-') ? req.title.split('-')[0] : `MR-${req.id.slice(0, 8)}`,
      requestDate: req.requestDate,
      requestedBy: req.assigneeName,
      status: req.status,
      oldDeviceName: req.oldDeviceId 
        ? (deviceCache[req.oldDeviceId] || `Device ${req.oldDeviceId.slice(0, 8)}`)
        : 'No Device',
      newDeviceName: req.newDeviceId 
        ? (deviceCache[req.newDeviceId] || `Device ${req.newDeviceId.slice(0, 8)}`)
        : 'No Device',
    }));
  }, [filteredMachineRequests, deviceCache]);

  // Fetch device names when machine requests change
  useEffect(() => {
    const fetchDeviceNames = async () => {
      const deviceIds = new Set<string>();
      
      // Collect all unique device IDs with null checks
      machineRequests.forEach(req => {
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
    
    if (machineRequests.length > 0) {
      fetchDeviceNames();
    }
  }, [machineRequests, deviceCache]);

  // Handle filter changes
  const handleSparePartFilterChange = (key: keyof FILTER_STATE, value: string) => {
    setSparePartFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const handleMachineFilterChange = (key: keyof FILTER_STATE, value: string) => {
    setMachineFilters(prev => ({ ...prev, [key]: value }));
  };

  // Handle pagination changes
  const handleSparePartPageChange = (page: number) => {
    console.log(`Changing to spare part page ${page}`);
    fetchSparePartRequests(page, sparePartPagination.pageSize);
  };

  const handleSparePartPageSizeChange = (pageSize: number) => {
    console.log(`Changing spare part page size to ${pageSize}`);
    fetchSparePartRequests(1, pageSize);
  };

  const handleMachinePageChange = (page: number) => {
    console.log(`Changing to machine page ${page}`);
    fetchMachineRequests(page, machinePagination.pageSize);
  };

  const handleMachinePageSizeChange = (pageSize: number) => {
    console.log(`Changing machine page size to ${pageSize}`);
    fetchMachineRequests(1, pageSize);
  };

  // Navigate to request detail
  const handleSparePartRequestClick = (id: string) => {
    console.log(`Navigating to spare part request detail with ID: ${id}`);
    router.push(`./requests/${id}/sparepart`);
  };
  
  const handleMachineRequestClick = (id: string) => {
    console.log(`Navigating to machine request detail with ID: ${id}`);
    router.push(`./requests/${id}/machine?tab=machines`);
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

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL to preserve tab state
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`?${params.toString()}`);
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
      
      {/* Tabs */}
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
          <FilterSection
            filters={sparePartFilters}
            statuses={sparePartStatuses}
            onFilterChange={handleSparePartFilterChange}
            onClearFilters={clearSparePartFilters}
          />

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
          <FilterSection
            filters={machineFilters}
            statuses={machineStatuses}
            onFilterChange={handleMachineFilterChange}
            onClearFilters={clearMachineFilters}
          />

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
                requests={machineRequestsWithDeviceNames}
                onRequestClick={handleMachineRequestClick}
                onClearFilters={clearMachineFilters}
                currentPage={machinePagination.currentPage}
                totalPages={machinePagination.totalPages}
                pageSize={machinePagination.pageSize}
                totalItems={machinePagination.totalItems}
                onPageChange={handleMachinePageChange}
                onPageSizeChange={handleMachinePageSizeChange}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}