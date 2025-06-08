import { Search, SortDesc, ChevronDown, CalendarRange, X } from 'lucide-react';
import { FilterState } from '../../type';

interface FilterSectionProps {
  filters: FilterState;
  statuses: string[];
  onFilterChange: (key: keyof FilterState, value: string) => void;
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

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <div className="flex flex-col lg:flex-row gap-4 items-end">
        {/* Search bar */}
        <div className="w-full lg:w-1/3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Search
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 
                rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
              placeholder="Search by ID or requester"
              value={search}
              onChange={e => onFilterChange('search', e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        {/* Status filter */}
        <div className="w-full lg:w-1/5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <div className="relative">
            <select
              className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 
                rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
              value={statusFilter}
              onChange={e => onFilterChange('statusFilter', e.target.value)}
            >
              <option value="">All Statuses</option>
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status}
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
              <span>Date Range</span>
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
              />
            </div>
            <div className="w-1/2">
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
                value={endDate}
                onChange={e => onFilterChange('endDate', e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Sort options */}
        <div className="w-full lg:w-1/6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                className="w-full appearance-none pl-3 pr-8 py-2 border border-gray-300 dark:border-gray-600 
                  rounded-md focus:ring-primary focus:border-primary dark:bg-slate-700"
                value={sortBy}
                onChange={e => onFilterChange('sortBy', e.target.value)}
              >
                <option value="date">Date</option>
                <option value="status">Status</option>
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
            <button
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              onClick={() => onFilterChange('sortDirection', sortDirection === "asc" ? "desc" : "asc")}
              aria-label={sortDirection === "asc" ? "Sort ascending" : "Sort descending"}
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
            Active filters:
          </span>
          
          {search && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>Search: {search}</span>
              <button onClick={() => onFilterChange('search', '')} aria-label="Clear search">
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          {statusFilter && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>Status: {statusFilter}</span>
              <button onClick={() => onFilterChange('statusFilter', '')} aria-label="Clear status filter">
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          {(startDate || endDate) && (
            <div className="flex items-center gap-1 text-xs bg-gray-100 dark:bg-gray-700 
              px-3 py-1 rounded-full">
              <span>Date: {startDate || "any"} to {endDate || "now"}</span>
              <button 
                onClick={() => { 
                  onFilterChange('startDate', ''); 
                  onFilterChange('endDate', ''); 
                }}
                aria-label="Clear date filter"
              >
                <X className="h-3 w-3 text-gray-500" />
              </button>
            </div>
          )}
          
          <button
            className="text-xs text-primary underline"
            onClick={onClearFilters}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}