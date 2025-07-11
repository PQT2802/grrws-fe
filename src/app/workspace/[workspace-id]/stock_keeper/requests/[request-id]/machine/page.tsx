'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRightLeft, Calendar, User, FileText, AlertCircle, Settings, Package } from "lucide-react";
import { toast } from "sonner";
import StatusBadge from '../../components/StatusBadge';
import ConfirmRequestModal from '../../components/sparepart/ConfirmRequestModal';
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/AuthProvider";

// Mock interface for machine request detail
interface MachineRequestDetail {
  id: string;
  requestCode: string;
  requestDate: string;
  requestedBy: string;
  status: string;
  reason: string;
  priority: string;
  notes?: string;
  confirmedDate?: string;
  currentMachine: {
    id: string;
    machineName: string;
    machineCode: string;
    location: string;
    status: string;
    description?: string;
    specifications?: string;
    manufacturer?: string;
    installationDate?: string;
  };
  replacementMachine: {
    id: string;
    machineName: string;
    machineCode: string;
    location: string;
    status: string;
    description?: string;
    specifications?: string;
    manufacturer?: string;
    availableDate?: string;
  };
}

export default function MachineRequestDetailPage({ params }: { params: Promise<{ "request-id": string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const resolvedParams = React.use(params);
  const requestId = resolvedParams["request-id"];
  
  // State variables
  const [isLoading, setIsLoading] = useState(true);
  const [requestDetail, setRequestDetail] = useState<MachineRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for action modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Mock data for machine request detail
  const mockRequestDetail: MachineRequestDetail = {
    id: requestId,
    requestCode: `MR-${requestId}`,
    requestDate: "2024-01-15T08:00:00Z",
    requestedBy: "Nguyễn Văn A",
    status: "Unconfirmed",
    reason: "Máy cũ bị hỏng không sửa được, cần thay thế ngay để không ảnh hưởng đến sản xuất",
    priority: "High",
    notes: "Máy này đã hỏng từ tuần trước, đã cố gắng sửa chữa nhưng không thể khôi phục",
    confirmedDate: undefined,
    currentMachine: {
      id: "machine-001",
      machineName: "Máy khoan CNC-01",
      machineCode: "CNC-DRILL-001",
      location: "Khu vực sản xuất A - Dây chuyền 1",
      status: "Broken",
      description: "Máy khoan CNC chính dùng cho gia công chi tiết kim loại",
      specifications: "Công suất: 5HP, Tốc độ tối đa: 3000 RPM",
      manufacturer: "Fanuc",
      installationDate: "2020-05-15"
    },
    replacementMachine: {
      id: "machine-005",
      machineName: "Máy khoan CNC-05",
      machineCode: "CNC-DRILL-005",
      location: "Kho thiết bị dự phòng",
      status: "Available",
      description: "Máy khoan CNC thay thế với công nghệ mới hơn",
      specifications: "Công suất: 7.5HP, Tốc độ tối đa: 4000 RPM",
      manufacturer: "Fanuc",
      availableDate: "2024-01-20"
    }
  };
  
  // Fetch request detail (mock for now)
  useEffect(() => {
    const fetchRequestDetail = async () => {
      try {
        setIsLoading(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setRequestDetail(mockRequestDetail);
        toast.success("Chi tiết yêu cầu đã được tải thành công");
      } catch (err) {
        console.error("Failed to fetch machine request detail:", err);
        setError("Không thể tải chi tiết yêu cầu");
        toast.error("Không thể tải chi tiết yêu cầu");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (requestId) {
      fetchRequestDetail();
    }
  }, [requestId]);
  
  // Function to reload request detail
  const refreshRequestDetail = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update status to confirmed
      setRequestDetail(prev => prev ? {
        ...prev,
        status: "Confirmed",
        confirmedDate: new Date().toISOString()
      } : null);
      
    } catch (err) {
      console.error("Failed to refresh machine request detail:", err);
      toast.error("Không thể làm mới chi tiết yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle confirming the request
  const handleConfirmRequest = async (notes: string) => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setShowConfirmModal(false);
      toast.success("Yêu cầu đã được xác nhận thành công");
      
      // Reload request data to get updated status
      await refreshRequestDetail();
      
    } catch (error) {
      console.error("Failed to confirm machine request:", error);
      toast.error("Không thể xác nhận yêu cầu");
    } finally {
      setIsLoading(false);
    }
  };
  
  // Go back to requests list
  const goBack = () => {
    router.push("../../requests"); // Now we go back directly without query params
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa xác nhận";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  // Get priority badge
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return (
          <div className="flex items-center gap-1 text-red-600 bg-red-50 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Cao</span>
          </div>
        );
      case 'Medium':
        return (
          <div className="flex items-center gap-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Trung bình</span>
          </div>
        );
      case 'Low':
        return (
          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Thấp</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1 text-gray-600 bg-gray-50 px-2 py-1 rounded-full">
            <AlertCircle className="h-3 w-3" />
            <span className="text-xs font-medium">Chưa xác định</span>
          </div>
        );
    }
  };

  // Determine what actions are available based on status
  const getActionButtons = () => {
    if (!requestDetail) return null;
    
    const isUnconfirmed = requestDetail.status === "Unconfirmed";
    
    return (
      <div className="flex justify-end gap-2">
        <button
          onClick={goBack}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Quay lại danh sách
        </button>
        
        {isUnconfirmed && (
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded text-sm"
          >
            Xác nhận yêu cầu
          </button>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
          <Skeleton className="h-6 w-1/4 mb-4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-lg font-medium mb-2">Lỗi</div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={goBack}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={goBack}
              className="flex items-center text-gray-500 hover:text-primary mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              <span className="text-sm">Quay lại danh sách</span>
            </button>
            <h1 className="text-xl font-bold">Yêu cầu: {requestDetail?.requestCode}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Xem và quản lý thông tin yêu cầu thiết bị
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Độ ưu tiên</div>
              {requestDetail && getPriorityBadge(requestDetail.priority)}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Trạng thái</div>
              <StatusBadge status={requestDetail?.status || "Unknown"} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Request Info */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Thông tin yêu cầu</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <User className="h-4 w-4" />
                <span>Người yêu cầu</span>
              </div>
              <p className="font-medium">{requestDetail?.requestedBy || "Không xác định"}</p>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Calendar className="h-4 w-4" />
                <span>Ngày yêu cầu</span>
              </div>
              <p className="font-medium">{formatDate(requestDetail?.requestDate || null)}</p>
            </div>
            
            {requestDetail?.confirmedDate && (
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Ngày xác nhận</span>
                </div>
                <p className="font-medium">{formatDate(requestDetail?.confirmedDate)}</p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lý do thay thế</p>
              <p className="font-medium">{requestDetail?.reason || "Không có"}</p>
            </div>
            
            {requestDetail?.notes && (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ghi chú</p>
                <p className="font-medium">{requestDetail.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Machine Replacement Details */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-6">
          <ArrowRightLeft className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Chi tiết thay thế thiết bị</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Machine */}
          <div className="border border-red-200 dark:border-red-800 rounded-lg p-4 bg-red-50 dark:bg-red-950/10">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-red-600" />
              <h3 className="font-semibold text-red-700 dark:text-red-400">
                Thiết bị hiện tại (sẽ thay thế)
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tên thiết bị</p>
                  <p className="font-medium">{requestDetail?.currentMachine?.machineName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mã thiết bị</p>
                  <p className="font-medium">{requestDetail?.currentMachine?.machineCode || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vị trí</p>
                <p className="font-medium">{requestDetail?.currentMachine?.location || "N/A"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                  <p className="font-medium text-red-600">{requestDetail?.currentMachine?.status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nhà sản xuất</p>
                  <p className="font-medium">{requestDetail?.currentMachine?.manufacturer || "N/A"}</p>
                </div>
              </div>
              
              {requestDetail?.currentMachine?.specifications && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Thông số kỹ thuật</p>
                  <p className="font-medium text-sm">{requestDetail.currentMachine.specifications}</p>
                </div>
              )}
              
              {requestDetail?.currentMachine?.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mô tả</p>
                  <p className="font-medium text-sm">{requestDetail.currentMachine.description}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Replacement Machine */}
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/10">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-700 dark:text-green-400">
                Thiết bị thay thế mới
              </h3>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Tên thiết bị</p>
                  <p className="font-medium">{requestDetail?.replacementMachine?.machineName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mã thiết bị</p>
                  <p className="font-medium">{requestDetail?.replacementMachine?.machineCode || "N/A"}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Vị trí hiện tại</p>
                <p className="font-medium">{requestDetail?.replacementMachine?.location || "N/A"}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Trạng thái</p>
                  <p className="font-medium text-green-600">{requestDetail?.replacementMachine?.status || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nhà sản xuất</p>
                  <p className="font-medium">{requestDetail?.replacementMachine?.manufacturer || "N/A"}</p>
                </div>
              </div>
              
              {requestDetail?.replacementMachine?.specifications && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Thông số kỹ thuật</p>
                  <p className="font-medium text-sm">{requestDetail.replacementMachine.specifications}</p>
                </div>
              )}
              
              {requestDetail?.replacementMachine?.description && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mô tả</p>
                  <p className="font-medium text-sm">{requestDetail.replacementMachine.description}</p>
                </div>
              )}
              
              {requestDetail?.replacementMachine?.availableDate && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ngày sẵn sàng</p>
                  <p className="font-medium text-sm">{formatDate(requestDetail.replacementMachine.availableDate)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      {getActionButtons()}
      
      {/* Confirmation Modal */}
      <ConfirmRequestModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmRequest}
        title="Xác nhận yêu cầu thiết bị"
        description="Xác nhận yêu cầu này sẽ thông báo cho người yêu cầu rằng thiết bị đã sẵn sàng để thay thế."
        confirmButtonText="Xác nhận yêu cầu"
      />
    </div>
  );
}