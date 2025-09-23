'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface DateFilter {
  mode: 'range' | 'quick';
  startDate?: Date;
  endDate?: Date;
  quickSelect?: 'all' | '7d' | '30d' | '12m' | 'current_month';
}

export interface DepartmentFilter {
  selectedAreaId: string; // ✅ Changed to single area ID
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
    areaId?: string; // ✅ Changed to single areaId
  };
}

// ✅ Set default to current month (first day to today)
const now = new Date();
const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

const defaultFilters: DashboardFilters = {
  date: {
    mode: 'quick',
    quickSelect: 'current_month',
    startDate: firstDayOfMonth,
    endDate: now
  },
  department: {
    selectedAreaId: '', // ✅ Single area ID
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
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    setFilters({
      ...defaultFilters,
      date: {
        mode: 'quick',
        quickSelect: 'current_month',
        startDate: firstDayOfMonth,
        endDate: now
      }
    });
  }, []);

  const getApiParams = useCallback(() => {
    const params: { startDate?: string; endDate?: string; areaId?: string } = {};
    const now = new Date();

    // Handle date filter with proper defaults
    if (filters.date.mode === 'range' && filters.date.startDate && filters.date.endDate) {
      // Ensure endDate is not in the future
      const endDate = filters.date.endDate > now ? now : filters.date.endDate;
      params.startDate = filters.date.startDate.toISOString();
      params.endDate = endDate.toISOString();
    } else if (filters.date.mode === 'quick' && filters.date.quickSelect) {
      let startDate: Date;
      let endDate: Date = now; // Always current date as max

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
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
          endDate = now; // Current date
          break;
        case 'all':
        default:
          // For 'all', don't set date restrictions
          startDate = new Date(2020, 0, 1); // Some reasonable start date
          endDate = now;
          break;
      }

      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    } else {
      // Default fallback: current month
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      params.startDate = firstDay.toISOString();
      params.endDate = now.toISOString();
    }

    // ✅ Handle single area filter
    if (!filters.department.allSelected && filters.department.selectedAreaId) {
      params.areaId = filters.department.selectedAreaId;
    }
    // ✅ If allSelected is true or no area selected, don't include areaId (means all areas)

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