"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import useWorkspaceStore, { WorkspaceStoreState } from "@/store/workspace";
import { toast } from "react-toastify";
import { USER_ROLES } from "@/types/auth.type";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import ActivitiesPercentageChart from "@/components/ChartCpn/ActivitiesPercentageChart";
import AdminQuickActions from "@/components/ChartCpn/AdminQuickActions";
import RequestTrendChart from "@/components/ChartGroupCpn/RequestTrendChart";
import TopErrorDevicesChart from "@/components/ChartGroupCpn/TopErrorDevicesChart";
import TopMechanicsChart from "@/components/ChartGroupCpn/TopMechanicsChart";
import AdminQuickSummary from "@/components/ChartCpn/AdminQuickSummary";
import UserRolesChart from "@/components/ChartCpn/UserRolesChart";
import DeviceStatusPieChart from "@/components/ChartCpn/DeviceStatusPieChart";
import DeviceWarrantyChart from "@/components/ChartCpn/DeviceWarrantyChart";

const AdminDashboardPage = () => {
  const { user, canAccessWorkspace } = useAuth();
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.["workspace-id"] as string;

  const { workspace, loading }: WorkspaceStoreState = useWorkspaceStore();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      if (user.role !== USER_ROLES.ADMIN) {
        console.log("🚫 Non-admin access attempted");
        router.push('/access-denied');
        toast.error("Admin access required");
        return;
      }
    }
  }, [user, loading, router]);

  if (!canAccessWorkspace || user?.role !== 5) {
    return null;
  }

  return (
    <div>
      {loading ? (
        <SkeletonCard />
      ) : (
        <>
          <PageTitle
            title="Admin Dashboard"
            description="Monitor and manage your workspace overview as Admin"
          />

          {/* Admin Quick Summary */}
          <div className="my-4 w-full">
            <AdminQuickSummary />
          </div>

          {/* Top Charts Row - Three Charts */}
          <div className="w-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <TopErrorDevicesChart />
            <TopMechanicsChart />
            <RequestTrendChart />
          </div>

          {/* Device Charts Row - Two Separate Charts */}
          <div className="mt-3 w-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <div className="w-full lg:w-1/2">
              <DeviceStatusPieChart />
            </div>
            <div className="w-full lg:w-1/2">
              <UserRolesChart />
            </div>
          </div>
          
          {/* Activities and Machine Status Row */}
          <div className="mt-3 w-full h-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <div className="w-full lg:w-1/2">
              <ActivitiesPercentageChart />
            </div>
            <div className="w-full lg:w-1/2">
              <DeviceWarrantyChart />
              <div className="mt-3">
                <AdminQuickActions />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;