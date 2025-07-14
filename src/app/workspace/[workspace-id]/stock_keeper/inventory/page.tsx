"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PartCard from "./components/PartCard";
import FilterBar from "./components/FilterBar";
import { PartType } from "../type";
import PartDetailModal from "./components/PartDetailModal";
import { apiClient } from "@/lib/api-client";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import { toast } from "react-toastify";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Upload } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import ExcelImportModal from "@/components/ExcelImportModal/ExcelImportModal";

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State for UI filters (client-side)
  const [search, setSearch] = useState<string>("");
  const [machineFilter, setMachineFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<string>("asc");
  
  // State for modal
  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  
  // State for data
  const [inventory, setInventory] = useState<SPAREPART_INVENTORY_ITEM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state (server-side)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // State for handling direct part access from notifications
  const [directPartId, setDirectPartId] = useState<string | undefined>(undefined);

  // Initialize pagination from URL params
  useEffect(() => {
    const page = searchParams.get('page');
    const size = searchParams.get('pageSize');
    const category = searchParams.get('category');
    const filter = searchParams.get('filter');
    
    if (page) {
      setPageIndex(parseInt(page) - 1);
    }
    if (size) {
      setPageSize(parseInt(size));
    }
    if (category) {
      setCategoryFilter(category);
    }
    if (filter === 'lowstock') {
      setCategoryFilter("All");
    }
  }, [searchParams]);

  // Check for pending modal opening from sessionStorage
  useEffect(() => {
    if (initialDataLoaded) {
      const modalData = sessionStorage.getItem('openPartModal');
      if (modalData) {
        try {
          const { partId, timestamp } = JSON.parse(modalData);
          // Only open if the data is recent (within 30 seconds)
          if (Date.now() - timestamp < 30000) {
            console.log('Opening modal for part from sessionStorage:', partId);
            setDirectPartId(partId);
            setIsModalOpen(true);
            
            // Clean up sessionStorage immediately after use
            sessionStorage.removeItem('openPartModal');
          } else {
            // Clean up expired data
            sessionStorage.removeItem('openPartModal');
          }
        } catch (error) {
          console.error('Error parsing modal data from sessionStorage:', error);
          sessionStorage.removeItem('openPartModal');
        }
      }
    }
  }, [initialDataLoaded]);

  // Update URL when pagination or category changes
  const updateURL = (newPageIndex: number, newPageSize: number, newCategory?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', (newPageIndex + 1).toString());
    params.set('pageSize', newPageSize.toString());
    
    if (newCategory !== undefined) {
      if (newCategory === "All") {
        params.delete('category');
      } else {
        params.set('category', newCategory);
      }
    }
    
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Fetch inventory data directly using API client
  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiPageNumber = pageIndex + 1;
      
      console.log(`🔍 Fetching inventory: page ${apiPageNumber}, size ${pageSize}`);
      
      // Use the API client directly instead of service layer
      const response = await apiClient.sparePart.getInventory(apiPageNumber, pageSize);

      console.log("🔍 API Client Response:", response);

      let inventoryData: SPAREPART_INVENTORY_ITEM[] = [];
      let totalCount = 0;

      // Handle different response structures from the API
      if (response && typeof response === 'object') {
        // Check if it's a paginated response
        if ((response as any).data?.data && Array.isArray((response as any).data.data)) {
          inventoryData = (response as any).data.data;
          totalCount = (response as any).data.totalCount || 0;
        }
        // Check if it's a direct data array with pagination info
        else if ((response as any).data && Array.isArray((response as any).data)) {
          inventoryData = (response as any).data;
          totalCount = (response as any).totalCount || inventoryData.length;
        }
        // Check if response itself is an array
        else if (Array.isArray(response)) {
          inventoryData = response;
          totalCount = inventoryData.length;
        }
        // Check if response has items directly
        else if ((response as any).items && Array.isArray((response as any).items)) {
          inventoryData = (response as any).items;
          totalCount = (response as any).totalCount || inventoryData.length;
        }
      }

      console.log(`✅ Processed inventory: ${inventoryData.length} items, total: ${totalCount}`);
      
      setInventory(inventoryData);
      setTotalCount(totalCount);
      setInitialDataLoaded(true);

      if (inventoryData.length === 0 && pageIndex > 0) {
        console.log("📄 Empty page detected, returning to page 1");
        setPageIndex(0);
        updateURL(0, pageSize);
        return;
      }

    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
      setError(`Failed to load parts inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      toast.error(`Failed to load parts inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setInventory([]);
      setTotalCount(0);
      setInitialDataLoaded(true);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when pagination changes
  useEffect(() => {
    fetchInventory();
  }, [pageIndex, pageSize]);

  // Calculate pagination values
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = pageIndex + 1;

  // Handle page changes
  const handlePageChange = (page: number) => {
    const newPageIndex = page - 1;
    setPageIndex(newPageIndex);
    updateURL(newPageIndex, pageSize);
  };

  // Handle page size changes
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setPageIndex(0);
    updateURL(0, size);
  };

  // Handle category filter changes
  const handleCategoryFilterChange = (category: string) => {
    setCategoryFilter(category);
    updateURL(pageIndex, pageSize, category);
  };

  // Get filter options from current inventory
  const machineTypes = useMemo(() => {
    if (!inventory) return [];
    const allMachineNames = inventory.flatMap((item) => item.machineNames);
    return [...new Set(allMachineNames)].filter(Boolean);
  }, [inventory]);

  const categories: string[] = [];

  // Process inventory for display (client-side filtering)
  const processedInventory = useMemo(() => {
    if (!inventory || inventory.length === 0) return [];

    const convertedParts = inventory.map((item) => ({
      id: item.id,
      name: item.sparepartName,
      machineType: item.machineNames.length > 0 ? item.machineNames[0] : "Khác",
      category: item.category || "Others",
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
    }));

    let filteredParts = convertedParts;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParts = filteredParts.filter(part =>
        part.name.toLowerCase().includes(searchLower) ||
        part.description.toLowerCase().includes(searchLower) ||
        part.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply machine filter
    if (machineFilter) {
      filteredParts = filteredParts.filter(part => part.machineType === machineFilter);
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== "All") {
      filteredParts = filteredParts.filter(part => part.category === categoryFilter);
    }

    // Apply low stock filter if coming from notification
    if (searchParams.get('filter') === 'lowstock') {
      filteredParts = filteredParts.filter(part => part.quantity > 0 && part.quantity < 10);
    }

    // Apply sorting
    filteredParts.sort((a, b) => {
      let aValue, bValue;
      
      if (sortBy === 'quantity') {
        aValue = a.quantity;
        bValue = b.quantity;
      } else {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredParts;
  }, [inventory, search, machineFilter, categoryFilter, sortBy, sortDirection, searchParams]);

  // Calculate summary statistics
  const totalParts = inventory?.length || 0;
  const totalInventory = useMemo(
    () => inventory?.reduce((sum, item) => sum + item.stockQuantity, 0) || 0,
    [inventory]
  );
  const lowStockCount = useMemo(
    () => inventory?.filter((item) => item.stockQuantity < 10).length || 0,
    [inventory]
  );

  // Event handlers
  const handlePartClick = (part: PartType) => {
    console.log("Part clicked:", part);
    setSelectedPart(part);
    setDirectPartId(undefined); // Clear direct part ID when selecting from list
    setIsModalOpen(true);
  };

  const refreshSelectedPart = async () => {
    if (selectedPart?.id) {
      try {
        console.log(`Refreshing selected part: ${selectedPart.id}`);
        await fetchInventory();
        
        const updatedPart = processedInventory.find(p => p.id === selectedPart.id);
        if (updatedPart) {
          console.log("Updated part found:", updatedPart);
          setSelectedPart(updatedPart);
        } else {
          console.warn("Updated part not found in inventory");
          setIsModalOpen(false);
          setSelectedPart(null);
        }
      } catch (error) {
        console.error("Error refreshing selected part:", error);
      }
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedPart(null);
    setDirectPartId(undefined);
  };

  // Handle Excel import
  const handleImportClick = () => {
    setShowImportModal(true);
  };

  const handleImportModalClose = () => {
    setShowImportModal(false);
  };

  const handleFileImport = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    console.log(`📂 Importing spare parts file: ${file.name}`);
    
    await apiClient.sparePart.importSparePart(formData);
    
    // Refresh the inventory
    await fetchInventory();
  };

  const PaginationSection = () => (
    <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-4 mt-6">
      <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1 justify-center sm:justify-start">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Items per page
        </span>
        <Select
          value={pageSize.toString()}
          onValueChange={(value: string) => handlePageSizeChange(Number(value))}
        >
          <SelectTrigger className="w-[80px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50, 100].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {`${totalCount} total items`}
        </span>
      </div>

      <div className="w-full sm:w-auto order-1 sm:order-2 flex justify-center sm:justify-end ml-auto">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => handlePageChange(currentPage - 1)}
                className={
                  currentPage <= 1 
                    ? "pointer-events-none opacity-50" 
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }

              return (
                <PaginationItem key={pageNumber}>
                  <PaginationLink
                    onClick={() => handlePageChange(pageNumber)}
                    isActive={pageNumber === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNumber}
                  </PaginationLink>
                </PaginationItem>
              );
            })}

            <PaginationItem>
              <PaginationNext
                onClick={() => handlePageChange(currentPage + 1)}
                className={
                  currentPage >= totalPages 
                    ? "pointer-events-none opacity-50" 
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );

  // Show error state
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <p className="text-red-500 mb-4">{error}</p>
              <Button
                onClick={fetchInventory}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Retry Loading Inventory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <Card>
        <CardHeader className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Parts Inventory</h1>
            <Button
              onClick={handleImportClick}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Spare Parts
            </Button>
          </div>
          
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
        </CardHeader>
      </Card>

      {/* Search and Filter Bar */}
      <FilterBar
        search={search}
        setSearch={setSearch}
        machineFilter={machineFilter}
        setMachineFilter={setMachineFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={handleCategoryFilterChange}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        machineTypes={machineTypes}
        categories={categories}
      />

      {/* Content */}
      <Card>
        <CardContent className="p-6">
          {loading ? (
            <SkeletonCard />
          ) : processedInventory.length > 0 ? (
            <>
              {/* Parts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {processedInventory.map((part) => (
                  <PartCard key={part.id} part={part} onClick={handlePartClick} />
                ))}
              </div>
              
              {/* Pagination */}
              <PaginationSection />
            </>
          ) : totalCount > 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No parts found matching your filters.</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearch("");
                  setMachineFilter("");
                  setCategoryFilter("All");
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No parts found.</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => handlePageChange(1)}
              >
                Go to first page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <PartDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        part={selectedPart}
        partId={directPartId}
        onUpdate={refreshSelectedPart}
      />
      
      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={handleImportModalClose}
        onImport={handleFileImport}
        title="Nhập linh kiện từ Excel"
        successMessage="Nhập linh kiện thành công"
      />
    </div>
  );
}
