"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, History, Clock, MapPin, Activity, Wrench, Package, ArrowUpDown, Shield, Calendar, Settings } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { translateTaskStatus, translateTaskType, translateActionType } from "@/utils/textTypeTask";

interface DeviceHistoryLogProps {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
}

interface DeviceLogEvent {
  id: string;
  date: string;
  eventType: 'INSTALLATION' | 'UNINSTALLATION' | 'WAREHOUSE_IMPORT' | 'WAREHOUSE_EXPORT' | 'REPAIR' | 'WARRANTY_SEND' | 'WARRANTY_RETURN' | 'MAINTENANCE' | 'DEVICE_INSTALLATION';
  actionLabel: string;
  description: string;
  status: 'COMPLETED' | 'INPROGRESS' | 'PENDING' | 'FAILED';
  requestCode?: string;
  taskId?: string;
  assigneeName?: string;
  notes?: string;
  source: 'REQUEST' | 'TASK' | 'MACHINE_ACTION' | 'SYSTEM' | 'DEVICE_INSTALLATION';
  location?: string;
}

interface DeviceCurrentLocation {
  area: string;
  zone: string;
  position: string;
  status: string;
  lastUpdated: string;
}

export default function DeviceHistoryLog({ deviceId, deviceCode, deviceName }: DeviceHistoryLogProps) {
  const [deviceLogs, setDeviceLogs] = useState<DeviceLogEvent[]>([]);
  const [currentLocation, setCurrentLocation] = useState<DeviceCurrentLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Main function to fetch comprehensive device history
  const fetchDeviceHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching device history for: ${deviceCode} (${deviceName})`);
      
      // ✅ Step 1: Get device details for current location AND installation date
      const deviceDetails = await fetchCurrentDeviceLocation();
      
      // ✅ Step 2: Get comprehensive device activity logs
      const allEvents: DeviceLogEvent[] = [];
      
      // ✅ Step 3: Add installation date log entry if available
      if (deviceDetails?.installationDate) {
        const installationEvent: DeviceLogEvent = {
          id: `device-installation-${deviceId}`,
          date: deviceDetails.installationDate,
          eventType: 'DEVICE_INSTALLATION',
          actionLabel: 'Ngày lắp đặt thiết bị',
          description: 'Thiết bị được lắp đặt và đưa vào vận hành',
          status: 'COMPLETED',
          assigneeName: "Hệ thống",
          source: 'DEVICE_INSTALLATION',
          location: deviceDetails.areaName && deviceDetails.zoneName ? 
            `${deviceDetails.areaName} - ${deviceDetails.zoneName} - ${deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : 'Không rõ'}` : 
            undefined
        };
        
        allEvents.push(installationEvent);
        console.log(`➕ Added device installation event: ${deviceDetails.installationDate}`);
      }
      
      // Get device-specific requests
      const deviceRequests = await fetchDeviceRequests();
      
      // Process each request for device events
      for (const request of deviceRequests) {
        const requestEvents = await processRequestForDeviceEvents(request);
        allEvents.push(...requestEvents);
      }
      
      // Get machine actions for this device
      const machineActionEvents = await fetchMachineActionsForDevice();
      allEvents.push(...machineActionEvents);
      
      // ✅ Step 4: Filter out meaningless events and sort chronologically
      const meaningfulEvents = allEvents.filter(event => 
        !event.actionLabel.includes('SparePartRequest') &&
        !event.actionLabel.includes('linh kiện') &&
        (event.eventType !== 'MAINTENANCE' || event.eventType === 'DEVICE_INSTALLATION') // Keep device installation but filter maintenance noise
      );
      
      // Sort newest → oldest (but device installation should appear chronologically)
      const sortedEvents = meaningfulEvents.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setDeviceLogs(sortedEvents);
      console.log(`📊 Device history complete: ${sortedEvents.length} meaningful events found`);

    } catch (error) {
      console.error("❌ Error fetching device history:", error);
      setError("Không thể tải lịch sử thiết bị");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ UPDATED: Get current device location from device details AND return device details for installation date
  const fetchCurrentDeviceLocation = async () => {
    try {
      const deviceDetails = await apiClient.device.getDeviceById(deviceId);
      console.log("📍 Device details:", deviceDetails);
      
      if (deviceDetails) {
        // ✅ Build correct location format: AreaName - ZoneName - PositionIndex
        const area = deviceDetails.areaName || "Không rõ";
        const zone = deviceDetails.zoneName || "Không rõ";
        const position = deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : "Không rõ";
        
        setCurrentLocation({
          area,
          zone, 
          position,
          status: deviceDetails.status,
          lastUpdated: deviceDetails.modifiedDate || deviceDetails.createdDate || new Date().toISOString()
        });
        
        // ✅ Return device details for installation date extraction
        return deviceDetails;
      }
      
      return null;
    } catch (error) {
      console.warn("⚠️ Could not fetch device location:", error);
      // Set default values if API fails
      setCurrentLocation({
        area: "Không rõ",
        zone: "Không rõ", 
        position: "Không rõ",
        status: "ACTIVE",
        lastUpdated: new Date().toISOString()
      });
      return null;
    }
  };

  // ✅ Fetch all requests that involve this specific device
  const fetchDeviceRequests = async () => {
    try {
      const response = await apiClient.request.getRequestByDeviceId(deviceId);
      console.log("📊 Device requests response:", response);
      
      // Handle different response structures
      let requests = [];
      if (response?.data?.data && Array.isArray(response.data.data)) {
        requests = response.data.data;
      } else if (response?.data && Array.isArray(response.data)) {
        requests = response.data;
      } else if (Array.isArray(response)) {
        requests = response;
      } else if (response && typeof response === 'object') {
        requests = [response];
      }
      
      console.log(`✅ Found ${requests.length} requests for device ${deviceCode}`);
      return requests;
    } catch (error) {
      console.warn("⚠️ Could not fetch device requests:", error);
      return [];
    }
  };

  // ✅ Process a single request to extract meaningful device lifecycle events
  const processRequestForDeviceEvents = async (request: any): Promise<DeviceLogEvent[]> => {
    const events: DeviceLogEvent[] = [];
    const requestId = request.id || request.requestId;
    const requestCode = request.requestCode || request.code || `REQ-${requestId?.slice(0, 8)}`;
    
    try {
      // Get task groups for this request
      const tasksResponse = await apiClient.task.getTaskGroups(requestId, 1, 100);
      let taskGroups = [];
      
      if (tasksResponse?.data?.data) {
        taskGroups = tasksResponse.data.data;
      } else if (Array.isArray(tasksResponse?.data)) {
        taskGroups = tasksResponse.data;
      } else if (Array.isArray(tasksResponse)) {
        taskGroups = tasksResponse;
      }

      // Process each task group
      for (const taskGroup of taskGroups) {
        if (taskGroup.tasks && Array.isArray(taskGroup.tasks)) {
          for (const task of taskGroup.tasks) {
            // ✅ Check if this task involves our specific device
            const taskDeviceId = task.deviceId || task.device?.id;
            const taskDeviceCode = task.deviceCode || task.device?.deviceCode;
            const taskDeviceName = task.deviceName || task.device?.deviceName;
            
            const isDeviceMatch = taskDeviceId === deviceId || 
                                 taskDeviceCode === deviceCode || 
                                 taskDeviceName === deviceName;
            
            if (isDeviceMatch) {
              const deviceEvent = mapTaskToLifecycleEvent(task, requestCode);
              if (deviceEvent) {
                events.push(deviceEvent);
                console.log(`➕ Added lifecycle event: ${deviceEvent.actionLabel} for ${deviceCode}`);
              }
            }
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not process request ${requestCode}:`, error);
    }
    
    return events;
  };

  // ✅ Get machine actions for this device
  const fetchMachineActionsForDevice = async (): Promise<DeviceLogEvent[]> => {
    const events: DeviceLogEvent[] = [];
    
    try {
      const response = await apiClient.machineActionConfirmation.getAll(1, 100);
      const machineActions = response?.data || [];
      
      for (const action of machineActions) {
        const actionDeviceId = action.deviceId || action.device?.id;
        const actionDeviceCode = action.deviceCode || action.deviceName;
        
        const isDeviceMatch = actionDeviceId === deviceId || 
                             actionDeviceCode === deviceCode;
                             
        if (isDeviceMatch) {
          // ✅ Only include meaningful machine actions (not spare part noise)
          if (action.actionType?.toLowerCase() === 'stockin' || 
              action.actionType?.toLowerCase() === 'stockout' ||
              action.actionType?.toLowerCase() === 'installation' ||
              action.actionType?.toLowerCase() === 'uninstallation') {
            
            events.push({
              id: action.id || `machine-${action.actionType}-${Date.now()}`,
              date: action.createdDate || action.actionDate || new Date().toISOString(),
              eventType: action.actionType?.toUpperCase() === 'STOCKIN' ? 'WAREHOUSE_IMPORT' : 
                        action.actionType?.toUpperCase() === 'STOCKOUT' ? 'WAREHOUSE_EXPORT' :
                        action.actionType?.toUpperCase() === 'INSTALLATION' ? 'INSTALLATION' : 'UNINSTALLATION',
              actionLabel: translateActionType(action.actionType || 'Hoạt động'),
              description: action.description || `${translateActionType(action.actionType)} thiết bị`,
              status: action.status === 'completed' ? 'COMPLETED' : action.status === 'inprogress' ? 'INPROGRESS' : 'PENDING',
              assigneeName: action.mechanicName || "Hệ thống",
              source: 'MACHINE_ACTION',
              location: action.department && action.position ? `${action.department} - ${action.position}` : undefined
            });
            
            console.log(`➕ Added machine action event for ${deviceCode}`);
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch machine actions:", error);
    }
    
    return events;
  };

  // ✅ Map task data to meaningful device lifecycle event
  const mapTaskToLifecycleEvent = (task: any, requestCode: string): DeviceLogEvent | null => {
    const taskDate = task.startTime || task.createdDate || task.expectedTime;
    const isCompleted = task.status?.toLowerCase() === 'completed' || task.status?.toLowerCase() === 'done';
    const isPending = task.status?.toLowerCase() === 'pending' || task.status?.toLowerCase() === 'waiting';
    const isInProgress = task.status?.toLowerCase() === 'inprogress' || task.status?.toLowerCase() === 'active';
    
    let eventType: DeviceLogEvent['eventType'];
    let actionLabel: string;
    let description: string;
    let status: DeviceLogEvent['status'];

    // ✅ Map task types to meaningful device lifecycle events
    switch (task.taskType?.toLowerCase()) {
      case 'installation':
        eventType = 'INSTALLATION';
        actionLabel = 'Ngày lắp đặt';
        description = `Lắp đặt thiết bị vào hệ thống sản xuất`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'uninstallation':
        eventType = 'UNINSTALLATION';
        actionLabel = 'Ngày tháo máy';
        description = `Tháo dỡ thiết bị khỏi hệ thống sản xuất`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'repair':
        eventType = 'REPAIR';
        actionLabel = 'Ngày sửa chữa';
        description = `Thực hiện sửa chữa thiết bị`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'warranty':
      case 'warrantysubmission':
        eventType = 'WARRANTY_SEND';
        actionLabel = 'Ngày xuất kho (gửi bảo hành)';
        description = `Xuất thiết bị khỏi kho để gửi bảo hành`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'warrantyreturn':
        eventType = 'WARRANTY_RETURN';
        actionLabel = 'Ngày nhập kho (trả về từ bảo hành)';
        description = `Nhập thiết bị về kho sau khi bảo hành`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'stockin':
        eventType = 'WAREHOUSE_IMPORT';
        actionLabel = 'Ngày nhập kho';
        description = `Nhập thiết bị vào kho`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      case 'stockout':
        eventType = 'WAREHOUSE_EXPORT';
        actionLabel = 'Ngày xuất kho';
        description = `Xuất thiết bị khỏi kho`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        break;
        
      default:
        // Skip meaningless task types
        return null;
    }

    return {
      id: task.taskId || `${requestCode}-${task.taskType}-${Date.now()}`,
      date: taskDate,
      eventType,
      actionLabel,
      description,
      status,
      requestCode,
      taskId: task.taskId,
      assigneeName: task.assigneeName || "Không rõ",
      notes: task.notes || task.description,
      source: 'TASK'
    };
  };

  // ✅ Load device history when component mounts
  useEffect(() => {
    if (deviceId && deviceCode) {
      fetchDeviceHistory();
    }
  }, [deviceId, deviceCode, deviceName]);

  // ✅ UPDATED: Enhanced timezone-aware date formatting functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      // ✅ Handle UTC server time properly
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh" // ✅ Force Vietnam timezone
      });
    } catch (error) {
      console.warn("Date formatting error:", error);
      return "N/A";
    }
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh" // ✅ Force Vietnam timezone
      });
    } catch (error) {
      console.warn("Time formatting error:", error);
      return "N/A";
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh" // ✅ Force Vietnam timezone
      });
    } catch (error) {
      console.warn("DateTime formatting error:", error);
      return "N/A";
    }
  };

  // ✅ UPDATED: Format timestamp in exact format: HH:MM dd/MM/yyyy
  const formatExactTimestamp = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return "N/A";
      
      // ✅ Create Vietnam timezone-aware date
      const vietnamDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      
      // Format as HH:MM dd/MM/yyyy
      const hours = vietnamDate.getHours().toString().padStart(2, '0');
      const minutes = vietnamDate.getMinutes().toString().padStart(2, '0');
      const day = vietnamDate.getDate().toString().padStart(2, '0');
      const month = (vietnamDate.getMonth() + 1).toString().padStart(2, '0');
      const year = vietnamDate.getFullYear();
      
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } catch (error) {
      console.warn("Exact timestamp formatting error:", error);
      return "N/A";
    }
  };

  // ✅ UPDATED: Calculate Vietnamese relative time with more accuracy
  const getVietnameseRelativeTime = (dateString: string) => {
    if (!dateString) return "Không rõ";
    
    try {
      const date = new Date(dateString);
      
      if (isNaN(date.getTime())) return "Không rõ";
      
      // ✅ Get current Vietnam time for accurate comparison
      const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      const vietnamEventDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
      
      const diffMs = now.getTime() - vietnamEventDate.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
      // ✅ More precise Vietnamese relative time
      if (diffSeconds < 30) {
        return "Vừa xong";
      } else if (diffSeconds < 60) {
        return "Dưới 1 phút trước";
      } else if (diffMinutes === 1) {
        return "1 phút trước";
      } else if (diffMinutes < 60) {
        return `${diffMinutes} phút trước`;
      } else if (diffHours === 1) {
        return "1 giờ trước";
      } else if (diffHours < 24) {
        return `${diffHours} giờ trước`;
      } else if (diffDays === 1) {
        return "1 ngày trước";
      } else if (diffDays < 7) {
        return `${diffDays} ngày trước`;
      } else if (diffWeeks === 1) {
        return "1 tuần trước";
      } else if (diffWeeks < 4) {
        return `${diffWeeks} tuần trước`;
      } else if (diffMonths === 1) {
        return "1 tháng trước";
      } else if (diffMonths < 12) {
        return `${diffMonths} tháng trước`;
      } else if (diffYears === 1) {
        return "1 năm trước";
      } else {
        return `${diffYears} năm trước`;
      }
    } catch (error) {
      console.warn("Vietnamese relative time calculation error:", error);
      return "Không rõ";
    }
  };

  // ✅ UPDATED: Enhanced getEventIcon to include device installation
  const getEventIcon = (eventType: DeviceLogEvent['eventType']) => {
    switch (eventType) {
      case 'DEVICE_INSTALLATION':
        return <Settings className="h-4 w-4 text-blue-600" />;
      case 'INSTALLATION':
        return <ArrowUpDown className="h-4 w-4 text-green-600" />;
      case 'UNINSTALLATION':
        return <ArrowUpDown className="h-4 w-4 text-red-600" />;
      case 'REPAIR':
        return <Wrench className="h-4 w-4 text-orange-600" />;
      case 'WARRANTY_SEND':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'WARRANTY_RETURN':
        return <Shield className="h-4 w-4 text-purple-600" />;
      case 'WAREHOUSE_IMPORT':
        return <Package className="h-4 w-4 text-cyan-600" />;
      case 'WAREHOUSE_EXPORT':
        return <Package className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      case "inprogress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  const getDeviceStatusDisplayText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "Hoạt động";
      case "inactive": 
        return "Không hoạt động";
      case "inuse":
        return "Đang sử dụng";
      case "inrepair":
        return "Đang sửa chữa";
      case "inwarranty":
        return "Đang bảo hành";
      case "decommissioned":
        return "Ngừng sử dụng";
      default:
        return status;
    }
  };

  const getDeviceStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      case "inuse":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      case "inrepair":
        return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
      case "inwarranty":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400";
      case "decommissioned":
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <p>Đang tải lịch sử thiết bị...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8 text-center">
          <History className="h-12 w-12 text-red-500 mb-2 opacity-50" />
          <p className="text-lg font-medium text-red-600">{error}</p>
          <button 
            onClick={fetchDeviceHistory}
            className="mt-2 text-blue-600 underline text-sm"
          >
            Thử lại
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ✅ Current Location Summary - Perfect two-line "Last Updated" display */}
      {currentLocation && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              Vị trí hiện tại của thiết bị
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Vị trí</Label>
                <p className="font-medium">
                  {currentLocation.area} - {currentLocation.zone} - {currentLocation.position}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Trạng thái</Label>
                <p className="font-medium">
                  <Badge variant="outline" className={getDeviceStatusBadgeVariant(currentLocation.status)}>
                    {getDeviceStatusDisplayText(currentLocation.status)}
                  </Badge>
                </p>
              </div>
              {/* ✅ PERFECT: Two-line "Last Updated" display with correct Vietnam timezone */}
              <div>
                <Label className="text-xs text-muted-foreground">Cập nhật lần cuối</Label>
                <div className="space-y-0.5">
                  {/* Line 1: Exact timestamp with clock icon */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {formatExactTimestamp(currentLocation.lastUpdated)}
                    </span>
                  </div>
                  {/* Line 2: Relative time with bullet point */}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground ml-4">
                    <span className="text-blue-400">•</span>
                    <span>{getVietnameseRelativeTime(currentLocation.lastUpdated)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ Activity Summary - Updated to reflect installation events */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Tổng quan hoạt động</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4 text-center">
            <div>
              <span className="text-xs text-muted-foreground">Tổng sự kiện</span>
              <p className="font-medium">{deviceLogs.length}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Sửa chữa</span>
              <p className="font-medium">
                {deviceLogs.filter(e => e.eventType === 'REPAIR').length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Bảo hành</span>
              <p className="font-medium">
                {deviceLogs.filter(e => e.eventType === 'WARRANTY_SEND').length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Lắp/Tháo</span>
              <p className="font-medium">
                {deviceLogs.filter(e => e.eventType === 'INSTALLATION' || e.eventType === 'UNINSTALLATION' || e.eventType === 'DEVICE_INSTALLATION').length}
              </p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">Nhập/Xuất kho</span>
              <p className="font-medium">
                {deviceLogs.filter(e => e.eventType === 'WAREHOUSE_IMPORT' || e.eventType === 'WAREHOUSE_EXPORT').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ Timeline */}
      {deviceLogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-8 text-center">
            <History className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
            <p className="text-lg font-medium">
              Thiết bị này chưa có hoạt động nào được ghi nhận.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold">Lịch sử hoạt động chi tiết</h4>
            <Badge variant="secondary">{deviceLogs.length} sự kiện</Badge>
          </div>

          {/* ✅ Event timeline design */}
          <div className="space-y-3">
            {deviceLogs.map((event, index) => (
              <Card 
                key={event.id} 
                className={`border-l-4 ${
                  event.eventType === 'DEVICE_INSTALLATION' ? 'border-l-blue-600 bg-blue-50/50 dark:bg-blue-900/10' : 'border-l-blue-500'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getEventIcon(event.eventType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium text-foreground">
                            {event.actionLabel}
                          </h5>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(event.date)}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(event.date)}
                          </span>
                          
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-2">
                          {event.description}
                        </p>
                        
                        {/* Additional details */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {event.assigneeName && (
                            <span>Thực hiện bởi: <span className="font-medium text-foreground">{event.assigneeName}</span></span>
                          )}
                          {event.requestCode && (
                            <span>Mã yêu cầu: <span className="font-medium text-foreground">{event.requestCode}</span></span>
                          )}
                          {event.location && (
                            <span>Địa điểm: <span className="font-medium text-foreground">{event.location}</span></span>
                          )}
                        </div>
                        
                        {event.notes && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <span className="font-medium">Ghi chú: </span>
                            {event.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <Badge variant="outline" className={getStatusBadgeVariant(event.status)}>
                        {translateTaskStatus(event.status)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}