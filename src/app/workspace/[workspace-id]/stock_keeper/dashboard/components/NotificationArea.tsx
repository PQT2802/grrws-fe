'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Bell, ArrowRight, Package, AlertCircle, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface UnconfirmedRequest {
  id: string;
  requestCode: string;
  assigneeName: string;
  requestDate: string;
  status: string;
  itemCount: number;
}

interface UnconfirmedMachineRequest {
  id: string;
  title: string;
  description: string;
  requestDate: string;
  status: string;
  areaPath?: string; 
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
  unconfirmedMachineRequests: UnconfirmedMachineRequest[];
  lowStockItems: LowStockItem[];
  totalUnconfirmedCount: number;
  totalUnconfirmedMachineCount: number;
  totalLowStockCount: number;
  isLoading: boolean;
  error: string | null;
}

// Vietnamese status mapping
const getStatusLabel = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'Pending': 'Chờ duyệt',
    'Unconfirmed': 'Chưa xác nhận',
    'Confirmed': 'Đã xác nhận',
    'InProgress': 'Đang tiến hành',
    'Completed': 'Hoàn thành',
    'Rejected': 'Từ chối',
    'OnHold': 'Tạm dừng',
    'Cancelled': 'Đã hủy'
  };
  return statusMap[status] || status;
};

// Vietnamese status badge colors (consistent with StatusBadge component)
const getStatusBadgeClass = (status: string): string => {
  const statusClasses: { [key: string]: string } = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'Unconfirmed': 'bg-yellow-100 text-yellow-700',
    'Confirmed': 'bg-green-100 text-green-700',
    'InProgress': 'bg-blue-100 text-blue-700',
    'Completed': 'bg-green-100 text-green-700',
    'Rejected': 'bg-red-100 text-red-700',
    'OnHold': 'bg-gray-100 text-gray-700',
    'Cancelled': 'bg-red-100 text-red-700'
  };
  return statusClasses[status] || 'bg-gray-100 text-gray-700';
};

export default function NotificationArea() {
  const router = useRouter();
  const [state, setState] = useState<NotificationState>({
    unconfirmedRequests: [],
    unconfirmedMachineRequests: [],
    lowStockItems: [],
    totalUnconfirmedCount: 0,
    totalUnconfirmedMachineCount: 0,
    totalLowStockCount: 0,
    isLoading: true,
    error: null
  });

  // Memoized handlers to prevent unnecessary re-renders
  const handleRequestClick = useCallback((requestId: string) => {
    router.push(`./requests/${requestId}/sparepart`);
  }, [router]);

  const handleMachineRequestClick = useCallback((requestId: string) => {
    router.push(`./requests/${requestId}/machine?tab=machines`);
  }, [router]);

  const handleViewAllRequests = useCallback(() => {
    router.push('./requests?tab=spare-parts&status=Pending');
  }, [router]);

  const handleViewAllMachineRequests = useCallback(() => {
    router.push('./requests?tab=machines&status=Pending');
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

  const formatAreaPath = (req: any): string => {
    try {
      let areaInfo = '';
      
      // First priority: Check if there's a specific area field structure
      if (req.areaName || req.zoneName || req.positionIndex) {
        const parts = [];
        if (req.areaName) parts.push(req.areaName);
        if (req.zoneName) parts.push(req.zoneName);
        if (req.positionIndex) parts.push(req.positionIndex.toString());
        
        if (parts.length > 0) {
          areaInfo = parts.join(' - ');
        }
      }
      
      if (!areaInfo && req.confirmationCode) {
        const title = req.confirmationCode;
        
        const areaMatch = title.match(/Khu\s+[^-]+(?:\s*-\s*[^-]+)*(?:\s*-\s*\d+)?/i);
        if (areaMatch) {
          areaInfo = areaMatch[0].trim();
        }
      }
      
      if (!areaInfo && req.notes) {
        const desc = req.notes;
        
        const areaMatch = desc.match(/Khu\s+[^-]+(?:\s*-\s*[^-]+)*(?:\s*-\s*\d+)?/i);
        if (areaMatch) {
          areaInfo = areaMatch[0].trim();
        }
      }
      
      if (!areaInfo) {
        const fullText = `${req.confirmationCode || ''} ${req.notes || ''}`;
        
        const slashPattern = fullText.match(/[A-Za-z\u00C0-\u017F\s]+\/[A-Za-z\u00C0-\u017F\s]+(?:\/\d+)?/);
        if (slashPattern) {
          areaInfo = slashPattern[0].replace(/\//g, ' - ');
        }
      }
      
      if (!areaInfo) {
        areaInfo = 'Vị trí không xác định';
      }
      
      return areaInfo;
    } catch (error) {
      console.error('Error formatting area path:', error);
      return 'Vị trí không xác định';
    }
  };

  const processRequests = useCallback((rawRequests: any[]) => {
    // Filter for spare part requests with Pending status
    const allUnconfirmedRequests = rawRequests.filter((req: any) => 
      req.status === 'Pending' && req.actionType?.toLowerCase() === 'sparepartrequest'
    );
    
    const totalUnconfirmed = allUnconfirmedRequests.length;
    const unconfirmedToDisplay = allUnconfirmedRequests.slice(0, 3);

    return {
      unconfirmedRequests: unconfirmedToDisplay.map((req: any) => ({
        id: req.id,
        requestCode: req.confirmationCode,
        assigneeName: req.assigneeName || 'Chưa có người thực hiện',
        requestDate: new Date(req.startDate).toLocaleDateString('vi-VN'),
        status: req.status,
        itemCount: 1 // Since each machine action confirmation represents one action
      })),
      totalUnconfirmedCount: totalUnconfirmed
    };
  }, []);

  const processMachineRequests = useCallback((rawRequests: any[]) => {
    console.log('Processing machine requests:', rawRequests);
    
    // Filter for machine requests (non-spare part) with Pending status
    const allPendingMachineRequests = rawRequests.filter((req: any) => {
      const isPending = req.status === 'Pending';
      const isMachineRequest = req.actionType?.toLowerCase() !== 'sparepartrequest';
      
      console.log(`Request ${req.id}: status=${req.status}, isPending=${isPending}, isMachineRequest=${isMachineRequest}, actionType=${req.actionType}`);
      
      return isPending && isMachineRequest;
    });
    
    console.log(`Found ${allPendingMachineRequests.length} pending machine requests out of ${rawRequests.length} total`);
    
    const totalPending = allPendingMachineRequests.length;
    const pendingToDisplay = allPendingMachineRequests.slice(0, 3);

    return {
      unconfirmedMachineRequests: pendingToDisplay.map((req: any) => ({
        id: req.id,
        title: `Yêu cầu ${req.actionType || 'hành động'}`, 
        description: req.notes || '', 
        requestDate: new Date(req.startDate).toLocaleDateString('vi-VN'),
        status: req.status,
        areaPath: formatAreaPath(req) 
      })),
      totalUnconfirmedMachineCount: totalPending
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
      
      // Use the new unified API instead of separate API calls
      const [machineActionResult, inventoryResult] = await Promise.allSettled([
        apiClient.machineActionConfirmation.getAll(1, 1000, false), // Get large page, newest first
        apiClient.sparePart.getInventory(1, 1000)
      ]);

      // Process machine action confirmation data
      let processedRequests: { unconfirmedRequests: UnconfirmedRequest[]; totalUnconfirmedCount: number } = { unconfirmedRequests: [], totalUnconfirmedCount: 0 };
      let processedMachineRequests: { unconfirmedMachineRequests: UnconfirmedMachineRequest[]; totalUnconfirmedMachineCount: number } = { unconfirmedMachineRequests: [], totalUnconfirmedMachineCount: 0 };

      if (machineActionResult.status === 'fulfilled') {
        const machineActionResponse = machineActionResult.value;
        let machineActionData: any[] = [];
        
        if (machineActionResponse?.data?.data && Array.isArray(machineActionResponse.data.data)) {
          machineActionData = machineActionResponse.data.data;
        } else if (Array.isArray(machineActionResponse?.data)) {
          machineActionData = machineActionResponse.data;
        } else if (Array.isArray(machineActionResponse)) {
          machineActionData = machineActionResponse;
        }

        console.log('Machine action confirmation data:', machineActionData);
        
        // Process both spare part and machine requests from the same data source
        processedRequests = processRequests(machineActionData);
        processedMachineRequests = processMachineRequests(machineActionData);
      } else {
        console.error('Failed to fetch machine action confirmations:', machineActionResult.reason);
      }

      let processedInventory: { lowStockItems: LowStockItem[]; totalLowStockCount: number } = { lowStockItems: [], totalLowStockCount: 0 };
      if (inventoryResult.status === 'fulfilled') {
        const inventoryResponse = inventoryResult.value as any;
        let inventory: any[] = [];
        
        if (Array.isArray(inventoryResponse)) {
          inventory = inventoryResponse;
        } else if (inventoryResponse?.data && Array.isArray(inventoryResponse.data)) {
          inventory = inventoryResponse.data;
        }

        processedInventory = processInventory(inventory);
      } else {
        console.error('Failed to fetch inventory:', inventoryResult.reason);
      }

      setState(prev => ({
        ...prev,
        ...processedRequests,
        ...processedMachineRequests,
        ...processedInventory,
        isLoading: false
      }));

    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Không thể tải thông báo'
      }));
    }
  }, [processRequests, processMachineRequests, processInventory]);

  // Use useEffect with empty dependency array to prevent unnecessary re-fetches
  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Memoized render components to prevent unnecessary re-renders
  const LoadingComponent = useMemo(() => (
    <div className="space-y-6">
      <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
      <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
      <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-32"></div>
    </div>
  ), []);

  // Only render if there are unconfirmed requests
  const UnconfirmedRequestsSection = useMemo(() => {
    if (state.totalUnconfirmedCount === 0) return null;
    
    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Yêu cầu linh kiện chưa xác nhận</h2>
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {state.totalUnconfirmedCount}
            </span>
          </div>
          <button
            onClick={handleViewAllRequests}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>

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
                    <span className="text-sm text-gray-500">cho {req.assigneeName}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {req.itemCount} mục • {req.requestDate}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(req.status)}`}>
                  {getStatusLabel(req.status)}
                </span>
              </div>
            </li>
          ))}
          {state.totalUnconfirmedCount > state.unconfirmedRequests.length && (
            <li className="pt-2 text-center">
              <span className="text-sm text-gray-500">
                và {state.totalUnconfirmedCount - state.unconfirmedRequests.length} yêu cầu khác...
              </span>
            </li>
          )}
        </ul>
      </div>
    );
  }, [state.unconfirmedRequests, state.totalUnconfirmedCount, handleRequestClick, handleViewAllRequests]);

  // Only render if there are pending machine requests
  const UnconfirmedMachineRequestsSection = useMemo(() => {
    if (state.totalUnconfirmedMachineCount === 0) return null;
    
    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-500" />
            <h2 className="font-semibold text-lg">Yêu cầu thiết bị chưa xác nhận</h2>
            <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {state.totalUnconfirmedMachineCount}
            </span>
          </div>
          <button
            onClick={handleViewAllMachineRequests}
            className="text-purple-600 hover:text-purple-800 text-sm font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
          {state.unconfirmedMachineRequests.map((req) => (
            <li 
              key={req.id} 
              className="py-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer rounded transition-colors"
              onClick={() => handleMachineRequestClick(req.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-purple-600">{req.title}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                    {req.areaPath} • {req.requestDate}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${getStatusBadgeClass(req.status)}`}>
                  {getStatusLabel(req.status)}
                </span>
              </div>
            </li>
          ))}
          {state.totalUnconfirmedMachineCount > state.unconfirmedMachineRequests.length && (
            <li className="pt-2 text-center">
              <span className="text-sm text-gray-500">
                và {state.totalUnconfirmedMachineCount - state.unconfirmedMachineRequests.length} yêu cầu khác...
              </span>
            </li>
          )}
        </ul>
      </div>
    );
  }, [state.unconfirmedMachineRequests, state.totalUnconfirmedMachineCount, handleMachineRequestClick, handleViewAllMachineRequests]);

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

  // Only render if there are low stock items
  const LowStockSection = useMemo(() => {
    if (state.totalLowStockCount === 0) return null;
    
    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-lg">Cảnh báo tồn kho thấp</h2>
            <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
              {state.totalLowStockCount}
            </span>
          </div>
          <button
            onClick={handleViewInventory}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
          >
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </button>
        </div>

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
      </div>
    );
  }, [state.lowStockItems, state.totalLowStockCount, handleLowStockItemClick, handleViewInventory]);

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
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Check if we have any sections to render
  const hasNotifications = state.totalUnconfirmedCount > 0 || state.totalUnconfirmedMachineCount > 0 || state.totalLowStockCount > 0;

  if (!hasNotifications) {
    return (
      <div className="rounded-lg shadow-sm border p-6">
        <div className="text-center py-8">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Không có thông báo</h3>
          <p className="text-gray-500">Hiện tại không có yêu cầu nào cần xử lý.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {UnconfirmedRequestsSection}
      {UnconfirmedMachineRequestsSection}
      {LowStockSection}
    </div>
  );
}
