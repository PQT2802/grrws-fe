import { Search, SortDesc, ChevronDown, CalendarRange, X } from 'lucide-react';
import { FILTER_STATE } from '@/types/sparePart.type';

interface FilterSectionProps {
  filters: FILTER_STATE;
  statuses: string[];
  onFilterChange: (key: keyof FILTER_STATE, value: string) => void;
  onClearFilters: () => void;
}

export default function FilterSection({ 
  filters, 
  statuses, 
  onFilterChange, 
  onClearFilters 
}: FilterSectionProps) {
  const { search, statusFilter, startDate, endDate, sortBy, sortDirection } = filters;

  const hasActiveFilters = search || statusFilter || startDate || endDate;

  // Get Vietnamese status text
  const getStatusText = (status: string) => {
    switch (status) {
      case "Unconfirmed":
        return "Chưa xác nhận";
      case "Confirmed":
        return "Đã xác nhận";
      case "Delivered":
        return "Đã giao";
      case "Insufficient":
        return "Thiếu hàng";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search bar */}
        <div className="w-full lg:w-1/3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tìm kiếm
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
              placeholder="Tìm theo mã yêu cầu hoặc người yêu cầu"
              value={search}
              onChange={e => onFilterChange('search', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Status filter */}
        <div className="w-full lg:w-1/5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trạng thái
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 
                rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
              value={statusFilter}
              onChange={e => onFilterChange('statusFilter', e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {getStatusText(status)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Date range */}
        <div className="w-full lg:w-1/4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            <div className="flex items-center gap-1">
              <CalendarRange className="h-4 w-4" />
              <span>Khoảng thời gian</span>
            </div>
          </label>
          <div className="flex gap-2">
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
                value={startDate}
                onChange={e => onFilterChange('startDate', e.target.value)}
                title="Từ ngày"
              />
            </div>
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
                value={endDate}
                onChange={e => onFilterChange('endDate', e.target.value)}
                title="Đến ngày"
              />
            </div>
          </div>
        </div>
        
        {/* Sort options */}
        <div className="w-full lg:w-1/6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sắp xếp
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
                value={sortBy}
                onChange={e => onFilterChange('sortBy', e.target.value)}
              >
                <option value="requestDate">Ngày yêu cầu</option>
                <option value="status">Trạng thái</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <button
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              onClick={() => onFilterChange('sortDirection', sortDirection === "asc" ? "desc" : "asc")}
              aria-label={sortDirection === "asc" ? "Sắp xếp tăng dần" : "Sắp xếp giảm dần"}
              title={sortDirection === "asc" ? "Sắp xếp tăng dần" : "Sắp xếp giảm dần"}
            >
              <SortDesc className={`h-4 w-4 ${sortDirection === "asc" ? "rotate-180" : ""} transition-transform`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Active filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Bộ lọc đang áp dụng:
          </span>
          
          {search && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>Tìm kiếm: {search}</span>
              <button 
                onClick={() => onFilterChange('search', '')} 
                aria-label="Xóa tìm kiếm"
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          {statusFilter && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>Trạng thái: {getStatusText(statusFilter)}</span>
              <button 
                onClick={() => onFilterChange('statusFilter', '')} 
                aria-label="Xóa bộ lọc trạng thái"
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          {(startDate || endDate) && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>
                Thời gian: {startDate ? new Date(startDate).toLocaleDateString('vi-VN') : "bất kỳ"} - {endDate ? new Date(endDate).toLocaleDateString('vi-VN') : "hiện tại"}
              </span>
              <button 
                onClick={() => { 
                  onFilterChange('startDate', ''); 
                  onFilterChange('endDate', ''); 
                }}
                aria-label="Xóa bộ lọc thời gian"
                className="hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          <button
            className="text-xs text-primary underline hover:text-primary-dark"
            onClick={onClearFilters}
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
}