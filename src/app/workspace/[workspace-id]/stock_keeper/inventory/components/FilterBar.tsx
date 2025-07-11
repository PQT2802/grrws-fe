"use client";
import { Search, SortAsc, SortDesc, ChevronDown } from "lucide-react";
import { FilterBarProps } from "../../type";

// Fixed category list with Vietnamese labels and English values
const CATEGORY_OPTIONS = [
  { label: "Tất cả", value: "All" },
  { label: "Linh kiện chính", value: "Core Components" },
  { label: "Đầu nối", value: "Connectors" },
  { label: "Vât tư tiêu hao", value: "Consumables" },
  { label: "Phụ kiện", value: "Accessories" },
  { label: "Cảm biến", value: "Sensors" },
  { label: "Điện tử", value: "Electronics" },
  { label: "Cơ khí", value: "Mechanics" },
  { label: "Khí nén", value: "Pneumatics" },
  { label: "Motor & Truyền động", value: "Motors & Actuators" },
  { label: "Khung & Vỏ bọc", value: "Frames & Covers" },
  { label: "Khác", value: "Others" }
];

export default function FilterBar({
  search, setSearch,
  categoryFilter, setCategoryFilter,
  sortBy, setSortBy,
  sortDirection, setSortDirection,
  categories 
}: FilterBarProps) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search parts..."
            className="pl-9 w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
              focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        {/* Category Filter - Updated to use fixed list */}
        <div className="w-full md:w-56">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
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
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">Sắp xếp theo tên</option>
              <option value="quantity">Sắp xếp theo sỗ lượng</option>
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
          <div className="bg-primary/10 text-xs rounded-full px-3 py-1 flex items-center">
            <span>
              Category: {CATEGORY_OPTIONS.find(cat => cat.value === categoryFilter)?.label || categoryFilter}
            </span>
            <button 
              className="ml-2 text-gray-500 hover:text-gray-700" 
              onClick={() => setCategoryFilter("All")}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
}