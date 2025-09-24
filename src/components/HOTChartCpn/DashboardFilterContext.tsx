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

// ✅ Helper function to get current time in Vietnam timezone
const getVietnamTime = () => {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
};

// ✅ Helper function to create date in Vietnam timezone
const createVietnamDate = (year: number, month: number, day: number = 1, hour: number = 0, minute: number = 0) => {
  // Create date string in Vietnam timezone format
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  return new Date(dateStr + '+07:00'); // Vietnam is UTC+7
};

// ✅ Set default to current month (first day to today) in Vietnam time
const vietnamNow = getVietnamTime();
const vietnamFirstDayOfMonth = createVietnamDate(vietnamNow.getFullYear(), vietnamNow.getMonth(), 1);

const defaultFilters: DashboardFilters = {
  date: {
    mode: 'quick',
    quickSelect: 'current_month',
    startDate: vietnamFirstDayOfMonth,
    endDate: vietnamNow
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
    const vietnamNow = getVietnamTime();
    const vietnamFirstDayOfMonth = createVietnamDate(vietnamNow.getFullYear(), vietnamNow.getMonth(), 1);
    
    setFilters({
      ...defaultFilters,
      date: {
        mode: 'quick',
        quickSelect: 'current_month',
        startDate: vietnamFirstDayOfMonth,
        endDate: vietnamNow
      }
    });
  }, []);

  const getApiParams = useCallback(() => {
    const params: { startDate?: string; endDate?: string; areaId?: string } = {};
    const vietnamNow = getVietnamTime();

    // Handle date filter with proper defaults using Vietnam time
    if (filters.date.mode === 'range' && filters.date.startDate && filters.date.endDate) {
      // Ensure endDate is not in the future (Vietnam time)
      const endDate = filters.date.endDate > vietnamNow ? vietnamNow : filters.date.endDate;
      params.startDate = filters.date.startDate.toISOString();
      params.endDate = endDate.toISOString();
    } else if (filters.date.mode === 'quick' && filters.date.quickSelect) {
      let startDate: Date;
      let endDate: Date = vietnamNow; // Always current Vietnam time as max

      switch (filters.date.quickSelect) {
        case '7d':
          startDate = new Date(vietnamNow.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(vietnamNow.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '12m':
          startDate = createVietnamDate(vietnamNow.getFullYear(), vietnamNow.getMonth() - 12, vietnamNow.getDate());
          break;
        case 'current_month':
          startDate = createVietnamDate(vietnamNow.getFullYear(), vietnamNow.getMonth(), 1); // First day of current month in Vietnam
          endDate = vietnamNow; // Current Vietnam time
          break;
        case 'all':
        default:
          // For 'all', don't set date restrictions but use Vietnam timezone
          startDate = createVietnamDate(2020, 0, 1); // Some reasonable start date in Vietnam time
          endDate = vietnamNow;
          break;
      }

      params.startDate = startDate.toISOString();
      params.endDate = endDate.toISOString();
    } else {
      // Default fallback: current month in Vietnam time
      const firstDay = createVietnamDate(vietnamNow.getFullYear(), vietnamNow.getMonth(), 1);
      params.startDate = firstDay.toISOString();
      params.endDate = vietnamNow.toISOString();
    }

    // ✅ Handle single area filter
    if (!filters.department.allSelected && filters.department.selectedAreaId) {
      params.areaId = filters.department.selectedAreaId;
    }
    // ✅ If allSelected is true or no area selected, don't include areaId (means all areas)

    console.log('📊 Generated API params (Vietnam time):', params);
    console.log('📊 Vietnam time now:', vietnamNow.toISOString());
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