'use client';

import { useEffect, useState } from 'react';
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

export default function NotificationArea() {
  const router = useRouter();
  const [unconfirmedRequests, setUnconfirmedRequests] = useState<UnconfirmedRequest[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  // Add new state variables for the total counts
  const [totalUnconfirmedCount, setTotalUnconfirmedCount] = useState(0);
  const [totalLowStockCount, setTotalLowStockCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotificationData();
  }, []);

  const fetchNotificationData = async () => {
    try {
      setIsLoading(true);
      
      const [requestsResponse, inventoryResponse] = await Promise.all([
        sparePartService.getSparePartRequests(), 
        sparePartService.getSparePartInventory(1, 1000) 
      ]);

      // Extract all requests from the response
      let requests: any[] = [];
      if (requestsResponse?.data?.data) {
        requests = requestsResponse.data.data;
      } else if (requestsResponse?.data) {
        requests = Array.isArray(requestsResponse.data) ? requestsResponse.data : [];
      } else if (Array.isArray(requestsResponse)) {
        requests = requestsResponse;
      }

      // First get ALL unconfirmed requests to count the total
      const allUnconfirmedRequests = requests.filter((req: any) => 
        req.status === 'Unconfirmed'
      );
      
      // Store the total count
      const totalUnconfirmed = allUnconfirmedRequests.length;
      setTotalUnconfirmedCount(totalUnconfirmed);
      
      // Then slice for display purposes
      const unconfirmedToDisplay = allUnconfirmedRequests.slice(0, 5);

      console.log('Debug - All requests:', requests.length);
      console.log('Debug - Total unconfirmed requests:', totalUnconfirmed);
      console.log('Debug - Displaying:', unconfirmedToDisplay.length);
      console.log('Debug - Request statuses:', 
        [...new Set(requests.map((req: any) => req.status))]
      );

      // Extract inventory data
      let inventory: any[] = [];
      if (inventoryResponse?.data?.data) {
        inventory = inventoryResponse.data.data;
      } else if (inventoryResponse?.data) {
        inventory = Array.isArray(inventoryResponse.data) ? inventoryResponse.data : [];
      } else if (Array.isArray(inventoryResponse)) {
        inventory = inventoryResponse;
      }
      
      // First get ALL low stock items to count the total
      const allLowStockItems = inventory.filter((item: any) => 
        item.stockQuantity > 0 && item.stockQuantity < 10 
      );
      
      // Store the total count
      const totalLowStock = allLowStockItems.length;
      setTotalLowStockCount(totalLowStock);
      
      // Then slice for display purposes
      const lowStockToDisplay = allLowStockItems.slice(0, 3);

      console.log('Debug - Total low stock items:', totalLowStock);
      console.log('Debug - Displaying:', lowStockToDisplay.length);

      // Update the state with the display items
      setUnconfirmedRequests(unconfirmedToDisplay.map((req: any) => ({
        id: req.id,
        requestCode: req.requestCode,
        assigneeName: req.assigneeName,
        requestDate: new Date(req.requestDate).toLocaleDateString(),
        status: req.status,
        itemCount: req.sparePartUsages?.length || 0
      })));

      setLowStockItems(lowStockToDisplay);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add the missing handler functions
  const handleRequestClick = (requestId: string) => {
    router.push(`./requests/${requestId}`);
  };

  const handleViewAllRequests = () => {
    router.push('./requests?status=Unconfirmed');
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
      {/* Unconfirmed Requests - Updated badge to show total count */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-500" />
            <h2 className="font-semibold text-lg">Unconfirmed Requests</h2>
            {totalUnconfirmedCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {totalUnconfirmedCount}
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

        {unconfirmedRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No unconfirmed requests</p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {unconfirmedRequests.map((req) => (
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
            {totalUnconfirmedCount > unconfirmedRequests.length && (
              <li className="py-2 text-center">
                <span className="text-sm text-white-200">
                  and {totalUnconfirmedCount - unconfirmedRequests.length} more...
                </span>
              </li>
            )}
          </ul>
        )}
      </div>

      {/* Low Stock Alert - Updated badge to show total count */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-lg">Low Stock Alert</h2>
            {totalLowStockCount > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                {totalLowStockCount}
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
            {totalLowStockCount > lowStockItems.length && (
              <li className="py-2 text-center">
                <span className="text-sm text-white-200">
                  and {totalLowStockCount - lowStockItems.length} more...
                </span>
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
