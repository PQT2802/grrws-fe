'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Settings } from 'lucide-react';
import SparePartRequestsTable from './components/sparepart/SparePartRequestsTable';
import MachineRequestsTable from './components/machine/MachineRequestsTable';
import { useAuth } from '@/components/providers/AuthProvider';

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isStockKeeper } = useAuth();
  
  // Get initial tab from URL params or default to 'spare-parts'
  const initialTab = searchParams.get('tab') || 'spare-parts';
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Check authorization
  useEffect(() => {
    if (user && !isStockKeeper) {
      toast.error("Bạn không có quyền truy cập trang này");
      router.push('/access-denied');
      return;
    }
  }, [router, user, isStockKeeper]);

  // Handle tab change and update URL
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL to preserve tab state
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    router.replace(`?${params.toString()}`);
  };

  if (user && !isStockKeeper) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Quản lý yêu cầu</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Quản lý và theo dõi tất cả yêu cầu linh kiện và thiết bị từ kỹ thuật viên
        </p>
      </div>
      
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="spare-parts" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Yêu cầu linh kiện
          </TabsTrigger>
          <TabsTrigger value="machines" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Yêu cầu thiết bị
          </TabsTrigger>
        </TabsList>
        
        {/* Spare Parts Tab */}
        <TabsContent value="spare-parts">
          <SparePartRequestsTable />
        </TabsContent>
        
        {/* Machines Tab */}
        <TabsContent value="machines">
          <MachineRequestsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}