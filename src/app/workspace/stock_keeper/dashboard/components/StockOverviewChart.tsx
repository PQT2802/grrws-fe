'use client';

import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { SPAREPART_INVENTORY_ITEM } from '@/types/sparePart.type';

interface StockData {
  category: string;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

// Updated category mapping from FilterBar
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

// Function to get category label by value
const getCategoryLabel = (value: string): string => {
  const category = CATEGORY_OPTIONS.find(cat => cat.value === value);
  return category ? category.label : value;
};

export default function StockOverviewChart() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setIsLoading(true);

      const response = await apiClient.sparePart.getInventory(1, 1000);
      let inventory: SPAREPART_INVENTORY_ITEM[] = [];
      const apiResponse = response as any;

      if (apiResponse?.data?.data && Array.isArray(apiResponse.data.data)) {
        inventory = apiResponse.data.data;
      } else if (apiResponse?.data && Array.isArray(apiResponse.data)) {
        inventory = apiResponse.data;
      } else if (Array.isArray(apiResponse)) {
        inventory = apiResponse;
      }

      // Group by category using updated category structure
      const categoryMap = new Map<string, StockData>();

      inventory.forEach((item: SPAREPART_INVENTORY_ITEM) => {
        // Use "Others" as default category instead of "Chung"
        const category = item.category || 'Others';

        if (!categoryMap.has(category)) {
          categoryMap.set(category, {
            category,
            totalItems: 0,
            lowStockItems: 0,
            outOfStockItems: 0
          });
        }

        const data = categoryMap.get(category)!;
        data.totalItems += 1;

        if (item.stockQuantity === 0) {
          data.outOfStockItems += 1;
        } else if (item.stockQuantity < 10) {
          data.lowStockItems += 1;
        }
      });

      // Filter out categories with no items and sort by total items
      const filteredData = Array.from(categoryMap.values())
        .filter(data => data.totalItems > 0) // Only show categories with items
        .sort((a, b) => b.totalItems - a.totalItems);

      setStockData(filteredData);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tồn kho:', error);
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-slate-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no data
  if (stockData.length === 0) {
    return null;
  }

  const maxTotal = Math.max(...stockData.map(d => d.totalItems));

  return (
    <div className="rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-lg">Tổng quan tồn kho theo danh mục</h2>
        </div>
      </div>

      <div className="space-y-4">
        {stockData.map((data) => {
          const goodStock = data.totalItems - data.lowStockItems - data.outOfStockItems;
          
          return (
            <div key={data.category} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {getCategoryLabel(data.category)}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data.totalItems} sản phẩm
                </span>
              </div>

              <div className="relative">
                {/* Background bar */}
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                  {/* Stock level bar */}
                  <div className="relative h-3 rounded-full overflow-hidden">
                    {/* Good stock */}
                    <div
                      className="absolute left-0 top-0 h-full bg-green-500"
                      style={{
                        width: `${(goodStock / maxTotal) * 100}%`
                      }}
                    ></div>
                    {/* Low stock */}
                    <div
                      className="absolute top-0 h-full bg-yellow-500"
                      style={{
                        left: `${(goodStock / maxTotal) * 100}%`,
                        width: `${(data.lowStockItems / maxTotal) * 100}%`
                      }}
                    ></div>
                    {/* Out of stock */}
                    <div
                      className="absolute top-0 h-full bg-red-500"
                      style={{
                        left: `${((goodStock + data.lowStockItems) / maxTotal) * 100}%`,
                        width: `${(data.outOfStockItems / maxTotal) * 100}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Đầy đủ: {goodStock}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Sắp hết: {data.lowStockItems}
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Hết hàng: {data.outOfStockItems}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}