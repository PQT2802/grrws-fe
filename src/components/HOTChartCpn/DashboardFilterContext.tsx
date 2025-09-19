'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DateFilter {
  mode: 'range' | 'quick';
  startDate?: Date;
  endDate?: Date;
  quickSelect?: 'all' | '7d' | '30d' | '12m';
}

export interface DepartmentFilter {
  selectedAreas: string[]; // Array of area IDs
  allSelected: boolean;
}

export interface DashboardFilters {
  date: DateFilter;
  department: DepartmentFilter;
}

interface DashboardFilterContextType {
  filters: DashboardFilters;
  updateDateFilter: (dateFilter: DateFilter) => void;
  updateDepartmentFilter: (departmentFilter: DepartmentFilter) => void;
  resetFilters: () => void;
  getApiParams: () => {
    startDate?: string;
    endDate?: string;
    areaIds?: string[];
  };
}

const defaultFilters: DashboardFilters = {
  date: {
    mode: 'quick',
    quickSelect: 'all'
  },
  department: {
    selectedAreas: [],
    allSelected: true
  }
};

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined);

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  const updateDateFilter = useCallback((dateFilter: DateFilter) => {
    console.log('📊 Updating date filter:', dateFilter);
    setFilters(prev => ({
      ...prev,
      date: dateFilter
    }));
  }, []);

  const updateDepartmentFilter = useCallback((departmentFilter: DepartmentFilter) => {
    console.log('📊 Updating department filter:', departmentFilter);
    setFilters(prev => ({
      ...prev,
      department: departmentFilter
    }));
  }, []);

  const resetFilters = useCallback(() => {
    console.log('📊 Resetting all filters');
    setFilters(defaultFilters);
  }, []);

  const getApiParams = useCallback(() => {
    const params: { startDate?: string; endDate?: string; areaIds?: string[] } = {};

    // Handle date filter
    if (filters.date.mode === 'range' && filters.date.startDate && filters.date.endDate) {
      params.startDate = filters.date.startDate.toISOString();
      params.endDate = filters.date.endDate.toISOString();
    } else if (filters.date.mode === 'quick' && filters.date.quickSelect && filters.date.quickSelect !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (filters.date.quickSelect) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
          startDate = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      params.startDate = startDate.toISOString();
      params.endDate = now.toISOString();
    }

    // ✅ Fixed department filter logic
    if (!filters.department.allSelected && filters.department.selectedAreas.length > 0) {
      params.areaIds = filters.department.selectedAreas;
    }
    // ✅ If allSelected is true, don't include areaIds (means all areas)

    console.log('📊 Generated API params:', params);
    return params;
  }, [filters]);

  const value = {
    filters,
    updateDateFilter,
    updateDepartmentFilter,
    resetFilters,
    getApiParams
  };

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (context === undefined) {
    throw new Error('useDashboardFilters must be used within a DashboardFilterProvider');
  }
  return context;
}