"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MoreHorizontal, Eye, Printer, Download, User, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { REQUEST_WITH_REPORT } from "@/types/dashboard.type";
import RequestDetailModal from "@/components/ChartCpn/RequestChartCpn/RequestDetailModal";

interface UserCache {
  [userId: string]: string;
}

export default function ActiveInstances() {
  const [requests, setRequests] = useState<REQUEST_WITH_REPORT[]>([]);
  const [userCache, setUserCache] = useState<UserCache>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<REQUEST_WITH_REPORT | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    fetchRequestsWithReport();
  }, []);

  const fetchRequestsWithReport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("🔄 Fetching requests with reports");
      
      const response = await apiClient.dashboard.getRequestsWithReport();
      console.log("📦 Raw API response:", response);
      
      // Handle different response structures
      let requestsData: REQUEST_WITH_REPORT[];
      
      if (response.data) {
        requestsData = response.data;
      } else if (Array.isArray(response)) {
        requestsData = response as any;
      } else {
        throw new Error("Invalid response structure");
      }
      
      console.log("📊 Requests data extracted:", requestsData);
      
      // Sort by createdDate descending (newest first) and take top 5
      const sortedRequests = requestsData
        .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
        .slice(0, 5);
      
      console.log("📋 Top 5 newest requests:", sortedRequests);
      setRequests(sortedRequests);
      
      // Fetch user names for all unique createdBy IDs
      await fetchUserNames(sortedRequests);
      
      console.log("✅ Top 5 requests with reports processed successfully");
    } catch (error: any) {
      console.error("❌ Error fetching requests with reports:", error);
      setError(`Failed to load requests: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserNames = async (requestsData: REQUEST_WITH_REPORT[]) => {
    const uniqueUserIds = [...new Set(requestsData.map(req => req.createdBy))];
    const newUserCache: UserCache = { ...userCache };
    
    for (const userId of uniqueUserIds) {
      if (!newUserCache[userId]) {
        try {
          const userResponse = await apiClient.user.getUserById(userId);
          newUserCache[userId] = userResponse.data?.fullName || userResponse.fullName || 'Unknown User';
        } catch (error) {
          console.error(`Failed to fetch user ${userId}:`, error);
          newUserCache[userId] = 'Unknown User';
        }
      }
    }
    
    setUserCache(newUserCache);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    
    // Add 7 hours for GMT+7 (Vietnam timezone)
    const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    
    return vietnamTime.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Ho_Chi_Minh'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const handleViewRequest = (request: REQUEST_WITH_REPORT) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading requests...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8 text-center">
          <div>
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="text-blue-500 underline text-sm"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="text-xl font-semibold">
            Các yêu cầu gần đây
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View all
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-6">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không có yêu cầu nào có báo cáo
            </div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-base font-bold text-gray-900 dark:text-white border-b pb-2">
                <div className="col-span-3">Người tạo</div>
                <div className="col-span-2">Tên thiết bị</div>
                <div className="col-span-2">Mức độ ưu tiên</div>
                <div className="col-span-2">Trạng thái</div>
                <div className="col-span-2">Ngày yêu cầu</div>
                <div className="col-span-1"></div>
              </div>

              {/* Table Rows */}
              {requests.map((request) => (
                <div key={request.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors rounded-lg">
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {userCache[request.createdBy] || 'Loading...'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {request.issues.length} vấn đề
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2 text-sm">
                    {request.deviceName}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary" className={`${getPriorityColor(request.priority)} border-0`}>
                      {request.priority}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="secondary" className={`${getStatusColor(request.status)} border-0`}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="col-span-2 text-sm">
                    {formatDate(request.createdDate)}
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewRequest(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RequestDetailModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}