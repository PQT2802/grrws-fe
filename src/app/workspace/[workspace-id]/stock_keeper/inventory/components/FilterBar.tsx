"use client";
import { Search, SortAsc, SortDesc, ChevronDown } from "lucide-react";
import { FilterBarProps } from "../../type";

export default function FilterBar({
  search, setSearch,
  machineFilter, setMachineFilter,
  categoryFilter, setCategoryFilter,
  sortBy, setSortBy,
  sortDirection, setSortDirection,
  machineTypes, categories
}: FilterBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 mb-6">
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
        {/* <div className="w-full md:w-48">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={machineFilter}
              onChange={e => setMachineFilter(e.target.value)}
            >
              <option value="">All Machine Types</option>
              {machineTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div> */}
        <div className="w-full md:w-40">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>
        <div className="w-full md:w-40">
          <div className="relative">
            <select
              className="w-full appearance-none border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 
                focus:outline-none focus:ring-2 focus:ring-primary/50 dark:bg-slate-700"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="name">Sort by Name</option>
              <option value="quantity">Sort by Quantity</option>
              {/* <option value="importedDate">Sort by Date</option> */}
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
      <div className="flex flex-wrap gap-2 mt-3">
        {machineFilter && (
          <div className="bg-primary/10 text-xs rounded-full px-3 py-1 flex items-center">
            <span>Machine: {machineFilter}</span>
            <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => setMachineFilter("")}>×</button>
          </div>
        )}
        {categoryFilter && (
          <div className="bg-primary/10 text-xs rounded-full px-3 py-1 flex items-center">
            <span>Category: {categoryFilter}</span>
            <button className="ml-2 text-gray-500 hover:text-gray-700" onClick={() => setCategoryFilter("")}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}