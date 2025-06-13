'use client';

import { useEffect, useState } from 'react';
import { BarChart3, PieChart } from 'lucide-react';
import { sparePartService } from '@/app/service/sparePart.service';

interface StockData {
  category: string;
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
}

export default function StockOverviewChart() {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [viewType, setViewType] = useState<'category' | 'status'>('category');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    try {
      setIsLoading(true);
      const response = await sparePartService.getInventory(1, 1000);
      const inventory = response?.data?.data || [];

      // Group by category
      const categoryMap = new Map<string, StockData>();

      inventory.forEach((item: any) => {
        const category = item.category || 'Uncategorized';
        
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
        } else if (item.stockQuantity <= 5) {
          data.lowStockItems += 1;
        }
      });

      setStockData(Array.from(categoryMap.values()));
    } catch (error) {
      console.error('Error fetching stock data:', error);
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

  const maxTotal = Math.max(...stockData.map(d => d.totalItems));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-lg">Stock Overview by Category</h2>
        </div>
      </div>

      <div className="space-y-4">
        {stockData.map((data) => (
          <div key={data.category} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{data.category}</span>
              <span className="text-sm text-gray-500">{data.totalItems} items</span>
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
                      width: `${((data.totalItems - data.lowStockItems - data.outOfStockItems) / maxTotal) * 100}%` 
                    }}
                  ></div>
                  {/* Low stock */}
                  <div 
                    className="absolute top-0 h-full bg-yellow-500"
                    style={{ 
                      left: `${((data.totalItems - data.lowStockItems - data.outOfStockItems) / maxTotal) * 100}%`,
                      width: `${(data.lowStockItems / maxTotal) * 100}%` 
                    }}
                  ></div>
                  {/* Out of stock */}
                  <div 
                    className="absolute top-0 h-full bg-red-500"
                    style={{ 
                      left: `${((data.totalItems - data.outOfStockItems) / maxTotal) * 100}%`,
                      width: `${(data.outOfStockItems / maxTotal) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Good: {data.totalItems - data.lowStockItems - data.outOfStockItems}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                Low: {data.lowStockItems}
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Out: {data.outOfStockItems}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}