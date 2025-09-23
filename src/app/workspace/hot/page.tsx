"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import PageTitle from "@/components/PageTitle/PageTitle";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { DashboardFilterProvider, useDashboardFilters } from "@/components/HOTChartCpn/DashboardFilterContext";
import GlobalFilters from "@/components/HOTChartCpn/GlobalFilters";
import HOTNotificationArea from "@/components/HOTChartCpn/HOTNotificationArea";
import { HOTDashboardFilteredStatsDTO } from "@/types/dashboard.type";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Settings, 
  TrendingUp, 
  Users, 
  Wrench,
  BarChart3,
  PieChart,
  Calendar,
  MapPin
} from "lucide-react";

// Thẻ thống kê
interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color: "blue" | "green" | "orange" | "red" | "purple";
  description?: string;
}

const StatsCard = ({ title, value, icon, trend, color, description }: StatsCardProps) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600", 
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    red: "bg-red-50 border-red-200 text-red-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600"
  };

  const iconBgClasses = {
    blue: "bg-blue-100",
    green: "bg-green-100",
    orange: "bg-orange-100", 
    red: "bg-red-100",
    purple: "bg-purple-100"
  };

  return (
    <div className={`p-6 rounded-xl border-2 ${colorClasses[color]} hover:shadow-lg transition-all duration-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 flex items-center">
          <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500 ml-2">so với kỳ trước</span>
        </div>
      )}
    </div>
  );
};

// Thanh tiến độ
const ProgressBar = ({ 
  label, 
  value, 
  total, 
  color = "blue" 
}: { 
  label: string; 
  value: number; 
  total: number; 
  color?: string; 
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">{value}/{total}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full bg-${color}-500 transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}%</div>
    </div>
  );
};

// Container biểu đồ
const ChartContainer = ({ 
  title, 
  children, 
  className = "",
  actions 
}: { 
  title: string; 
  children: React.ReactNode; 
  className?: string;
  actions?: React.ReactNode;
}) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {actions}
    </div>
    {children}
  </div>
);

// Danh sách yêu cầu
const RequestsList = ({ requests }: { requests: HOTDashboardFilteredStatsDTO['requests'] }) => (
  <div className="space-y-3">
    {requests.slice(0, 5).map((request, index) => (
      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm">{request.title}</h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              request.isCompleted 
                ? 'bg-green-100 text-green-800' 
                : 'bg-orange-100 text-orange-800'
            }`}>
              {request.status}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {request.location}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(request.createdDate).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">{request.requestedBy}</p>
          <p className="text-xs font-medium text-gray-700">{request.deviceName}</p>
        </div>
      </div>
    ))}
    {requests.length > 5 && (
      <div className="text-center py-2">
        <span className="text-sm text-gray-500">+{requests.length - 5} yêu cầu khác</span>
      </div>
    )}
  </div>
);

// Component nội dung sử dụng filter context
function DashboardContent() {
  const { user, canAccessWorkspace, loading: authLoading } = useAuth();
  const router = useRouter();
  const { getApiParams } = useDashboardFilters();

  const [dashboardStats, setDashboardStats] = useState<HOTDashboardFilteredStatsDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Chuyển hướng nếu user không có quyền truy cập
  useEffect(() => {
    if (!authLoading && !canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [authLoading, canAccessWorkspace, router]);

  // Lấy thống kê dashboard với bộ lọc
  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const filterParams = getApiParams();
        console.log("📊 Đang lấy thống kê dashboard với bộ lọc:", filterParams);
        
        // ✅ Use single areaId from the filter context
        const areaId = filterParams.areaId || '';
        
        // Set default dates if not provided: first day of current month to today
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
        const defaultEndDate = now; // Current date
        
        const startDate = filterParams.startDate || defaultStartDate.toISOString();
        const endDate = filterParams.endDate || defaultEndDate.toISOString();
        
        // ✅ Always call the filtered stats API with proper parameters
        const response = await apiClient.dashboard.getFilterdStats(
          areaId,
          startDate,
          endDate
        );
        setDashboardStats(response);
        
      } catch (error) {
        console.error("Lỗi khi lấy thống kê dashboard:", error);
        setError("Không thể tải dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && canAccessWorkspace) {
      fetchDashboardStats();
    }
  }, [authLoading, canAccessWorkspace, getApiParams]);

  // Tính toán phần trăm và xu hướng
  const analyticsData = useMemo(() => {
    if (!dashboardStats) return null;

    const requestCompletionRate = dashboardStats.totalRequests > 0 
      ? (dashboardStats.completedRequests / dashboardStats.totalRequests) * 100 
      : 0;

    const taskCompletionRate = dashboardStats.totalTasks > 0 
      ? (dashboardStats.completedTasks / dashboardStats.totalTasks) * 100 
      : 0;

    const deviceUtilizationRate = dashboardStats.totalDevices > 0 
      ? (dashboardStats.inUseDevices / dashboardStats.totalDevices) * 100 
      : 0;

    return {
      requestCompletionRate,
      taskCompletionRate,
      deviceUtilizationRate,
      activeDeviceRate: dashboardStats.totalDevices > 0 
        ? (dashboardStats.activeDevices / dashboardStats.totalDevices) * 100 
        : 0
    };
  }, [dashboardStats]);

  // Hiển thị loading khi đang kiểm tra xác thực
  if (authLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <SkeletonCard />
          <p className="text-gray-600 mt-4">Đang tải dashboard...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo từ chối truy cập
  if (!canAccessWorkspace) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold mb-4 text-gray-900">Không có quyền truy cập</h1>
          <p className="text-gray-600 mb-6">
            Bạn không có quyền truy cập vào dashboard Trưởng phòng Kỹ thuật.
          </p>
          <button 
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-64 bg-gray-50 rounded-xl">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Lỗi tải Dashboard</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen">
      {/* Phần Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex-1">
            <PageTitle
              title="Dashboard Điều hành Kỹ thuật"
              description="Theo dõi và quản lý tất cả hoạt động kỹ thuật, yêu cầu và hiệu suất thiết bị theo thời gian thực"
            />
            {dashboardStats?.areaName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>Khu vực: {dashboardStats.areaName}</span>
                {dashboardStats.startDate && dashboardStats.endDate && (
                  <>
                    <span className="mx-2">•</span>
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(dashboardStats.startDate).toLocaleDateString('vi-VN')} - {new Date(dashboardStats.endDate).toLocaleDateString('vi-VN')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <GlobalFilters />
          </div>
        </div>
      </div>

      {dashboardStats && (
        <>
          {/* Phần Chỉ số Chính */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Tổng Yêu cầu"
              value={dashboardStats.totalRequests}
              icon={<Activity className="w-6 h-6" />}
              color="blue"
              description="Tất cả yêu cầu bảo trì"
            />
            <StatsCard
              title="Công việc Đang thực hiện"
              value={dashboardStats.totalTasks}
              icon={<Wrench className="w-6 h-6" />}
              color="purple"
              description="Công việc được giao hiện tại"
            />
            <StatsCard
              title="Tổng Thiết bị"
              value={dashboardStats.totalDevices}
              icon={<Settings className="w-6 h-6" />}
              color="green"
              description="Thiết bị được quản lý"
            />
            <StatsCard
              title="Tỷ lệ Hoàn thành"
              value={Math.round(analyticsData?.requestCompletionRate || 0)}
              icon={<TrendingUp className="w-6 h-6" />}
              color="orange"
              description="% hoàn thành yêu cầu"
            />
          </div>

          {/* Phần Tổng quan Trạng thái */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trạng thái Yêu cầu */}
            <ChartContainer title="Trạng thái Yêu cầu" className="lg:col-span-1">
              <div className="space-y-4">
                <ProgressBar 
                  label="Hoàn thành" 
                  value={dashboardStats.completedRequests} 
                  total={dashboardStats.totalRequests}
                  color="green"
                />
                <ProgressBar 
                  label="Đang xử lý" 
                  value={dashboardStats.inProgressRequests} 
                  total={dashboardStats.totalRequests}
                  color="blue"
                />
                <ProgressBar 
                  label="Chờ xử lý" 
                  value={dashboardStats.pendingRequests} 
                  total={dashboardStats.totalRequests}
                  color="orange"
                />
                <ProgressBar 
                  label="Từ chối" 
                  value={dashboardStats.rejectedRequests} 
                  total={dashboardStats.totalRequests}
                  color="red"
                />
              </div>
            </ChartContainer>

            {/* Trạng thái Công việc */}
            <ChartContainer title="Trạng thái Công việc" className="lg:col-span-1">
              <div className="space-y-4">
                <ProgressBar 
                  label="Hoàn thành" 
                  value={dashboardStats.completedTasks} 
                  total={dashboardStats.totalTasks}
                  color="green"
                />
                <ProgressBar 
                  label="Đang xử lý" 
                  value={dashboardStats.inProgressTasks} 
                  total={dashboardStats.totalTasks}
                  color="blue"
                />
                <ProgressBar 
                  label="Chờ xử lý" 
                  value={dashboardStats.pendingTasks} 
                  total={dashboardStats.totalTasks}
                  color="orange"
                />
              </div>
            </ChartContainer>

            {/* Trạng thái Thiết bị */}
            <ChartContainer title="Trạng thái Thiết bị" className="lg:col-span-1">
              <div className="space-y-4">
                <ProgressBar 
                  label="Hoạt động" 
                  value={dashboardStats.activeDevices} 
                  total={dashboardStats.totalDevices}
                  color="green"
                />
                <ProgressBar 
                  label="Đang sử dụng" 
                  value={dashboardStats.inUseDevices} 
                  total={dashboardStats.totalDevices}
                  color="blue"
                />
                <ProgressBar 
                  label="Đang sửa chữa" 
                  value={dashboardStats.inRepairDevices} 
                  total={dashboardStats.totalDevices}
                  color="orange"
                />
                <ProgressBar 
                  label="Trong bảo hành" 
                  value={dashboardStats.inWarrantyDevices} 
                  total={dashboardStats.totalDevices}
                  color="purple"
                />
              </div>
            </ChartContainer>
          </div>

          {/* Phân tích Loại Công việc */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartContainer 
              title="Phân bố Loại Công việc"
              actions={<PieChart className="w-5 h-5 text-gray-400" />}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span className="font-medium text-gray-700">Công việc Bảo hành</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dashboardStats.warrantyTasks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                    <span className="font-medium text-gray-700">Công việc Sửa chữa</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dashboardStats.repairTasks}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-gray-700">Công việc Thay thế</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dashboardStats.replacementTasks}</span>
                </div>
              </div>
            </ChartContainer>

            <ChartContainer 
              title="Yêu cầu Gần đây"
              actions={<BarChart3 className="w-5 h-5 text-gray-400" />}
            >
              {dashboardStats.requests.length > 0 ? (
                <RequestsList requests={dashboardStats.requests} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Không tìm thấy yêu cầu gần đây</p>
                </div>
              )}
            </ChartContainer>
          </div>

          {/* Chỉ số Hiệu suất */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Hoàn thành Yêu cầu</p>
                  <p className="text-3xl font-bold">{analyticsData?.requestCompletionRate.toFixed(1)}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-blue-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Hoàn thành Công việc</p>
                  <p className="text-3xl font-bold">{analyticsData?.taskCompletionRate.toFixed(1)}%</p>
                </div>
                <Wrench className="w-8 h-8 text-green-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Sử dụng Thiết bị</p>
                  <p className="text-3xl font-bold">{analyticsData?.deviceUtilizationRate.toFixed(1)}%</p>
                </div>
                <Settings className="w-8 h-8 text-purple-200" />
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Thiết bị Hoạt động</p>
                  <p className="text-3xl font-bold">{analyticsData?.activeDeviceRate.toFixed(1)}%</p>
                </div>
                <Activity className="w-8 h-8 text-orange-200" />
              </div>
            </div>
          </div>

          {/* Phần Thông báo */}
          <ChartContainer title="Thông báo & Cảnh báo Hệ thống">
            <HOTNotificationArea />
          </ChartContainer>
        </>
      )}
    </div>
  );
}

// Component chính cung cấp filter context
const DetailWorkspacePage = () => {
  return (
    <DashboardFilterProvider>
      <DashboardContent />
    </DashboardFilterProvider>
  );
};

export default DetailWorkspacePage;
