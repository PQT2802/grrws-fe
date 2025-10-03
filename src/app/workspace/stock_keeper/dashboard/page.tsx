"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NotificationArea from "./components/NotificationArea";
import QuickSummary from "./components/QuickSummary";
import StockOverviewChart from "./components/StockOverviewChart";
import QuickActions from "./components/QuickActions";

export default function DashboardPage() {
  const { user, isStockKeeper, loading } = useAuth(); // Use the correct property names
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isStockKeeper) {
      router.push("/unauthorized");
    }
  }, [loading, isStockKeeper, router]);

  if (loading) {
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
      <div className="rounded-lg p-6 border">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Dashboard thủ kho
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Đây là tổng quan về kho và các nhiệm vụ đang chờ xử lý của bạn.
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
          {/* <QuickActions /> */}
          <StockOverviewChart />
        </div>
      </div>
    </div>
  );
}
