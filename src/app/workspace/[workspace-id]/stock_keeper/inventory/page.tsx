"use client";

import { useState, useEffect, useMemo } from "react";
import { mockParts } from "./data/mockData";
import { sortAndFilterParts } from "./utils/sortAndFilter";
import PartCard from "./components/PartCard";
import FilterBar from "./components/FilterBar";
import { PartType } from "../type";
import PartDetailModal from "./components/PartDetailModal";
import ImportSparePartModal from "./components/ImportSparePartModal";
import { sparePartService } from "@/app/service/sparePart.service";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import { toast } from "react-toastify";
import Pagination from "./components/Pagination";
import PageSizeSelector from "./components/PageSizeSelector";

export default function InventoryPage() {
  const [search, setSearch] = useState<string>("");
  const [machineFilter, setMachineFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New state for AddPartModal
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [parts, setParts] = useState<PartType[]>(mockParts);
  const [inventory, setInventory] = useState<SPAREPART_INVENTORY_ITEM[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add a new state for page loading
  const [isPageChanging, setIsPageChanging] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);

  const machineTypes = useMemo(() => {
    if (!inventory) return [];
    const allMachineNames = inventory.flatMap((item) => item.machineNames);
    return [...new Set(allMachineNames)].filter(Boolean);
  }, [inventory]);
  const categories = useMemo(() => {
    if (!inventory) return [];
    return [...new Set(inventory.map((item) => item.category))].filter(Boolean) as string[];
  }, [inventory]);

  const processedInventory = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];

    // Convert API data to format needed by components
    return sortAndFilterParts(
      inventory.map((item) => ({
        id: item.id,
        name: item.sparepartName,
        machineType: item.machineNames.length > 0 ? item.machineNames[0] : "Khác",
        category: item.category || "Chung",
        quantity: item.stockQuantity,
        minThreshold: 10,
        description: item.description || "",
        image: item.imgUrl || "/placeholder-part.png",
        importedDate: new Date().toISOString().split("T")[0],
        unit: item.unit || "Cái",
        specification: item.specification || "",
        supplier: item.supplierName || "",
        supplierId: item.supplierId || "",
        unitPrice: item.unitPrice || 0,
        expectedAvailabilityDate: item.expectedAvailabilityDate 
          ? new Date(item.expectedAvailabilityDate).toISOString().split('T')[0]
          : ""
      })),
      search,
      machineFilter,
      categoryFilter,
      sortBy,
      sortDirection
    );
  }, [inventory, search, machineFilter, categoryFilter, sortBy, sortDirection]);

  const totalParts = useMemo(() => inventory?.length || 0, [inventory]);
  const totalInventory = useMemo(
    () =>
      inventory?.reduce((sum, item) => sum + item.stockQuantity, 0) || 0,
    [inventory]
  );
  const lowStockCount = useMemo(
    () => inventory?.filter((item) => item.stockQuantity < 10).length || 0,
    [inventory]
  );

  // Calculate total pages
  const totalPages = useMemo(() => 
    Math.max(1, Math.ceil(totalItems / pageSize)), 
    [totalItems, pageSize]
  );

  const handlePartClick = (part: PartType) => {
    console.log("Part clicked:", part);
    setSelectedPart(part);
    setIsModalOpen(true);
  };

  // Handler for adding a new part
  const handleAddPart = (newPart: Omit<PartType, "id">) => {
    const id = `P-${String(parts.length + 1).padStart(3, "0")}`;
    setParts([...parts, { ...newPart, id }]);
  };

  const fetchInventory = async () => {
  try {
    setIsLoading(true);
    setIsPageChanging(true);
    const response = await sparePartService.getSparePartInventory(currentPage, pageSize);

    console.log("Response from service:", response);

    if (response?.data?.data) {
      console.log(`Retrieved ${response.data.data.length} spare parts (page ${response.data.pageNumber} of ${Math.ceil(response.data.totalCount / response.data.pageSize)})`);
      setInventory(response.data.data);
      setTotalItems(response.data.totalCount);

      // Handle empty pages gracefully
      if (response.data.data.length === 0 && currentPage > 1) {
        console.log("Empty page detected, returning to page 1");
        setCurrentPage(1);
        return;
      }

      // Ensure currentPage matches backend response
      if (response.data.pageNumber !== currentPage) {
        setCurrentPage(response.data.pageNumber);
      }
    } else {
      console.error("Invalid response structure:", response);
      setInventory([]);
      setTotalItems(0);
      toast.error("Received invalid data format from server");
    }
  } catch (error) {
    console.error("Error fetching inventory:", error);
    toast.error("Failed to load parts inventory");
    setInventory([]);
    setTotalItems(0);
  } finally {
    setIsLoading(false);
    setIsPageChanging(false);
  }
};

  useEffect(() => {
  fetchInventory();
  console.log("Fetching inventory for page:", currentPage);
}, [currentPage, pageSize]);

  // Debug pagination
  useEffect(() => {
    console.log("Pagination Debug:", { 
      totalItems, 
      pageSize, 
      totalPages, 
      currentPage 
    });
  }, [totalItems, pageSize, totalPages, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // No need to manually fetch as the useEffect will trigger
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Force pagination to work with 3 pages for testing
  useEffect(() => {
    if (totalItems <= pageSize) {
      console.log("Forcing totalItems to 30 for testing pagination");
      setTotalItems(30);
    }
  }, [totalItems, pageSize]);

  // Add this new function to refresh a specific part
  const refreshSelectedPart = async () => {
    if (selectedPart?.id) {
      try {
        console.log(`Refreshing selected part: ${selectedPart.id}`);
        
        // Refresh the entire inventory to get latest data
        await fetchInventory();
        
        // Find the updated part in the new inventory data
        const updatedPart = processedInventory.find(p => p.id === selectedPart.id);
        if (updatedPart) {
          console.log("Updated part found:", updatedPart);
          setSelectedPart(updatedPart);
        } else {
          console.warn("Updated part not found in inventory");
          // Close modal if part no longer exists
          setIsModalOpen(false);
          setSelectedPart(null);
        }
      } catch (error) {
        console.error("Error refreshing selected part:", error);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Parts Inventory</h1>
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-primary text-white rounded-md px-4 py-2 text-sm font-medium"
          >
            Import Spare Part
          </button>
        </div>
        {/* Update the statistics section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Parts
            </p>
            <p className="text-2xl font-bold">{totalParts} types</p>
          </div>
          <div className="bg-green-50 dark:bg-slate-700 p-4 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Inventory
            </p>
            <p className="text-2xl font-bold">{totalInventory} units</p>
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
      {isLoading ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">
            {isPageChanging ? "Changing page..." : "Loading inventory data..."}
          </p>
        </div>
      ) : processedInventory.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {processedInventory.map((part) => (
            <PartCard key={part.id} part={part} onClick={handlePartClick} />
          ))}
        </div>
      ) : totalItems > 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No parts found on this page.</p>
          <button
            className="mt-2 text-primary hover:underline text-sm"
            onClick={() => setCurrentPage(1)}
          >
            Go to first page
          </button>
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

      {/* Pagination Component - Always show when not loading */}
      {!isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <PageSizeSelector 
            pageSize={pageSize} 
            onPageSizeChange={handlePageSizeChange}
          />
          <Pagination 
            currentPage={currentPage} 
            totalPages={totalPages} 
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {/* Part Detail Modal */}
      {selectedPart && (
        <PartDetailModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedPart(null);
          }}
          part={selectedPart!}
          onUpdate={refreshSelectedPart} // Pass the refresh function
        />
      )}
      <ImportSparePartModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={fetchInventory}
      />
    </div>
  );
}
