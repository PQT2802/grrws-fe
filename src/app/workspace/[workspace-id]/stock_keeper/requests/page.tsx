'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import FilterSection from './components/FilterSection';
import RequestsTable from './components/RequestsTable';
import { FILTER_STATE, SPAREPART_REQUEST } from '@/types/sparePart.type'; // ← Updated import path
import { sparePartService } from '@/app/service/sparePart.service';
import { useAuth } from '@/components/providers/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

export default function RequestsPage() {
  const router = useRouter();
  const { user, isStockKeeper } = useAuth(); 
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [requests, setRequests] = useState<SPAREPART_REQUEST[]>([]);
  
  // Filter and search state
  const [filters, setFilters] = useState<FILTER_STATE>({
    search: "",
    statusFilter: "",
    startDate: "",
    endDate: "",
    sortBy: "requestDate",
    sortDirection: "desc",
  });
  
  // Fetch data
  useEffect(() => {
    // Role check - redirect if not stock keeper
    if (user && !isStockKeeper) {
      toast.error("You don't have permission to access this page");
      router.push('/access-denied');
      return;
    }
    
    const fetchRequests = async () => {
      try {
        setIsLoading(true);
        const response = await sparePartService.getSparePartRequests();
        console.log("API response:", response);
        const requestData = response.data?.data || 
                             (Array.isArray(response.data) ? response.data : []) || [];

        if (requestData.length === 0) {
          console.log("API returned an empty array");
          toast.info("No spare part requests found");
        }
        
        setRequests(requestData);
        toast.success(`Loaded ${requestData.length} spare part requests`);
      } catch (error) {
        console.error("Failed to fetch spare part requests:", error);
        toast.error("Failed to load spare part requests");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [router, user, isStockKeeper]);
  
  // Get unique statuses for filter dropdown
  const statuses = useMemo(() => {
    return [...new Set(requests.map(req => req.status))];
  }, [requests]);

    // Filter and sort the requests
  const filteredRequests = useMemo(() => {
    const filtered = requests
      .filter(req => {
        // Status filter
        if (filters.statusFilter && req.status !== filters.statusFilter) return false;
        
        // Date range filter
        if (filters.startDate && new Date(req.requestDate) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(req.requestDate) > new Date(filters.endDate)) return false;
        
        // Search
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            req.requestCode.toLowerCase().includes(searchLower) ||
            req.assigneeName.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort logic
        if (filters.sortBy === "requestDate") {
          return filters.sortDirection === "asc"
            ? new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
            : new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        }
        
        if (filters.sortBy === "status") {
          return filters.sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        
        return 0;
      });
    
    console.log("🔍 Filtered requests:", {
      before: requests.length,
      after: filtered.length,
      filters: JSON.stringify(filters)
    });
    
    return filtered;
  }, [filters, requests]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FILTER_STATE, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Navigate to request detail
  const handleRequestClick = (id: string) => {
    router.push(`./requests/${id}`);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      statusFilter: "",
      startDate: "",
      endDate: "",
      sortBy: "requestDate",
      sortDirection: "desc",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h1 className="text-xl font-bold">Spare Part Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage and track all spare part requests from mechanics
        </p>
      </div>
      
      {/* Filter section */}
      <FilterSection
        filters={filters}
        statuses={statuses}
        onFilterChange={handleFilterChange}
        onClearFilters={clearFilters}
      />

      {/* Request list */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Request List</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <RequestsTable
            requests={filteredRequests.map(req => ({
              id: req.requestCode,
              date: new Date(req.requestDate).toLocaleDateString(),
              requestedBy: req.assigneeName,
              items: req.sparePartUsages?.length || 0,
              status: req.status,
            }))}
            onRequestClick={handleRequestClick}
            onClearFilters={clearFilters}
          />
        )}
      </div>
    </div>
  );
}