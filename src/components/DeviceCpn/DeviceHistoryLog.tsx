"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, History, Clock, MapPin, Activity, Wrench, Package, ArrowUpDown, Shield, Calendar, Settings, Minus } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { translateTaskStatus, translateTaskType, translateActionType } from "@/utils/textTypeTask";
import { MACHINE_ACTION_CONFIRMATION_DETAIL } from "@/types/request.type";

interface DeviceHistoryLogProps {
  deviceId: string;
  deviceCode: string;
  deviceName: string;
}

interface DeviceLogEvent {
  id: string;
  date: string;
  eventType: 'INSTALLATION' | 'UNINSTALLATION' | 'WAREHOUSE_IMPORT' | 'WAREHOUSE_EXPORT' | 'REPAIR' | 'WARRANTY_SEND' | 'WARRANTY_RETURN' | 'MAINTENANCE' | 'DEVICE_REMOVAL';
  actionLabel: string;
  description: string;
  status: 'COMPLETED' | 'INPROGRESS' | 'PENDING' | 'FAILED';
  requestCode?: string;
  taskId?: string;
  assigneeName?: string;
  notes?: string;
  source: 'REQUEST' | 'TASK' | 'MACHINE_ACTION' | 'SYSTEM' | 'DEVICE_REMOVAL' | 'DEVICE_INSTALLATION';
  location?: string;
  requestedBy?: string;
  replacedDeviceId?: string;
  replacedDeviceCode?: string;
  sortPriority?: number;
  isOriginalTimestamp?: boolean;
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

  // ✅ ENHANCED: Main function to fetch comprehensive device history
  const fetchDeviceHistory = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`🔄 Fetching device history for: ${deviceCode} (${deviceName})`);
      
      // ✅ Step 1: Get device details for current location AND installation date
      const deviceDetails = await fetchCurrentDeviceLocation();
      
      // ✅ Step 2: Get comprehensive device activity logs
      const allEvents: DeviceLogEvent[] = [];
      
      // ✅ Step 3: Get device-specific requests and enhanced task checking
      const deviceRequests = await fetchDeviceRequests();
      
      // Process each request for device events
      for (const request of deviceRequests) {
        const requestEvents = await processRequestForDeviceEvents(request);
        allEvents.push(...requestEvents);
      }
      
      // ✅ Step 4: Get enhanced machine actions for this device with completed status filtering
      const machineActionEvents = await fetchMachineActionsForDevice();
      allEvents.push(...machineActionEvents);
      
      // ✅ Step 5: Filter out meaningless events
      let meaningfulEvents = allEvents.filter(event => 
        !event.actionLabel.includes('SparePartRequest') &&
        !event.actionLabel.includes('linh kiện') &&
        event.eventType !== 'MAINTENANCE'
      );
      
      // ✅ NEW: Unify installation logs and remove duplicates
      meaningfulEvents = unifyInstallationLogs(meaningfulEvents, deviceDetails);
      
      // ✅ UPDATED: Enhanced sorting with proper ordering (Stock In → Removal → Installation)
      const sortedEvents = meaningfulEvents.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // ✅ Handle events with same date with proper ordering
        if (Math.abs(dateA - dateB) < 1000) { // Within 1 second, consider same time
          // Stock In (priority 3) → Removal (priority 2) → Installation (priority 1)
          const priorityA = getPriority(a);
          const priorityB = getPriority(b);
          return priorityB - priorityA; // Higher priority first (Stock In = 3 comes first)
        }
        
        // Sort by date descending (most recent first)
        return dateB - dateA;
      });
      
      setDeviceLogs(sortedEvents);
      
      // ✅ Update current location last updated time based on most recent log
      updateCurrentLocationLastUpdated(sortedEvents);
      
      console.log(`📊 Device history complete: ${sortedEvents.length} meaningful events found`);

    } catch (error) {
      console.error("❌ Error fetching device history:", error);
      setError("Không thể tải lịch sử thiết bị");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ NEW: Function to determine event priority for same-timestamp sorting
  const getPriority = (event: DeviceLogEvent): number => {
    if (event.eventType === 'WAREHOUSE_IMPORT') return 3; // Stock In - highest priority (appears first)
    if (event.eventType === 'DEVICE_REMOVAL') return 2; // Removal - middle priority
    if (event.eventType === 'INSTALLATION') return 1; // Installation - lowest priority (appears last)
    return 0; // Default priority
  };

  // ✅ NEW: Unify installation logs from different sources
  const unifyInstallationLogs = (events: DeviceLogEvent[], deviceDetails?: any): DeviceLogEvent[] => {
    // Find all installation-related events
    const installationEvents = events.filter(e => 
      e.eventType === 'INSTALLATION'
    );
    
    if (installationEvents.length === 0) {
      // ✅ If no installation task exists, create one from device details if available
      if (deviceDetails?.installationDate) {
        const deviceInstallationEvent: DeviceLogEvent = {
          id: `unified-installation-${deviceId}`,
          date: deviceDetails.installationDate,
          eventType: 'INSTALLATION',
          actionLabel: 'Lắp đặt thiết bị',
          description: 'Thiết bị được lắp đặt và đưa vào vận hành trong hệ thống sản xuất',
          status: 'COMPLETED',
          source: 'DEVICE_INSTALLATION',
          location: getInstallationLocationFromDevice(deviceDetails),
          assigneeName: "Nhân viên kỹ thuật",
          notes: `Thiết bị ${deviceCode} đã được lắp đặt thành công`,
          isOriginalTimestamp: true,
        };
        
        // Add the unified installation event to the filtered events
        const nonInstallationEvents = events.filter(e => e.eventType !== 'INSTALLATION');
        return [...nonInstallationEvents, deviceInstallationEvent];
      }
      
      return events; // No installation data available
    }

    // ✅ If installation task(s) exist, unify them with device details
    if (installationEvents.length === 1) {
      const installationTask = installationEvents[0];
      
      // ✅ Enhance the existing installation task with device details
      const unifiedInstallation: DeviceLogEvent = {
        ...installationTask,
        id: `unified-installation-${deviceId}`,
        actionLabel: 'Lắp đặt thiết bị',
        description: 'Thiết bị được lắp đặt và đưa vào vận hành trong hệ thống sản xuất',
        location: getUnifiedInstallationLocation(installationTask, deviceDetails),
        assigneeName: installationTask.assigneeName || "Nhân viên kỹ thuật",
        notes: installationTask.notes || `Thiết bị ${deviceCode} đã được lắp đặt thành công`,
        // Use task date if available, otherwise use device installation date
        date: installationTask.date || deviceDetails?.installationDate || installationTask.date,
      };
      
      // Replace the original installation task with the unified one
      const nonInstallationEvents = events.filter(e => e.eventType !== 'INSTALLATION');
      return [...nonInstallationEvents, unifiedInstallation];
    }

    // ✅ If multiple installation tasks exist (duplicates), merge them into one
    if (installationEvents.length > 1) {
      console.log(`🔄 Found ${installationEvents.length} installation events, unifying...`);
      
      // Sort by date and take the earliest one as the primary
      const sortedInstallations = installationEvents.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      const primaryInstallation = sortedInstallations[0];
      
      // ✅ Create unified installation log with best available data
      const unifiedInstallation: DeviceLogEvent = {
        ...primaryInstallation,
        id: `unified-installation-${deviceId}`,
        actionLabel: 'Lắp đặt thiết bị',
        description: 'Thiết bị được lắp đặt và đưa vào vận hành trong hệ thống sản xuất',
        location: getUnifiedInstallationLocation(primaryInstallation, deviceDetails, sortedInstallations),
        assigneeName: getBestAssigneeName(sortedInstallations),
        notes: getBestNotes(sortedInstallations, deviceCode),
        // Use the earliest installation date
        date: primaryInstallation.date,
      };
      
      // Remove all installation events and add the unified one
      const nonInstallationEvents = events.filter(e => e.eventType !== 'INSTALLATION');
      return [...nonInstallationEvents, unifiedInstallation];
    }

    return events;
  };

  // ✅ Helper function to get the best location from available sources
  const getUnifiedInstallationLocation = (
    primaryTask?: DeviceLogEvent, 
    deviceDetails?: any, 
    allInstallations?: DeviceLogEvent[]
  ): string => {
    // Priority 1: Task location if it's detailed (contains area-zone-position)
    if (primaryTask?.location && primaryTask.location.includes(' - ') && !primaryTask.location.includes('Kho')) {
      return primaryTask.location;
    }
    
    // Priority 2: Check other installation tasks for better location
    if (allInstallations) {
      for (const task of allInstallations) {
        if (task.location && task.location.includes(' - ') && !task.location.includes('Kho')) {
          return task.location;
        }
      }
    }
    
    // Priority 3: Device details location
    if (deviceDetails?.areaName && deviceDetails?.zoneName) {
      const position = deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : 'Không rõ';
      return `${deviceDetails.areaName} - ${deviceDetails.zoneName} - ${position}`;
    }
    
    // Priority 4: Task location (even if basic)
    if (primaryTask?.location) {
      return primaryTask.location;
    }
    
    // Fallback: Warehouse
    return "Kho";
  };

  // ✅ Helper function to get installation location from device details only
  const getInstallationLocationFromDevice = (deviceDetails: any): string => {
    if (deviceDetails?.areaName && deviceDetails?.zoneName) {
      const position = deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : 'Không rõ';
      return `${deviceDetails.areaName} - ${deviceDetails.zoneName} - ${position}`;
    }
    return "Kho";
  };

  // ✅ Helper function to get the best assignee name from multiple installation tasks
  const getBestAssigneeName = (installations: DeviceLogEvent[]): string => {
    for (const installation of installations) {
      if (installation.assigneeName && 
          installation.assigneeName !== "Không rõ" && 
          installation.assigneeName !== "Nhân viên kỹ thuật") {
        return installation.assigneeName;
      }
    }
    
    // Fallback to any available name
    for (const installation of installations) {
      if (installation.assigneeName) {
        return installation.assigneeName;
      }
    }
    
    return "Nhân viên kỹ thuật";
  };

  // ✅ Helper function to get the best notes from multiple installation tasks
  const getBestNotes = (installations: DeviceLogEvent[], deviceCode: string): string => {
    // Look for detailed notes first
    for (const installation of installations) {
      if (installation.notes && 
          installation.notes.length > 20 && 
          !installation.notes.includes('đã được lắp đặt thành công')) {
        return installation.notes;
      }
    }
    
    // Fallback to any available notes
    for (const installation of installations) {
      if (installation.notes) {
        return installation.notes;
      }
    }
    
    return `Thiết bị ${deviceCode} đã được lắp đặt thành công`;
  };

  // ✅ Update current location last updated time based on most recent log
  const updateCurrentLocationLastUpdated = (sortedEvents: DeviceLogEvent[]) => {
    if (sortedEvents.length > 0 && currentLocation) {
      const mostRecentEvent = sortedEvents[0]; // First event is most recent due to descending sort
      setCurrentLocation(prev => prev ? {
        ...prev,
        lastUpdated: mostRecentEvent.date
      } : null);
      console.log(`🕒 Updated last updated time to: ${mostRecentEvent.date}`);
    }
  };

  // ✅ ENHANCED: Get current device location with improved warehouse and warranty status handling
  const fetchCurrentDeviceLocation = async () => {
    try {
      console.log(`📍 Fetching device details: ${deviceId}`);
      const deviceDetails = await apiClient.device.getDeviceById(deviceId);
      console.log("📊 Device details:", deviceDetails);
      
      if (deviceDetails) {
        let area, zone, position;
        
        // ✅ Handle warranty status location
        if (deviceDetails.status?.toLowerCase() === 'inwarranty') {
          area = "Nhà bảo hành";
          zone = "Nhà bảo hành";
          position = "Nhà bảo hành";
          console.log(`🔧 Device ${deviceCode} is in warranty`);
        } else if (!deviceDetails.areaName || !deviceDetails.zoneName) {
          // ✅ Simplified warehouse display
          area = "Kho";
          zone = "Kho";
          position = "Kho";
          console.log(`📦 Device ${deviceCode} is in warehouse`);
        } else {
          area = deviceDetails.areaName;
          zone = deviceDetails.zoneName;
          position = deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : "Không rõ";
        }
        
        setCurrentLocation({
          area: area || "Kho",
          zone: zone || "Kho", 
          position: position || "Kho",
          status: deviceDetails.status || "ACTIVE",
          lastUpdated: deviceDetails.modifiedDate || deviceDetails.createdDate || new Date().toISOString()
        });
        
        return deviceDetails;
      }
      
      return null;
    } catch (error) {
      console.warn("⚠️ Could not fetch device location:", error);
      setCurrentLocation({
        area: "Kho",
        zone: "Kho", 
        position: "Kho",
        status: "ACTIVE",
        lastUpdated: new Date().toISOString()
      });
      return null;
    }
  };

  // ✅ Helper function to determine device location from context
  const getDeviceLocationFromContext = (task: any, deviceDetails?: any): string => {
    // Check if we have task-specific location data
    if (task.areaName && task.zoneName) {
      const position = task.positionIndex ? `Vị trí ${task.positionIndex}` : "";
      return `${task.areaName} - ${task.zoneName}${position ? ` - ${position}` : ""}`;
    }
    
    // Use device details location if available
    if (deviceDetails?.areaName && deviceDetails?.zoneName) {
      const position = deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : "";
      return `${deviceDetails.areaName} - ${deviceDetails.zoneName}${position ? ` - ${position}` : ""}`;
    }
    
    // Check task type for context-based location
    const taskType = task.taskType?.toLowerCase();
    if (taskType === 'warrantysubmission' || taskType === 'warranty') {
      return "Nhà bảo hành";
    }
    if (taskType === 'stockin' || taskType === 'stockout') {
      return "Kho";
    }
    
    // Default to warehouse
    return "Kho";
  };

  // ✅ Fetch all requests that involve this specific device
  const fetchDeviceRequests = async () => {
    try {
      const response = await apiClient.request.getRequestByDeviceId(deviceId);
      console.log("📊 Device requests response:", response);
      
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

  // ✅ ENHANCED: Process a single request with improved device removal detection and ordering
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

      // ✅ Get the device's current location for removal events
      const deviceDetails = await apiClient.device.getDeviceById(deviceId);
      const deviceLocation = deviceDetails?.areaName && deviceDetails?.zoneName ? 
        `${deviceDetails.areaName} - ${deviceDetails.zoneName} - ${deviceDetails.positionIndex ? `Vị trí ${deviceDetails.positionIndex}` : 'Không rõ'}` : 
        "Kho";

      // Process each task group
      for (const taskGroup of taskGroups) {
        if (taskGroup.tasks && Array.isArray(taskGroup.tasks)) {
          for (const task of taskGroup.tasks) {
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
            
            // ✅ ENHANCED: Special handling for Installation tasks that affect other devices
            if (task.taskType?.toLowerCase() === 'installation') {
              const installTaskDeviceId = task.deviceId || task.device?.id;
              const installTaskDeviceCode = task.deviceCode || task.device?.deviceCode;
              const installTaskDeviceName = task.deviceName || task.device?.deviceName;
              
              const isDifferentDevice = installTaskDeviceId !== deviceId && 
                                      installTaskDeviceCode !== deviceCode && 
                                      installTaskDeviceName !== deviceName;
              
              const isCompleted = task.status?.toLowerCase() === 'completed' || task.status?.toLowerCase() === 'done';
              
              if (isDifferentDevice && isCompleted) {
                // ✅ Use actual task date and subtract 1 second to ensure proper ordering
                let taskDate = new Date(task.completedTime || task.endTime || task.startTime || task.createdDate);
                taskDate.setSeconds(taskDate.getSeconds() - 1); // Ensure removal happens 1 second before stock-in
                
                const removalEvent: DeviceLogEvent = {
                  id: `device-removal-${task.taskId || Date.now()}-${deviceId}`,
                  date: taskDate.toISOString(),
                  eventType: 'DEVICE_REMOVAL',
                  actionLabel: 'Tháo thiết bị',
                  description: `Thiết bị bị tháo để thay thế bằng thiết bị khác`,
                  status: 'COMPLETED',
                  requestCode,
                  taskId: task.taskId,
                  assigneeName: task.assigneeName || "Không rõ",
                  source: 'DEVICE_REMOVAL',
                  notes: `Thiết bị được thay thế bằng ${installTaskDeviceCode || installTaskDeviceName || 'thiết bị mới'}`,
                  replacedDeviceId: installTaskDeviceId,
                  replacedDeviceCode: installTaskDeviceCode,
                  location: deviceLocation,
                };
                
                events.push(removalEvent);
                console.log(`➕ Added device removal event: ${deviceCode} replaced by ${installTaskDeviceCode} at ${deviceLocation}`);
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

  // ✅ ENHANCED: Get machine actions with detailed information and location context
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
          const isCompleted = action.status?.toLowerCase() === 'completed';
          
          if (isCompleted && (action.actionType?.toLowerCase() === 'stockin' || 
              action.actionType?.toLowerCase() === 'stockout' ||
              action.actionType?.toLowerCase() === 'installation' ||
              action.actionType?.toLowerCase() === 'uninstallation')) {
            
            let detailedAction: MACHINE_ACTION_CONFIRMATION_DETAIL | null = null;
            let requestedByName = "Hệ thống";
            
            try {
              detailedAction = await apiClient.machineActionConfirmation.getById(action.id);
              requestedByName = detailedAction?.requestedByName || 
                               detailedAction?.assigneeName || 
                               action.mechanicName || 
                               "Hệ thống";
            } catch (detailError) {
              console.warn(`⚠️ Could not fetch detailed machine action for ${action.id}:`, detailError);
              requestedByName = action.mechanicName || action.assigneeName || "Hệ thống";
            }
            
            // ✅ Enhanced location determination for machine actions
            let actionLocation = "Kho"; // Default
            if (action.department && action.position) {
              actionLocation = `${action.department} - ${action.position}`;
            } else if (action.actionType?.toLowerCase() === 'stockin' || action.actionType?.toLowerCase() === 'stockout') {
              actionLocation = "Kho";
            }
            
            events.push({
              id: action.id || `machine-${action.actionType}-${Date.now()}`,
              date: detailedAction?.completedDate || 
                    action.createdDate || 
                    action.actionDate || 
                    detailedAction?.startDate || 
                    new Date().toISOString(),
              eventType: action.actionType?.toUpperCase() === 'STOCKIN' ? 'WAREHOUSE_IMPORT' : 
                        action.actionType?.toUpperCase() === 'STOCKOUT' ? 'WAREHOUSE_EXPORT' :
                        action.actionType?.toUpperCase() === 'INSTALLATION' ? 'INSTALLATION' : 'UNINSTALLATION',
              actionLabel: translateActionType(action.actionType || 'Hoạt động'),
              description: detailedAction?.reason || action.description || `${translateActionType(action.actionType)} thiết bị`,
              status: 'COMPLETED',
              assigneeName: requestedByName,
              requestedBy: requestedByName,
              source: 'MACHINE_ACTION',
              location: actionLocation,
              notes: detailedAction?.notes || action.notes,
            });
            
            console.log(`➕ Added completed machine action event for ${deviceCode} by ${requestedByName}`);
          }
        }
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch machine actions:", error);
    }
    
    return events;
  };

  // ✅ Map task data to meaningful device lifecycle event with location context
  const mapTaskToLifecycleEvent = (task: any, requestCode: string): DeviceLogEvent | null => {
    const taskDate = task.startTime || task.createdDate || task.expectedTime;
    const isCompleted = task.status?.toLowerCase() === 'completed' || task.status?.toLowerCase() === 'done';
    const isPending = task.status?.toLowerCase() === 'pending' || task.status?.toLowerCase() === 'waiting';
    const isInProgress = task.status?.toLowerCase() === 'inprogress' || task.status?.toLowerCase() === 'active';
    
    let eventType: DeviceLogEvent['eventType'];
    let actionLabel: string;
    let description: string;
    let status: DeviceLogEvent['status'];
    let location: string;

    // ✅ Map task types with location context
    switch (task.taskType?.toLowerCase()) {
      case 'installation':
        eventType = 'INSTALLATION';
        actionLabel = 'Lắp đặt thiết bị';
        description = `Lắp đặt thiết bị vào hệ thống sản xuất`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = getDeviceLocationFromContext(task);
        break;
        
      case 'uninstallation':
        eventType = 'UNINSTALLATION';
        actionLabel = 'Tháo dỡ thiết bị';
        description = `Tháo dỡ thiết bị khỏi hệ thống sản xuất`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = getDeviceLocationFromContext(task);
        break;
        
      case 'repair':
        eventType = 'REPAIR';
        actionLabel = 'Sửa chữa thiết bị';
        description = `Thực hiện sửa chữa thiết bị`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = getDeviceLocationFromContext(task);
        break;
        
      case 'warranty':
      case 'warrantysubmission':
        eventType = 'WARRANTY_SEND';
        actionLabel = 'Gửi bảo hành';
        description = `Xuất thiết bị khỏi kho để gửi bảo hành`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = "Nhà bảo hành";
        break;
        
      case 'warrantyreturn':
        eventType = 'WARRANTY_RETURN';
        actionLabel = 'Trả về từ bảo hành';
        description = `Nhập thiết bị về kho sau khi bảo hành`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = "Kho";
        break;
        
      case 'stockin':
        eventType = 'WAREHOUSE_IMPORT';
        actionLabel = 'Nhập kho';
        description = `Nhập thiết bị vào kho`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = "Kho";
        break;
        
      case 'stockout':
        eventType = 'WAREHOUSE_EXPORT';
        actionLabel = 'Xuất kho';
        description = `Xuất thiết bị khỏi kho`;
        status = isCompleted ? 'COMPLETED' : isInProgress ? 'INPROGRESS' : isPending ? 'PENDING' : 'FAILED';
        location = "Kho";
        break;
        
      default:
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
      source: 'TASK',
      location,
    };
  };

  // ✅ Load device history when component mounts
  useEffect(() => {
    if (deviceId && deviceCode) {
      fetchDeviceHistory();
    }
  }, [deviceId, deviceCode, deviceName]);

  // ✅ Date formatting functions (unchanged)
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh"
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
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch (error) {
      console.warn("Time formatting error:", error);
      return "N/A";
    }
  };

  const formatExactTimestamp = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      
      return date.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh"
      });
    } catch (error) {
      console.warn("Exact timestamp formatting error:", error);
      return "N/A";
    }
  };

  const getVietnameseRelativeTime = (dateString: string) => {
    if (!dateString) return "Không rõ";
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Không rõ";
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);
      
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

  // ✅ Enhanced getEventIcon (removed DEVICE_INSTALLATION)
  const getEventIcon = (eventType: DeviceLogEvent['eventType']) => {
    switch (eventType) {
      case 'DEVICE_REMOVAL':
        return <Minus className="h-4 w-4 text-red-600" />;
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
      {/* Current Location Summary */}
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
                  {currentLocation.area === "Kho" && currentLocation.zone === "Kho" && currentLocation.position === "Kho" 
                    ? "Kho" 
                    : currentLocation.area === "Nhà bảo hành" 
                    ? "Nhà bảo hành"
                    : `${currentLocation.area} - ${currentLocation.zone} - ${currentLocation.position}`
                  }
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
              <div>
                <Label className="text-xs text-muted-foreground">Cập nhật lần cuối</Label>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">
                      {formatExactTimestamp(currentLocation.lastUpdated)}
                    </span>
                  </div>
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

      {/* Activity Summary */}
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
                {deviceLogs.filter(e => e.eventType === 'INSTALLATION' || e.eventType === 'UNINSTALLATION' || e.eventType === 'DEVICE_REMOVAL').length}
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

      {/* Timeline */}
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

          {/* ✅ Event timeline with unified installation logs */}
          <div className="space-y-3">
            {deviceLogs.map((event, index) => (
              <Card 
                key={event.id} 
                className={`border-l-4 ${
                  event.eventType === 'INSTALLATION'
                    ? 'border-l-green-600 bg-green-50/50 dark:bg-green-900/10' 
                    : event.eventType === 'DEVICE_REMOVAL'
                    ? 'border-l-red-600 bg-red-50/50 dark:bg-red-900/10'
                    : event.eventType === 'WAREHOUSE_IMPORT'
                    ? 'border-l-cyan-600 bg-cyan-50/50 dark:bg-cyan-900/10'
                    : 'border-l-blue-500'
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
                        
                        {/* ✅ Enhanced details with unified information */}
                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          {(event.assigneeName || event.requestedBy) && (
                            <span>Thực hiện bởi: <span className="font-medium text-foreground">{event.assigneeName || event.requestedBy}</span></span>
                          )}
                          {event.location && (
                            <span>Địa điểm: <span className="font-medium text-foreground">{event.location}</span></span>
                          )}
                          {event.replacedDeviceCode && (
                            <span>Thay thế bằng: <span className="font-medium text-foreground">{event.replacedDeviceCode}</span></span>
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
                    
                    {/* Status badge display (hidden for machine actions) */}
                    {/* {event.source !== 'MACHINE_ACTION' && (
                      <div className="flex flex-col gap-2 items-end">
                        <Badge variant="outline" className={getStatusBadgeVariant(event.status)}>
                          {translateTaskStatus(event.status)}
                        </Badge>
                      </div>
                    )} */}
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