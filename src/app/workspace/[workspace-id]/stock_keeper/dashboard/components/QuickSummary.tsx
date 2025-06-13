'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import { sparePartService } from '@/app/service/sparePart.service';

interface SummaryData {
  totalRequests: number;
  outOfStockItems: number;
  pendingDeliveries: number;
  lowStockItems: number;
}

export default function QuickSummary() {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalRequests: 0,
    outOfStockItems: 0,
    pendingDeliveries: 0,
    lowStockItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch requests and inventory data
      const [requestsResponse, inventoryResponse] = await Promise.all([
        sparePartService.getRequests(),
        sparePartService.getInventory(1, 1000) // Get all items for analysis
      ]);

      // Calculate summary metrics
      const today = new Date().toDateString();
      const todayRequests = requestsResponse?.data?.filter((req: any) => 
        new Date(req.requestDate).toDateString() === today
      ) || [];

      const pendingRequests = requestsResponse?.data?.filter((req: any) => 
        req.status === 'Pending' || req.status === 'Submitted'
      ) || [];

      const inventory = inventoryResponse?.data?.data || [];
      const outOfStock = inventory.filter((item: any) => item.stockQuantity === 0);
      const lowStock = inventory.filter((item: any) => 
        item.stockQuantity > 0 && item.stockQuantity <= 5 // Assuming 5 as low stock threshold
      );

      setSummaryData({
        totalRequests: todayRequests.length,
        outOfStockItems: outOfStock.length,
        pendingDeliveries: pendingRequests.length,
        lowStockItems: lowStock.length
      });
    } catch (error) {
      console.error('Error fetching summary data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const summaryCards = [
    {
      label: "Requests Today",
      value: summaryData.totalRequests,
      icon: Package,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-500",
    },
    {
      label: "Out of Stock",
      value: summaryData.outOfStockItems,
      icon: AlertTriangle,
      color: "bg-red-50 text-red-700 border-red-200",
      iconColor: "text-red-500",
    },
    {
      label: "Pending Requests",
      value: summaryData.pendingDeliveries,
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      iconColor: "text-yellow-500",
    },
    {
      label: "Low Stock Items",
      value: summaryData.lowStockItems,
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-700 border-orange-200",
      iconColor: "text-orange-500",
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
        return (
          <div
            key={item.label}
            className={`rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow ${item.color} dark:bg-opacity-80`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-75">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
              <IconComponent className={`w-8 h-8 ${item.iconColor}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
