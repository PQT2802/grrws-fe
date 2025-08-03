"use client";
import { Search, SortAsc, SortDesc, ChevronDown, X } from "lucide-react";
import { FilterBarProps } from "../../type";

// Fixed category list with Vietnamese labels and English values
const CATEGORY_OPTIONS = [
  { label: "Tất cả", value: "All" },
  { label: "Linh kiện chính", value: "Core Components" },
  { label: "Đầu nối", value: "Connectors" },
  { label: "Vật tư tiêu hao", value: "Consumables" },
  { label: "Phụ kiện", value: "Accessories" },
  { label: "Cảm biến", value: "Sensors" },
  { label: "Điện tử", value: "Electronics" },
  { label: "Cơ khí", value: "Mechanics" },
  { label: "Khí nén", value: "Pneumatics" },
  { label: "Motor & Truyền động", value: "Motors & Actuators" },
  { label: "Khung & Vỏ bọc", value: "Frames & Covers" },
  { label: "Khác", value: "Others" }
];

interface ExtendedFilterBarProps extends FilterBarProps {
  specialFilter?: string | null;
  onClearSpecialFilter?: () => void;
}

export default function FilterBar({
  search, setSearch,
  categoryFilter, setCategoryFilter,
  sortBy, setSortBy,
  sortDirection, setSortDirection,
  categories,
  specialFilter,
  onClearSpecialFilter
}: ExtendedFilterBarProps) {
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm linh kiện..."
            className="pl-9 w-full border border-blue-200 dark:border-gray-700 rounded-md px-3 py-1.5
              focus:outline-none focus:ring-2 focus:ring-blue-500/50 dark:bg-slate-700 bg-blue-50/30 dark:bg-blue-900/10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        {/* Category Filter */}
        <div className="w-full md:w-56">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {CATEGORY_OPTIONS.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        
        <div className="w-full md:w-56">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="quantity">Sắp xếp theo số lượng</option>
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <button
          className="flex items-center justify-center w-10 h-10 rounded-md border border-gray-300 
            dark:border-gray-600 dark:bg-slate-700"
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
        >
          {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
        </button>
      </div>
      
      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2 mt-3">
        {categoryFilter && categoryFilter !== "All" && (
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full px-3 py-1 flex items-center">
            <span>
              Danh mục: {CATEGORY_OPTIONS.find(cat => cat.value === categoryFilter)?.label || categoryFilter}
            </span>
            <button 
              className="ml-2 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200" 
              onClick={() => setCategoryFilter("All")}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ✅ Special filter indicators */}
        {specialFilter === 'lowstock' && (
          <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 text-xs rounded-full px-3 py-1 flex items-center">
            <span>Sắp hết hàng</span>
            <button 
              className="ml-2 text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-200" 
              onClick={onClearSpecialFilter}
            >
              <X size={12} />
            </button>
          </div>
        )}

        {specialFilter === 'outofstock' && (
          <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-xs rounded-full px-3 py-1 flex items-center">
            <span>Hết hàng</span>
            <button 
              className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" 
              onClick={onClearSpecialFilter}
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}