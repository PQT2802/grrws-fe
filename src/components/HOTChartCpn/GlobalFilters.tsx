'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, X, CalendarDays, Filter, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardFilters, DateFilter, DepartmentFilter } from '@/components/HOTChartCpn/DashboardFilterContext';
import { apiClient } from '@/lib/api-client';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface Area {
  id: string;
  areaName: string;
}

const QUICK_SELECT_OPTIONS = [
  { value: 'all', label: 'Tất cả thời gian' },
  { value: '7d', label: '7 ngày qua' },
  { value: '30d', label: '30 ngày qua' },
  { value: '12m', label: '12 tháng qua' },
];

export default function GlobalFilters() {
  const { filters, updateDateFilter, updateDepartmentFilter, resetFilters } = useDashboardFilters();
  const [areas, setAreas] = useState<Area[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);

  // Local state for temporary filter values (before confirmation)
  const [tempDateFilter, setTempDateFilter] = useState<DateFilter>(filters.date);
  const [tempDepartmentFilter, setTempDepartmentFilter] = useState<DepartmentFilter>(filters.department);
  
  // Popover state
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState(false);

  // Fetch areas for department filter
  useEffect(() => {
    const fetchAreas = async () => {
      try {
        setLoadingAreas(true);
        const response = await apiClient.location.getAreas(1, 100);
        if (response?.data && Array.isArray(response.data)) {
          setAreas(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch areas:', error);
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchAreas();
  }, []);

  // Update temp state when actual filters change (e.g., from reset)
  useEffect(() => {
    setTempDateFilter(filters.date);
    setTempDepartmentFilter(filters.department);
  }, [filters]);

  // Date filter handlers - ✅ Only update temp state
  const handleTempDateModeChange = (mode: 'range' | 'quick') => {
    const newDateFilter: DateFilter = {
      mode,
      ...(mode === 'quick' ? { quickSelect: 'all' } : {})
    };
    setTempDateFilter(newDateFilter);
  };

  const handleTempQuickSelectChange = (quickSelect: string) => {
    setTempDateFilter({
      mode: 'quick',
      quickSelect: quickSelect as DateFilter['quickSelect']
    });
  };

  const handleTempDateRangeChange = (startDate?: Date, endDate?: Date) => {
    setTempDateFilter({
      mode: 'range',
      startDate,
      endDate
    });
  };

  const confirmDateFilter = () => {
    updateDateFilter(tempDateFilter);
    setDatePopoverOpen(false);
  };

  const cancelDateFilter = () => {
    setTempDateFilter(filters.date);
    setDatePopoverOpen(false);
  };

  // Department filter handlers - ✅ Only update temp state
  const handleTempAreaToggle = (areaId: string, checked: boolean) => {
    const currentSelected = tempDepartmentFilter.selectedAreas;
    let newSelected: string[];

    if (checked) {
      newSelected = [...currentSelected, areaId];
    } else {
      newSelected = currentSelected.filter(id => id !== areaId);
    }

    // ✅ If all areas are selected, mark as allSelected = true
    const allSelected = newSelected.length === areas.length;

    setTempDepartmentFilter({
      selectedAreas: allSelected ? [] : newSelected,
      allSelected
    });
  };

  // ✅ Fixed "Bỏ chọn tất cả" / "Chọn tất cả" logic for temp state
  const handleTempSelectAllAreas = (selectAll: boolean) => {
    setTempDepartmentFilter({
      selectedAreas: selectAll ? [] : areas.map(area => area.id),
      allSelected: selectAll
    });
  };

  const confirmDepartmentFilter = () => {
    updateDepartmentFilter(tempDepartmentFilter);
    setDepartmentPopoverOpen(false);
  };

  const cancelDepartmentFilter = () => {
    setTempDepartmentFilter(filters.department);
    setDepartmentPopoverOpen(false);
  };

  // Check if filters have changes pending confirmation
  const hasDateChanges = JSON.stringify(tempDateFilter) !== JSON.stringify(filters.date);
  const hasDepartmentChanges = JSON.stringify(tempDepartmentFilter) !== JSON.stringify(filters.department);

  // Get display text for current filters (applied, not temp)
  const getDateDisplayText = () => {
    if (filters.date.mode === 'quick') {
      const option = QUICK_SELECT_OPTIONS.find(opt => opt.value === filters.date.quickSelect);
      return option?.label || 'Tất cả thời gian';
    } else if (filters.date.startDate && filters.date.endDate) {
      return `${format(filters.date.startDate, 'dd/MM/yyyy')} - ${format(filters.date.endDate, 'dd/MM/yyyy')}`;
    }
    return 'Chọn khoảng thời gian';
  };

  const getDepartmentDisplayText = () => {
    if (filters.department.allSelected) {
      return 'Tất cả phòng ban';
    }
    if (filters.department.selectedAreas.length === 1) {
      const area = areas.find(a => a.id === filters.department.selectedAreas[0]);
      return area?.areaName || '1 phòng ban';
    }
    return `${filters.department.selectedAreas.length} phòng ban`;
  };

  const hasActiveFilters = 
    (filters.date.mode === 'quick' && filters.date.quickSelect !== 'all') ||
    (filters.date.mode === 'range' && filters.date.startDate && filters.date.endDate) ||
    !filters.department.allSelected;

  return (
    <div className="flex items-center gap-3">
      {/* Date Filter */}
      <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={`justify-start gap-2 min-w-[200px] hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground ${hasDateChanges ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="truncate">{getDateDisplayText()}</span>
            {hasDateChanges && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 bg-background border rounded-lg shadow-lg">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-foreground">Chế độ lọc</Label>
                <Select 
                  value={tempDateFilter.mode} 
                  onValueChange={(value: 'range' | 'quick') => handleTempDateModeChange(value)}
                >
                  <SelectTrigger className="w-full mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quick">Lựa chọn nhanh</SelectItem>
                    <SelectItem value="range">Khoảng thời gian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {tempDateFilter.mode === 'quick' ? (
                <div>
                  <Label className="text-sm font-medium text-foreground">Khoảng thời gian</Label>
                  <Select 
                    value={tempDateFilter.quickSelect || 'all'} 
                    onValueChange={handleTempQuickSelectChange}
                  >
                    <SelectTrigger className="w-full mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUICK_SELECT_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                // ✅ Side-by-side calendars to save space
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Từ ngày</Label>
                    <CalendarComponent
                      mode="single"
                      selected={tempDateFilter.startDate}
                      onSelect={(date) => handleTempDateRangeChange(date, tempDateFilter.endDate)}
                      locale={vi}
                      className="rounded-md border mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-foreground">Đến ngày</Label>
                    <CalendarComponent
                      mode="single"
                      selected={tempDateFilter.endDate}
                      onSelect={(date) => handleTempDateRangeChange(tempDateFilter.startDate, date)}
                      locale={vi}
                      className="rounded-md border mt-2"
                      disabled={(date) => tempDateFilter.startDate ? date < tempDateFilter.startDate : false}
                    />
                  </div>
                </div>
              )}

              {/* ✅ Action Buttons for Date Filter */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDateFilter}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDateFilter}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Department Filter - ✅ Renamed to "Chọn phòng ban" */}
      <Popover open={departmentPopoverOpen} onOpenChange={setDepartmentPopoverOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className={`justify-start gap-2 min-w-[160px] hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground ${hasDepartmentChanges ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''}`}
          >
            <MapPin className="h-4 w-4" />
            <span className="truncate">{getDepartmentDisplayText()}</span>
            {hasDepartmentChanges && <div className="w-2 h-2 bg-blue-500 rounded-full ml-auto" />}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="p-4 bg-background border rounded-lg shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-foreground">Chọn phòng ban</Label>
                {/* ✅ Fixed toggle all logic for temp state */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleTempSelectAllAreas(!tempDepartmentFilter.allSelected)}
                  className="text-xs"
                >
                  {tempDepartmentFilter.allSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </Button>
              </div>

              {loadingAreas ? (
                <div className="text-sm text-muted-foreground">Đang tải...</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {areas.map((area) => {
                    // ✅ Fixed checkbox state logic for temp state
                    const isChecked = tempDepartmentFilter.allSelected || 
                      tempDepartmentFilter.selectedAreas.includes(area.id);
                    
                    return (
                      <div key={area.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={area.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handleTempAreaToggle(area.id, checked as boolean)
                          }
                        />
                        <Label
                          htmlFor={area.id}
                          className="text-sm font-normal cursor-pointer flex-1 text-foreground"
                        >
                          {area.areaName}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ✅ Action Buttons for Department Filter */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelDepartmentFilter}
                >
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={confirmDepartmentFilter}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Xác nhận
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Reset Filters Button */}
      {hasActiveFilters && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFilters} 
          className="h-9 px-2 hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent dark:hover:text-accent-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {/* Active Filter Indicator */}
      {hasActiveFilters && (
        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Đang lọc</span>
        </div>
      )}

      {/* Pending Changes Indicator */}
      {(hasDateChanges || hasDepartmentChanges) && (
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Chờ xác nhận</span>
        </div>
      )}
    </div>
  );
}