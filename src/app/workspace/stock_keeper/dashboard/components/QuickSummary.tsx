'use client';

import { useEffect, useState } from 'react';
import { Package, Settings, Archive, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useRouter, useParams } from 'next/navigation';

interface SummaryData {
  totalSparePartRequests: number;
  totalMachineRequests: number;
  totalSparePartsInventory: number;
  lowStockItems: number;
}

export default function QuickSummary() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.["workspace-id"];

  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalSparePartRequests: 0,
    totalMachineRequests: 0,
    totalSparePartsInventory: 0,
    lowStockItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      
      console.log("🔍 Fetching stock keeper dashboard summary data...");
      
      // Fetch all data concurrently using the new unified API
      const [machineActionResponse, inventoryResponse] = await Promise.all([
        apiClient.machineActionConfirmation.getAll(1, 1000, false), // Get large page to count all, newest first
        apiClient.sparePart.getInventory(1, 1000) // Get large page to count all
      ]);

      console.log("🔍 Raw responses:", {
        machineActionResponse,
        inventory: inventoryResponse
      });

      // Process machine action confirmation data
      let machineActionData: any[] = [];
      if (machineActionResponse?.data?.data && Array.isArray(machineActionResponse.data.data)) {
        machineActionData = machineActionResponse.data.data;
      } else if (Array.isArray(machineActionResponse?.data)) {
        machineActionData = machineActionResponse.data;
      } else if (Array.isArray(machineActionResponse)) {
        machineActionData = machineActionResponse;
      }

      // Separate spare part requests and machine requests
      const sparePartRequests = machineActionData.filter(req => 
        req.actionType?.toLowerCase() === 'sparepartrequest'
      );

      const machineRequests = machineActionData.filter(req => 
        req.actionType?.toLowerCase() !== 'sparepartrequest'
      );

      // Process inventory
      let inventory: any[] = [];
      if (Array.isArray(inventoryResponse)) {
        inventory = inventoryResponse;
      } else if ((inventoryResponse as any)?.data && Array.isArray((inventoryResponse as any).data)) {
        inventory = (inventoryResponse as any).data;
      }

      // Calculate low stock items (stock quantity < 10)
      const lowStock = inventory.filter((item: any) => 
        item.stockQuantity > 0 && item.stockQuantity < 10
      );

      console.log('🔍 Processed data:', {
        sparePartRequests: sparePartRequests.length,
        machineRequests: machineRequests.length,
        inventory: inventory.length,
        lowStock: lowStock.length
      });

      setSummaryData({
        totalSparePartRequests: sparePartRequests.length,
        totalMachineRequests: machineRequests.length,
        totalSparePartsInventory: inventory.length,
        lowStockItems: lowStock.length
      });

      console.log('✅ Stock keeper summary data updated:', {
        totalSparePartRequests: sparePartRequests.length,
        totalMachineRequests: machineRequests.length,
        totalSparePartsInventory: inventory.length,
        lowStockItems: lowStock.length
      });
    } catch (error) {
      console.error('❌ Error fetching stock keeper summary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summaryCards = [
    {
      label: "Yêu cầu linh kiện",
      value: summaryData.totalSparePartRequests,
      icon: Package,
      color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
      action: () => router.push(`/workspace/${workspaceId}/stock_keeper/requests?tab=spare-parts`),
      clickable: true
    },
    {
      label: "Yêu cầu thiết bị",
      value: summaryData.totalMachineRequests,
      icon: Settings,
      color: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
      action: () => router.push(`/workspace/${workspaceId}/stock_keeper/requests?tab=machines`),
      clickable: true
    },
    {
      label: "Linh kiện hiện có",
      value: summaryData.totalSparePartsInventory,
      icon: Archive,
      color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800",
      action: () => router.push(`/workspace/${workspaceId}/stock_keeper/inventory`),
      clickable: true
    },
    {
      label: "Linh kiện tồn kho thấp",
      value: summaryData.lowStockItems,
      icon: AlertTriangle,
      color: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
      action: () => router.push(`/workspace/${workspaceId}/stock_keeper/inventory?filter=lowstock`),
      clickable: true
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-24"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {summaryCards.map((item) => {
        const IconComponent = item.icon;
        
        if (item.clickable && item.action) {
          return (
            <button
              key={item.label}
              onClick={item.action}
              className={`p-4 rounded-lg border transition-all cursor-pointer text-left w-full block appearance-none bg-transparent outline-none focus:outline-none hover:shadow-md active:scale-95 ${item.color}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-75">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                </div>
                <IconComponent className="w-8 h-8" />
              </div>
            </button>
          );
        }

        return (
          <div
            key={item.label}
            className={`p-4 rounded-lg border transition-colors ${item.color.replace(/hover:bg-\w+-\d+/g, '').trim()}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
              <IconComponent className="w-8 h-8 opacity-75" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
