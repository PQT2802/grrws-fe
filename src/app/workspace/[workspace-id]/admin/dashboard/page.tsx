"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useParams, useRouter } from "next/navigation";
import useWorkspaceStore, { WorkspaceStoreState } from "@/store/workspace";
import { toast } from "react-toastify";
import { USER_ROLES } from "@/types/auth.type";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import MachineStatusPieChart from "@/components/ChartCpn/MachineStatusPieChart";
import ErrorTrendLineChart from "@/components/ChartCpn/ErrorTrendLineChart";
import OperationStatsCpn from "@/components/ChartCpn/OperationStatsCpn";
import ActivitiesPercentageChart from "@/components/ChartCpn/ActivitiesPercentageChart";
import AdminQuickActions from "@/components/ChartCpn/AdminQuickActions";
import ActiveInstances from "@/components/ChartCpn/RequestChartCpn/ActiveInstances";
import RequestTrendChart from "@/components/ChartGroupCpn/RequestTrendChart";
import TopErrorDevicesChart from "@/components/ChartGroupCpn/TopErrorDevicesChart";
import TopMechanicsChart from "@/components/ChartGroupCpn/TopMechanicsChart";
import AdminQuickSummary from "@/components/ChartCpn/AdminQuickSummary";
import UserRolesChart from "@/components/ChartCpn/UserRolesChart";
import WorkshopDevicesChart from "@/components/ChartCpn/WorkshopDevicesChart";

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

          {/* Replace AnalysisCard section with AdminQuickSummary */}
          <div className="my-4 w-full">
            <AdminQuickSummary />
          </div>

          <div className="w-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <TopErrorDevicesChart />
            <TopMechanicsChart />
            <RequestTrendChart />
          </div>
          
          {/* Active Instances Table */}
          {/* <div className="w-full mb-4 mt-4">
            <ActiveInstances />
          </div> */}

          {/* Machine Status Chart - Half Width */}
          <div className="mt-3 w-full h-full flex items-start gap-3 flex-wrap lg:flex-nowrap">
            <div className="w-1/2">
              <ActivitiesPercentageChart />
            </div>

            <div className="w-full lg:w-1/2">
              <MachineStatusPieChart />
              <AdminQuickActions/>
            </div>
          </div>

          {/* Operation Statistics with API data */}
          <div className="mt-3 w-full">
            {/* <OperationStatsCpn /> */}
            <WorkshopDevicesChart />
          </div>

          {/* Error Trend Chart */}
          <div className="my-4 w-full">
            {/* <ErrorTrendLineChart /> */}
            <UserRolesChart />
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;