"use client";

import { useState, useMemo } from "react";
import { mockParts } from "./data/mockData";
import { sortAndFilterParts } from "./utils/sortAndFilter";
import PartCard from "./components/PartCard";
import FilterBar from "./components/FilterBar";
import { PartType } from "../type";
import PartDetailModal from "./components/PartDetailModal";
import AddPartModal from "./components/AddPartModal";

export default function InventoryPage() {
  const [search, setSearch] = useState<string>("");
  const [machineFilter, setMachineFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New state for AddPartModal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [parts, setParts] = useState<PartType[]>(mockParts);

  const machineTypes = useMemo(
    () => [...new Set(mockParts.map((p) => p.machineType))],
    []
  );
  const categories = useMemo(
    () => [...new Set(mockParts.map((p) => p.category))],
    []
  );

  const filteredParts = useMemo(
    () =>
      sortAndFilterParts(
        mockParts,
        search,
        machineFilter,
        categoryFilter,
        sortBy,
        sortDirection
      ),
    [search, machineFilter, categoryFilter, sortBy, sortDirection]
  );

  const handlePartClick = (part: PartType) => {
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  // Handler for adding a new part
  const handleAddPart = (newPart: Omit<PartType, "id">) => {
    const id = `P-${String(parts.length + 1).padStart(3, '0')}`;
    setParts([...parts, { ...newPart, id }]);
  };

  const totalParts = mockParts.reduce((sum, part) => sum + part.quantity, 0);
  const lowStockCount = mockParts.filter(
    (part) => part.quantity < part.minThreshold
  ).length;

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Parts Inventory</h1>
          <button onClick={() => setShowAddModal(true)} className="bg-primary text-white rounded-md px-4 py-2 text-sm font-medium">
            + Add New Part
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Parts
            </p>
            <p className="text-2xl font-bold">{mockParts.length} types</p>
          </div>
          <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Inventory
            </p>
            <p className="text-2xl font-bold">{totalParts} units</p>
          </div>
          <div className="bg-red-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Low Stock Items
            </p>
            <p className="text-2xl font-bold text-red-600">
              {lowStockCount} types
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        machineFilter={machineFilter}
        setMachineFilter={setMachineFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        machineTypes={machineTypes}
        categories={categories}
      />

      {/* Parts Grid */}
      {filteredParts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredParts.map((part) => (
            <PartCard key={part.id} part={part} onClick={handlePartClick} />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No parts found matching your filters.</p>
          <button
            className="mt-2 text-primary hover:underline text-sm"
            onClick={() => {
              setSearch("");
              setMachineFilter("");
              setCategoryFilter("");
            }}
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* Part Detail Modal */}
      {selectedPart && (
        <PartDetailModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          part={selectedPart}
        />
      )}
      <AddPartModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddPart}
        machineTypes={machineTypes}
        categories={categories}
      />
    </div>
  );
}
