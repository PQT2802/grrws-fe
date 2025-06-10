'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FilterSection from './components/FilterSection';
import RequestsTable from './components/RequestsTable';
import { FilterState, Request } from '../type';

// Mock data
const mockRequests: Request[] = [
  {
    id: "REQ-001",
    date: "2025-06-08",
    requestedBy: "Nguyen Van A (Mechanic)",
    items: 3,
    status: "Pending",
  },
  {
    id: "REQ-002",
    date: "2025-06-08",
    requestedBy: "Tran Thi B (Mechanic)",
    items: 2,
    status: "Delivered",
  },
  {
    id: "REQ-003",
    date: "2025-06-07",
    requestedBy: "Le Van C (Mechanic)",
    items: 4,
    status: "Pending",
  },
  {
    id: "REQ-004",
    date: "2025-06-05",
    requestedBy: "Pham Van D (Mechanic)",
    items: 1,
    status: "Partial",
  },
  {
    id: "REQ-005",
    date: "2025-06-04",
    requestedBy: "Hoang Thi E (Supervisor)",
    items: 5,
    status: "Delivered",
  },
];

export default function RequestsPage() {
  const router = useRouter();
  
  // Filter and search state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    statusFilter: "",
    startDate: "",
    endDate: "",
    sortBy: "date",
    sortDirection: "desc",
  });
  
  // Get unique statuses for filter dropdown
  const statuses = useMemo(() => {
    return [...new Set(mockRequests.map(req => req.status))];
  }, []);

  // Filter and sort the requests
  const filteredRequests = useMemo(() => {
    return mockRequests
      .filter(req => {
        // Status filter
        if (filters.statusFilter && req.status !== filters.statusFilter) return false;
        
        // Date range filter
        if (filters.startDate && new Date(req.date) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(req.date) > new Date(filters.endDate)) return false;
        
        // Search
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          return (
            req.id.toLowerCase().includes(searchLower) ||
            req.requestedBy.toLowerCase().includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => {
        // Sort logic
        if (filters.sortBy === "date") {
          return filters.sortDirection === "asc"
            ? new Date(a.date).getTime() - new Date(b.date).getTime()
            : new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        
        if (filters.sortBy === "status") {
          return filters.sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status);
        }
        
        return 0;
      });
  }, [filters]);

  // Handle filter changes
  const handleFilterChange = (key: keyof FilterState, value: string) => {
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
      sortBy: "date",
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
        <RequestsTable
          requests={filteredRequests}
          onRequestClick={handleRequestClick}
          onClearFilters={clearFilters}
        />
      </div>
    </div>
  );
}