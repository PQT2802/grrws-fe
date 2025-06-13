'use client';

import { AuthContext } from '@/components/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useContext, useEffect } from 'react';
import NotificationArea from "./components/NotificationArea";
import QuickSummary from "./components/QuickSummary";
import StockOverviewChart from "./components/StockOverviewChart";
import QuickActions from "./components/QuickActions";

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("error using useAuth");
  }
  return context;
};

export default function DashboardPage() {
  const { user, isStockKeeper, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isStockKeeper) {
      router.push('/unauthorized');
    }
  }, [isLoading, isStockKeeper, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isStockKeeper) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-lg p-6 border">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.fullName || 'Stock Keeper'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Here's an overview of your inventory and pending tasks.
        </p>
      </div>

      {/* Quick Summary Cards */}
      <QuickSummary />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Notifications */}
        <div className="lg:col-span-2">
          <NotificationArea />
        </div>

        {/* Right Column - Quick Actions & Chart */}
        <div className="space-y-6">
          <QuickActions />
          <StockOverviewChart />
        </div>
      </div>
    </div>
  );
}
