"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Package, Upload, PackageSearch } from "lucide-react";
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
import EnhancedExcelImportModal from "@/components/ExcelImportModal/EnhancedExcelImportModal";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";

export default function InventoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

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
  const [fullInventory, setFullInventory] = useState<
    SPAREPART_INVENTORY_ITEM[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialDataLoaded, setInitialDataLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state (server-side)
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);

  // State for handling direct part access from notifications
  const [directPartId, setDirectPartId] = useState<string | undefined>(
    undefined
  );

  // Special filter states for Low Stock and Out of Stock
  const [specialFilter, setSpecialFilter] = useState<string | null>(null);

  // ✅ REMOVED: View-only mode restrictions - Both Admin and Stock Keeper have full access
  const isStockKeeper = user?.role === USER_ROLES.STOCK_KEEPER;
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const hasFullAccess = isStockKeeper || isAdmin; // ✅ Both roles now have full access

  // Initialize pagination from URL params
  useEffect(() => {
    const page = searchParams.get("page");
    const size = searchParams.get("pageSize");
    const category = searchParams.get("category");
    const filter = searchParams.get("filter");

    if (page) {
      setPageIndex(parseInt(page) - 1);
    }
    if (size) {
      setPageSize(parseInt(size));
    }
    if (category) {
      setCategoryFilter(category);
    }
    if (filter === "lowstock") {
      setSpecialFilter("lowstock");
      setCategoryFilter("All");
    }
    if (filter === "outofstock") {
      setSpecialFilter("outofstock");
      setCategoryFilter("All");
    }
  }, [searchParams]);

  // Check for pending modal opening from sessionStorage
  useEffect(() => {
    if (initialDataLoaded) {
      const modalData = sessionStorage.getItem("openPartModal");
      if (modalData) {
        try {
          const { partId, timestamp } = JSON.parse(modalData);
          if (Date.now() - timestamp < 30000) {
            console.log("Opening modal for part from sessionStorage:", partId);
            setDirectPartId(partId);
            setIsModalOpen(true);
            sessionStorage.removeItem("openPartModal");
          } else {
            sessionStorage.removeItem("openPartModal");
          }
        } catch (error) {
          console.error("Error parsing modal data from sessionStorage:", error);
          sessionStorage.removeItem("openPartModal");
        }
      }
    }
  }, [initialDataLoaded]);

  // Update URL when pagination or category changes
  const updateURL = useCallback(
    (
      newPageIndex: number,
      newPageSize: number,
      newCategory?: string,
      newSpecialFilter?: string | null
    ) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", (newPageIndex + 1).toString());
      params.set("pageSize", newPageSize.toString());

      if (newCategory !== undefined) {
        if (newCategory === "All") {
          params.delete("category");
        } else {
          params.set("category", newCategory);
        }
      }

      // Handle special filters
      if (newSpecialFilter) {
        params.set("filter", newSpecialFilter);
      } else {
        params.delete("filter");
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Fetch full inventory for summary calculations
  const fetchFullInventory = useCallback(async () => {
    try {
      console.log("🔍 Fetching full inventory for summary calculations");
      const response = await apiClient.sparePart.getInventory(1, 1000);

      let inventoryData: SPAREPART_INVENTORY_ITEM[] = [];

      if (response && typeof response === "object") {
        if (
          (response as any).data?.data &&
          Array.isArray((response as any).data.data)
        ) {
          inventoryData = (response as any).data.data;
        } else if (
          (response as any).data &&
          Array.isArray((response as any).data)
        ) {
          inventoryData = (response as any).data;
        } else if (Array.isArray(response)) {
          inventoryData = response;
        }
      }

      setFullInventory(inventoryData);
      console.log(`✅ Full inventory loaded: ${inventoryData.length} items`);
    } catch (error) {
      console.error("❌ Error fetching full inventory:", error);
    }
  }, []);

  // Fetch inventory data for current page
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiPageNumber = pageIndex + 1;

      console.log(
        `🔍 Fetching inventory: page ${apiPageNumber}, size ${pageSize}`
      );

      const response = await apiClient.sparePart.getInventory(
        apiPageNumber,
        pageSize
      );
      console.log("🔍 API Client Response:", response);

      let inventoryData: SPAREPART_INVENTORY_ITEM[] = [];
      let totalCount = 0;

      if (response && typeof response === "object") {
        if (
          (response as any).data?.data &&
          Array.isArray((response as any).data.data)
        ) {
          inventoryData = (response as any).data.data;
          totalCount = (response as any).data.totalCount || 0;
        } else if (
          (response as any).data &&
          Array.isArray((response as any).data)
        ) {
          inventoryData = (response as any).data;
          totalCount = (response as any).totalCount || inventoryData.length;
        } else if (Array.isArray(response)) {
          inventoryData = response;
          totalCount = inventoryData.length;
        } else if (
          (response as any).items &&
          Array.isArray((response as any).items)
        ) {
          inventoryData = (response as any).items;
          totalCount = (response as any).totalCount || inventoryData.length;
        }
      }

      console.log(
        `✅ Processed inventory: ${inventoryData.length} items, total: ${totalCount}`
      );

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
      setError(
        `Không thể tải danh sách linh kiện: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
      toast.error(
        `Không thể tải danh sách linh kiện: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
      setInventory([]);
      setTotalCount(0);
      setInitialDataLoaded(true);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, updateURL]);

  // Fetch data when pagination changes
  useEffect(() => {
    fetchInventory();
    if (!fullInventory.length) {
      fetchFullInventory();
    }
  }, [fetchInventory, fetchFullInventory, fullInventory.length]);

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
    setSpecialFilter(null);
    updateURL(pageIndex, pageSize, category, null);
  };

  // Handle special filter clicks (Low Stock, Out of Stock)
  const handleSpecialFilterClick = (filterType: "lowstock" | "outofstock") => {
    setSpecialFilter(filterType);
    setCategoryFilter("All");
    setPageIndex(0);
    updateURL(0, pageSize, "All", filterType);
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
        ? new Date(item.expectedAvailabilityDate).toISOString().split("T")[0]
        : "",
    }));

    let filteredParts = convertedParts;

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredParts = filteredParts.filter(
        (part) =>
          part.name.toLowerCase().includes(searchLower) ||
          part.description.toLowerCase().includes(searchLower) ||
          part.category.toLowerCase().includes(searchLower)
      );
    }

    // Apply machine filter
    if (machineFilter) {
      filteredParts = filteredParts.filter(
        (part) => part.machineType === machineFilter
      );
    }

    // Apply category filter
    if (categoryFilter && categoryFilter !== "All") {
      filteredParts = filteredParts.filter(
        (part) => part.category === categoryFilter
      );
    }

    // Apply special filters
    if (specialFilter === "lowstock") {
      filteredParts = filteredParts.filter(
        (part) => part.quantity > 0 && part.quantity < 10
      );
    } else if (specialFilter === "outofstock") {
      filteredParts = filteredParts.filter((part) => part.quantity === 0);
    }

    // Apply sorting
    filteredParts.sort((a, b) => {
      let aValue, bValue;

      if (sortBy === "quantity") {
        aValue = a.quantity;
        bValue = b.quantity;
      } else {
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filteredParts;
  }, [
    inventory,
    search,
    machineFilter,
    categoryFilter,
    sortBy,
    sortDirection,
    specialFilter,
  ]);

  // Calculate summary statistics from full inventory
  const totalParts = fullInventory?.length || 0;
  const totalInventory = useMemo(
    () =>
      fullInventory?.reduce((sum, item) => sum + item.stockQuantity, 0) || 0,
    [fullInventory]
  );
  const lowStockCount = useMemo(
    () =>
      fullInventory?.filter(
        (item) => item.stockQuantity > 0 && item.stockQuantity < 10
      ).length || 0,
    [fullInventory]
  );
  const outOfStockCount = useMemo(
    () => fullInventory?.filter((item) => item.stockQuantity === 0).length || 0,
    [fullInventory]
  );

  // Event handlers
  const handlePartClick = (part: PartType) => {
    console.log("Part clicked:", part);
    setSelectedPart(part);
    setDirectPartId(undefined);
    setIsModalOpen(true);
  };

  const refreshSelectedPart = async () => {
    if (selectedPart?.id) {
      try {
        console.log(`Refreshing selected part: ${selectedPart.id}`);
        await fetchInventory();
        await fetchFullInventory();

        const updatedPart = processedInventory.find(
          (p) => p.id === selectedPart.id
        );
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

  // ✅ Handle Excel import - Available for both Admin and Stock Keeper
  const handleImportClick = () => {
    if (!hasFullAccess) {
      toast.warning("Bạn không có quyền nhập linh kiện");
      return;
    }
    setShowImportModal(true);
  };

  const handleImportModalClose = () => {
    setShowImportModal(false);
  };

  const handleFileImport = async (file: File) => {
    if (!hasFullAccess) {
      toast.error("Bạn không có quyền nhập linh kiện");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    console.log(`📂 Importing spare parts file: ${file.name}`);

    await apiClient.sparePart.importSparePart(formData);

    // Refresh both inventories
    await fetchInventory();
    await fetchFullInventory();
  };

  const PaginationSection = () => (
    <div className="flex flex-col sm:flex-row items-center sm:justify-end gap-4 mt-6">
      <div className="flex items-center gap-3 w-full sm:w-auto order-2 sm:order-1 justify-center sm:justify-start">
        <span className="text-sm text-muted-foreground">Số mục mỗi trang</span>
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
        <span className="text-sm text-muted-foreground">
          {`${totalCount} tổng số mục`}
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
      <div className="space-y-6 bg-background min-h-screen p-6">
        <div className="p-6">
          <div className="text-center py-8">
            <PackageSearch className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button
              onClick={fetchInventory}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Thử lại tải kho hàng
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6 bg-background min-h-screen p-2">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <PackageSearch className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h1 className="text-xl font-bold text-foreground">
                Kho Linh Kiện
              </h1>
            </div>
            {/* ✅ Show Import button for both Admin and Stock Keeper */}
            {hasFullAccess && (
              <Button
                onClick={handleImportClick}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Nhập Linh Kiện
              </Button>
            )}
          </div>

          {/* Admin-style summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-lg border transition-colors bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Tổng Số Loại</p>
                  <p className="text-2xl font-bold">{totalParts}</p>
                </div>
                <Package className="w-8 h-8 opacity-75" />
              </div>
            </div>

            <div className="p-4 rounded-lg border transition-colors bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Tổng Tồn Kho</p>
                  <p className="text-2xl font-bold">{totalInventory}</p>
                </div>
                <Package className="w-8 h-8 opacity-75" />
              </div>
            </div>

            {/* Clickable Low Stock card */}
            <button
              onClick={() => handleSpecialFilterClick("lowstock")}
              className={`p-4 rounded-lg border transition-colors cursor-pointer text-left w-full block appearance-none bg-transparent outline-none focus:outline-none hover:shadow-md active:scale-95 ${
                specialFilter === "lowstock"
                  ? "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700"
                  : "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Sắp Hết Hàng</p>
                  <p className="text-2xl font-bold">{lowStockCount}</p>
                </div>
                <Package className="w-8 h-8" />
              </div>
            </button>

            {/* Clickable Out of Stock card */}
            <button
              onClick={() => handleSpecialFilterClick("outofstock")}
              className={`p-4 rounded-lg border transition-colors cursor-pointer text-left w-full block appearance-none bg-transparent outline-none focus:outline-none hover:shadow-md active:scale-95 ${
                specialFilter === "outofstock"
                  ? "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                  : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400 dark:border-red-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">Hết Hàng</p>
                  <p className="text-2xl font-bold">{outOfStockCount}</p>
                </div>
                <Package className="w-8 h-8" />
              </div>
            </button>
          </div>
        </div>

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
          specialFilter={specialFilter}
          onClearSpecialFilter={() => {
            setSpecialFilter(null);
            updateURL(pageIndex, pageSize, categoryFilter, null);
          }}
        />

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          {loading ? (
            <SkeletonCard />
          ) : processedInventory.length > 0 ? (
            <>
              {/* Parts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {processedInventory.map((part) => (
                  <PartCard
                    key={part.id}
                    part={part}
                    onClick={handlePartClick}
                  />
                ))}
              </div>

              {/* Pagination */}
              <PaginationSection />
            </>
          ) : totalCount > 0 ? (
            <div className="text-center py-8">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Không tìm thấy linh kiện phù hợp với bộ lọc.
              </p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => {
                  setSearch("");
                  setMachineFilter("");
                  setCategoryFilter("All");
                  setSpecialFilter(null);
                  updateURL(pageIndex, pageSize, "All", null);
                }}
              >
                Xóa tất cả bộ lọc
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Không tìm thấy linh kiện.</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => handlePageChange(1)}
              >
                Về trang đầu
              </Button>
            </div>
          )}
        </div>

        {/* ✅ Excel Import Modal - Available for both Admin and Stock Keeper */}
        {hasFullAccess && (
          <EnhancedExcelImportModal
            isOpen={showImportModal}
            onClose={handleImportModalClose}
            onImport={handleFileImport}
            title="Nhập linh kiện từ Excel"
            successMessage="Nhập linh kiện thành công"
            importType="sparepart" 
          />
        )}
      </div>

      {/* ✅ Modal - Full access for both roles */}
      <PartDetailModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        part={selectedPart}
        partId={directPartId}
        onUpdate={refreshSelectedPart}
        isViewOnlyMode={false} // ✅ Remove view-only mode
      />
    </>
  );
}
