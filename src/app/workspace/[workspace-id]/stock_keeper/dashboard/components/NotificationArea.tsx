'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Bell, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sparePartService } from '@/app/service/sparePart.service';

interface UnconfirmedRequest {
  id: string;
  requestCode: string;
  assigneeName: string;
  requestDate: string;
  status: string;
  itemCount: number;
}

interface LowStockItem {
  id: string;
  sparepartName: string;
  category: string;
  stockQuantity: number;
  unit: string;
}

interface NotificationState {
  unconfirmedRequests: UnconfirmedRequest[];
  lowStockItems: LowStockItem[];
  totalUnconfirmedCount: number;
  totalLowStockCount: number;
  isLoading: boolean;
  error: string | null;
}

export default function NotificationArea() {
  const router = useRouter();
  const [state, setState] = useState<NotificationState>({
    unconfirmedRequests: [],
    lowStockItems: [],
    totalUnconfirmedCount: 0,
    totalLowStockCount: 0,
    isLoading: true,
    error: null
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleRequestClick = useCallback((requestId: string) => {
    router.push(`./requests/${requestId}`);
  }, [router]);

  const handleViewAllRequests = useCallback(() => {
    router.push('./requests?status=Unconfirmed');
  }, [router]);

  const handleLowStockItemClick = useCallback((item: LowStockItem) => {
    console.log('Low stock item clicked:', item);
    // Store the partId in sessionStorage and navigate to inventory
    sessionStorage.setItem('openPartModal', JSON.stringify({
      partId: item.id,
      timestamp: Date.now()
    }));
    router.push('./inventory');
  }, [router]);

  const handleViewInventory = useCallback(() => {
    router.push('./inventory?filter=lowstock');
  }, [router]);

  // Optimized data processing functions
  const processRequests = useCallback((rawRequests: any[]) => {
    const allUnconfirmedRequests = rawRequests.filter((req: any) => 
      req.status === 'Unconfirmed'
    );
    
    const totalUnconfirmed = allUnconfirmedRequests.length;
    const unconfirmedToDisplay = allUnconfirmedRequests.slice(0, 5);

    return {
      unconfirmedRequests: unconfirmedToDisplay.map((req: any) => ({
        id: req.id,
        requestCode: req.requestCode,
        assigneeName: req.assigneeName,
        requestDate: new Date(req.requestDate).toLocaleDateString(),
        status: req.status,
        itemCount: req.sparePartUsages?.length || 0
      })),
      totalUnconfirmedCount: totalUnconfirmed
    };
  }, []);

  const processInventory = useCallback((rawInventory: any[]) => {
    const allLowStockItems = rawInventory.filter((item: any) => 
      item.stockQuantity > 0 && item.stockQuantity < 10 
    );
    
    const totalLowStock = allLowStockItems.length;
    const lowStockToDisplay = allLowStockItems.slice(0, 3);

    return {
      lowStockItems: lowStockToDisplay,
      totalLowStockCount: totalLowStock
    };
  }, []);

  const fetchNotificationData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Use Promise.allSettled to handle partial failures gracefully
      const [requestsResult, inventoryResult] = await Promise.allSettled([
        sparePartService.getSparePartRequests(),
        sparePartService.getSparePartInventory(1, 1000)
      ]);

      // Process requests
      let processedRequests: { unconfirmedRequests: UnconfirmedRequest[]; totalUnconfirmedCount: number } = { unconfirmedRequests: [], totalUnconfirmedCount: 0 };
      if (requestsResult.status === 'fulfilled') {
        const requestsResponse = requestsResult.value;
        let requests: any[] = [];
        
        if (requestsResponse?.data?.data) {
          requests = requestsResponse.data.data;
        } else if (requestsResponse?.data && Array.isArray(requestsResponse.data)) {
          requests = requestsResponse.data;
        } else if (Array.isArray(requestsResponse)) {
          requests = requestsResponse;
        }

        processedRequests = processRequests(requests);
      } else {
        console.error('Failed to fetch requests:', requestsResult.reason);
      }

      // Process inventory
      let processedInventory: { lowStockItems: LowStockItem[]; totalLowStockCount: number } = { lowStockItems: [], totalLowStockCount: 0 };
      if (inventoryResult.status === 'fulfilled') {
        const inventoryResponse = inventoryResult.value;
        let inventory: any[] = [];
        
        if (inventoryResponse?.data?.data) {
          inventory = inventoryResponse.data.data;
        } else if (inventoryResponse?.data && Array.isArray(inventoryResponse.data)) {
          inventory = inventoryResponse.data;
        } else if (Array.isArray(inventoryResponse)) {
          inventory = inventoryResponse;
        }

        processedInventory = processInventory(inventory);
      } else {
        console.error('Failed to fetch inventory:', inventoryResult.reason);
      }

      setState(prev => ({
        ...prev,
        ...processedRequests,
        ...processedInventory,
        isLoading: false
      }));

    } catch (error) {
      console.error('Error fetching notification data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load notifications'
      }));
    }
  }, [processRequests, processInventory]);

  // Use useEffect with empty dependency array to prevent unnecessary re-fetches
  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Memoized render components to prevent unnecessary re-renders
  const LoadingComponent = useMemo(() => (
    <div className="space-y-6">
      <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
      <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-32"></div>
    </div>
  ), []);

  const UnconfirmedRequestsSection = useMemo(() => (
    <div className="rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h2 className="font-semibold text-lg">Unconfirmed Requests</h2>
          {state.totalUnconfirmedCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {state.totalUnconfirmedCount}
            </span>
          )}
        </div>
        <button
          onClick={handleViewAllRequests}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
        >
          View All <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {state.unconfirmedRequests.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No unconfirmed requests</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
          {state.unconfirmedRequests.map((req) => (
            <li 
              key={req.id} 
              className="py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer rounded transition-colors"
              onClick={() => handleRequestClick(req.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-blue-600">{req.requestCode}</span>
                    <span className="text-sm text-gray-500">by {req.assigneeName}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {req.itemCount} items • {req.requestDate}
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                  {req.status}
                </span>
              </div>
            </li>
          ))}
          {state.totalUnconfirmedCount > state.unconfirmedRequests.length && (
            <li className="pt-2 text-center">
              <span className="text-sm text-gray-500">
                and {state.totalUnconfirmedCount - state.unconfirmedRequests.length} more...
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  ), [state.unconfirmedRequests, state.totalUnconfirmedCount, handleRequestClick, handleViewAllRequests]);

  // Add category mapping function
  const getCategoryLabel = (value: string): string => {
    const CATEGORY_OPTIONS = [
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
    
    const category = CATEGORY_OPTIONS.find(cat => cat.value === value);
    return category ? category.label : value;
  };

  const LowStockSection = useMemo(() => (
    <div className="rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <h2 className="font-semibold text-lg">Cảnh báo tồn kho thấp</h2>
          {state.totalLowStockCount > 0 && (
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {state.totalLowStockCount}
            </span>
          )}
        </div>
        <button
          onClick={handleViewInventory}
          className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
        >
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {state.lowStockItems.length === 0 ? (
        <p className="text-gray-500 text-center py-4">Tất cả vật tư đều có tồn kho đầy đủ</p>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
          {state.lowStockItems.map((item) => (
            <li 
              key={item.id} 
              className="py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer rounded transition-colors"
              onClick={() => handleLowStockItemClick(item)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-orange-600">{item.sparepartName}</p>
                  <p className="text-sm text-gray-400">{getCategoryLabel(item.category)}</p>
                </div>
                <div className="text-right">
                  <span className="text-orange-600 font-semibold">
                    {item.stockQuantity} {item.unit}
                  </span>
                  <p className="text-xs text-gray-400">còn lại</p>
                </div>
              </div>
            </li>
          ))}
          {state.totalLowStockCount > state.lowStockItems.length && (
            <li className="pt-2 text-center">
              <span className="text-sm text-gray-500">
                và {state.totalLowStockCount - state.lowStockItems.length} mục khác...
              </span>
            </li>
          )}
        </ul>
      )}
    </div>
  ), [state.lowStockItems, state.totalLowStockCount, handleLowStockItemClick, handleViewInventory]);

  if (state.isLoading) return LoadingComponent;

  if (state.error) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg shadow-sm border p-6">
          <p className="text-center text-red-500">{state.error}</p>
          <button
            onClick={fetchNotificationData}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {UnconfirmedRequestsSection}
      {LowStockSection}
    </div>
  );
}
