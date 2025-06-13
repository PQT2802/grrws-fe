'use client';

import { useEffect, useState } from 'react';
import { Bell, ArrowRight, Package, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { sparePartService } from '@/app/service/sparePart.service';

interface PendingRequest {
  id: string;
  requestCode: string;
  assigneeName: string;
  requestDate: string;
  status: string;
  itemCount: number;
}

export default function NotificationArea() {
  const router = useRouter();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const fetchNotificationData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch pending requests and low stock items
      const [requestsResponse, inventoryResponse] = await Promise.all([
        sparePartService.getRequests(),
        sparePartService.getInventory(1, 1000)
      ]);

      // Filter pending requests
      const pending = requestsResponse?.data?.filter((req: any) => 
        req.status === 'Pending' || req.status === 'Submitted'
      ).slice(0, 5) || []; // Show only first 5

      // Filter low stock items
      const inventory = inventoryResponse?.data?.data || [];
      const lowStock = inventory.filter((item: any) => 
        item.stockQuantity > 0 && item.stockQuantity <= 5
      ).slice(0, 3); // Show only first 3

      setPendingRequests(pending.map((req: any) => ({
        id: req.id,
        requestCode: req.requestCode,
        assigneeName: req.assigneeName,
        requestDate: new Date(req.requestDate).toLocaleDateString(),
        status: req.status,
        itemCount: req.sparePartUsages?.length || 0
      })));

      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestClick = (requestId: string) => {
    router.push(`./requests/${requestId}`);
  };

  const handleViewAllRequests = () => {
    router.push('./requests?status=Pending');
  };

  const handleViewInventory = () => {
    router.push('./inventory?filter=lowstock');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-48"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-slate-700 rounded-lg h-32"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Pending Requests</h2>
            {pendingRequests.length > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {pendingRequests.length}
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

        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No pending requests</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {pendingRequests.map((req) => (
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
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                    {req.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Low Stock Alert */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-lg">Low Stock Alert</h2>
            {lowStockItems.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {lowStockItems.length}
              </span>
            )}
          </div>
          <button
            onClick={handleViewInventory}
            className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {lowStockItems.length === 0 ? (
          <p className="text-gray-500 text-center py-4">All items are well stocked</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {lowStockItems.map((item) => (
              <li key={item.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.sparepartName}</p>
                    <p className="text-sm text-gray-500">{item.category}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-orange-600 font-semibold">
                      {item.stockQuantity} {item.unit}
                    </span>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
