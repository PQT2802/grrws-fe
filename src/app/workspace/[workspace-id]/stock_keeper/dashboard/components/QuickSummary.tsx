'use client';

import { useEffect, useState } from 'react';
import { Package, AlertTriangle, Clock, AlertCircle } from 'lucide-react'; // Changed TrendingUp to AlertCircle
import { sparePartService } from '@/app/service/sparePart.service';

interface SummaryData {
  totalRequests: number;
  outOfStockItems: number;
  unconfirmedRequests: number; // Changed from pendingDeliveries
  lowStockItems: number;
}

export default function QuickSummary() {
  const [summaryData, setSummaryData] = useState<SummaryData>({
    totalRequests: 0,
    outOfStockItems: 0,
    unconfirmedRequests: 0, // Changed from pendingDeliveries
    lowStockItems: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSummaryData();
  }, []);

  const fetchSummaryData = async () => {
    try {
      setIsLoading(true);
      
      console.log("🔍 Fetching dashboard data...");
      
      const [requestsResponse, inventoryResponse] = await Promise.all([
        sparePartService.getSparePartRequests(),
        sparePartService.getSparePartInventory(1, 1000)
      ]);

      console.log("🔍 Raw requests response:", requestsResponse);
      console.log("🔍 Raw inventory response:", inventoryResponse);

      // Calculate summary metrics
      const today = new Date().toDateString();
      
      // Try different possible data structures
      let requests: any[] = [];
      if (requestsResponse?.data?.data) {
        requests = requestsResponse.data.data;
      } else if (requestsResponse?.data) {
        requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
      } else if (Array.isArray(requestsResponse)) {
        requests = requestsResponse;
      }
      
      console.log("🔍 Processed requests:", requests);
      console.log("🔍 Request count:", requests.length);
      
      if (requests.length > 0) {
        console.log("🔍 Sample request:", requests[0]);
        console.log("🔍 Available statuses:", 
          [...new Set(requests.map((req: any) => req.status))]
        );
      }
      
      // Filter today's requests
      const todayRequests = requests.filter((req: any) => 
        new Date(req.requestDate).toDateString() === today
      );

      // Filter unconfirmed requests
      const unconfirmedRequests = requests.filter((req: any) => 
        req.status === 'Unconfirmed'
      );

      console.log('🔍 Debug Summary:');
      console.log('  - Total requests:', requests.length);
      console.log('  - Today requests:', todayRequests.length);
      console.log('  - Unconfirmed requests:', unconfirmedRequests.length);

      // Handle inventory data
      let inventory: any[] = [];
      if (inventoryResponse?.data?.data) {
        inventory = inventoryResponse.data.data;
      } else if (inventoryResponse?.data) {
        inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];
      } else if (Array.isArray(inventoryResponse)) {
        inventory = inventoryResponse;
      }

      const outOfStock = inventory.filter((item: any) => item.stockQuantity === 0);
      const lowStock = inventory.filter((item: any) => 
        item.stockQuantity > 0 && item.stockQuantity < 10
      );

      console.log('🔍 Inventory Summary:');
      console.log('  - Total inventory items:', inventory.length);
      console.log('  - Out of stock:', outOfStock.length);
      console.log('  - Low stock (< 10):', lowStock.length);

      setSummaryData({
        totalRequests: todayRequests.length,
        outOfStockItems: outOfStock.length,
        unconfirmedRequests: unconfirmedRequests.length,
        lowStockItems: lowStock.length
      });
    } catch (error) {
      console.error('❌ Error fetching summary data:', error);
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
      label: "Unconfirmed Requests", // Updated label
      value: summaryData.unconfirmedRequests, // Updated value
      icon: Clock,
      color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      iconColor: "text-yellow-500",
    },
    {
      label: "Low Stock Items",
      value: summaryData.lowStockItems,
      icon: AlertCircle, // Changed from TrendingUp to AlertCircle (exclamation mark)
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
