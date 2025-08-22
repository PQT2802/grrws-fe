"use client"

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Calendar,
  Tag,
  Clock,
  Factory,
  Settings,
  Image as ImageIcon,
  DollarSign,
  Shield,
  ShieldCheck,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  History,
  Send,
  Download,
  User,
  StickyNote,
  Truck,
  QrCode,
  Wrench,
  Package,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Timer,
  Activity
} from "lucide-react"
import { DEVICE_WEB } from "@/types/device.type"
import { WarrantyInfo, WARRANTY_HISTORY_LIST } from "@/types/warranty.type"
import { apiClient } from "@/lib/api-client"
import QRCodeSection from "@/components/QRCodeCpn/QRCodeSection"
import { translateTaskStatus, translateTaskType } from "@/utils/textTypeTask"

interface DeviceDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    device: DEVICE_WEB | null
}

// ✅ NEW: Streamlined interface for device history timeline
interface DeviceHistoryRequest {
    id: string
    requestCode: string
    requestDate: string
    requesterName: string
    status: string
    actions: DeviceAction[]
}

interface DeviceAction {
    id: string
    type: string
    displayLabel: string
    date: string
    status: string
    assigneeName: string // ✅ Added assigneeName field
}

export default function DeviceDetailModal({
    open,
    onOpenChange,
    device
}: DeviceDetailModalProps) {
    const [warranties, setWarranties] = useState<WarrantyInfo[]>([])
    const [warrantyHistory, setWarrantyHistory] = useState<WARRANTY_HISTORY_LIST[]>([])
    const [isLoadingWarranties, setIsLoadingWarranties] = useState(false)
    const [isLoadingWarrantyHistory, setIsLoadingWarrantyHistory] = useState(false)
    const [showOtherWarranties, setShowOtherWarranties] = useState(false)
    
    // ✅ NEW: Streamlined device history state
    const [deviceHistory, setDeviceHistory] = useState<DeviceHistoryRequest[]>([])
    const [isLoadingDeviceHistory, setIsLoadingDeviceHistory] = useState(false)

    // Clean up any potential body style issues when component unmounts
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [open])

    // Additional cleanup when modal closes
    useEffect(() => {
        if (!open && typeof document !== 'undefined') {
            const timeoutId = setTimeout(() => {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }, 100)

            return () => clearTimeout(timeoutId)
        }
    }, [open])

    // Fetch warranties, warranty history, and device history when device changes
    useEffect(() => {
        if (open && device?.id) {
            fetchWarranties(device.id)
            fetchWarrantyHistory(device.id)
            fetchDeviceHistory(device.id)
        } else {
            setWarranties([])
            setWarrantyHistory([])
            setDeviceHistory([])
        }
    }, [open, device?.id])

    const fetchWarranties = async (deviceId: string) => {
        setIsLoadingWarranties(true)
        try {
            console.log(`🔄 Đang tải bảo hành cho thiết bị: ${deviceId}`)
            const response = await apiClient.warranty.getDeviceWarranties(deviceId)
            console.log("📋 Phản hồi bảo hành:", response)
            setWarranties(response || [])
        } catch (error) {
            console.error("❌ Lỗi khi tải bảo hành:", error)
            setWarranties([])
        } finally {
            setIsLoadingWarranties(false)
        }
    }

    const fetchWarrantyHistory = async (deviceId: string) => {
        setIsLoadingWarrantyHistory(true)
        try {
            console.log(`🔄 Đang tải lịch sử bảo hành cho thiết bị: ${deviceId}`)
            const response = await apiClient.warranty.getWarrantyHistory(deviceId)
            console.log("📋 Phản hồi lịch sử bảo hành:", response)

            // Sort by sendDate descending (latest first)
            const sortedHistory = (response || []).sort((a, b) => {
                if (!a.sendDate && !b.sendDate) return 0
                if (!a.sendDate) return 1
                if (!b.sendDate) return -1
                return new Date(b.sendDate).getTime() - new Date(a.sendDate).getTime()
            })

            setWarrantyHistory(sortedHistory)
        } catch (error) {
            console.error("❌ Lỗi khi tải lịch sử bảo hành:", error)
            setWarrantyHistory([])
        } finally {
            setIsLoadingWarrantyHistory(false)
        }
    }

    // ✅ FIXED: Updated fetchDeviceHistory to handle the correct API response structure
    const fetchDeviceHistory = async (deviceId: string) => {
        setIsLoadingDeviceHistory(true)
        setDeviceHistory([])
        
        try {
            console.log(`🔄 Fetching device history for: ${deviceId}`)
            
            // Step 1: Get all requests for this device
            let requests = []
            try {
                const requestsResponse = await apiClient.request.getRequestByDeviceId(deviceId)
                console.log("📋 Requests response:", requestsResponse)
                
                // Handle different response structures
                if (requestsResponse?.data) {
                    if (Array.isArray(requestsResponse.data)) {
                        requests = requestsResponse.data
                    } else if (requestsResponse.data.data && Array.isArray(requestsResponse.data.data)) {
                        requests = requestsResponse.data.data
                    } else if (requestsResponse.data.items && Array.isArray(requestsResponse.data.items)) {
                        requests = requestsResponse.data.items
                    } else {
                        requests = [requestsResponse.data]
                    }
                } else if (Array.isArray(requestsResponse)) {
                    requests = requestsResponse
                } else if (requestsResponse && typeof requestsResponse === 'object') {
                    requests = [requestsResponse]
                } else if (requestsResponse?.items && Array.isArray(requestsResponse.items)) {
                    requests = requestsResponse.items
                }
                
                if (requests.length === 0) {
                    console.log("ℹ️ No requests found for this device")
                    return
                }
            } catch (error) {
                console.error("❌ Error fetching requests:", error)
                return
            }
            
            // Step 2: Process each request to build timeline
            const historyRequests: DeviceHistoryRequest[] = []
            
            for (const request of requests) {
                const requestId = request.id || request.requestId || request.Id || request.requestID
                const requestCode = request.requestCode || request.code || request.Code || request.confirmationCode || request.requestNumber || request.requestTitle || `REQ-${requestId.slice(0, 8)}`
                const requestDate = request.createdDate || request.startDate || request.requestDate || new Date().toISOString()
                const status = request.status || "Unknown"
                
                // ✅ Get requester name by fetching user details
                let requesterName = "Unknown"
                if (request.createdBy) {
                    try {
                        const userResponse = await apiClient.user.getUserById(request.createdBy)
                        if (userResponse && userResponse.fullName) {
                            requesterName = userResponse.fullName
                        }
                    } catch (error) {
                        console.warn(`⚠️ Could not fetch user details for ${request.createdBy}`)
                        // Fallback to other fields if available
                        requesterName = request.assigneeName || request.requestedBy || request.assignee || "Unknown"
                    }
                } else {
                    // Fallback to other available name fields
                    requesterName = request.assigneeName || request.requestedBy || request.assignee || "Unknown"
                }
                
                // ✅ Get tasks for this request and build action timeline
                const actions: DeviceAction[] = []
                
                try {
                    console.log(`🔄 Fetching tasks for request: ${requestId}`)
                    const tasksResponse = await apiClient.task.getTaskGroups(requestId, 1, 100)
                    console.log(`📋 Full tasks response for request ${requestId}:`, tasksResponse)
                    
                    let taskGroups = []
                    if (tasksResponse?.data?.data) {
                        taskGroups = tasksResponse.data.data
                    } else if (tasksResponse?.data?.items) {
                        taskGroups = tasksResponse.data.items
                    } else if (tasksResponse?.data) {
                        taskGroups = Array.isArray(tasksResponse.data) ? tasksResponse.data : [tasksResponse.data]
                    } else if (Array.isArray(tasksResponse)) {
                        taskGroups = tasksResponse
                    } else if (tasksResponse?.items) {
                        taskGroups = tasksResponse.items
                    }
                    
                    console.log(`📊 Found ${taskGroups.length} task groups for request ${requestId}:`, taskGroups)
                    
                    // ✅ UPDATED: Process task groups with new structure
                    if (taskGroups.length > 0) {
                        for (const taskGroup of taskGroups) {
                            console.log(`🔄 Processing task group:`, taskGroup)
                            
                            // ✅ NEW: Handle the flat tasks array structure
                            if (taskGroup.tasks && Array.isArray(taskGroup.tasks)) {
                                console.log(`Found ${taskGroup.tasks.length} tasks in group`)
                                
                                for (const task of taskGroup.tasks) {
                                    console.log(`Processing task:`, task)
                                    
                                    // ✅ Map taskType to display labels
                                    let displayLabel = "";
                                    switch (task.taskType?.toLowerCase()) {
                                        case "repair":
                                            displayLabel = "Ngày sửa máy";
                                            break;
                                        case "installation":
                                            displayLabel = "Ngày lắp máy";
                                            break;
                                        case "uninstallation":
                                            displayLabel = "Ngày tháo máy";
                                            break;
                                        case "warranty":
                                            displayLabel = "Ngày bảo hành máy";
                                            break;
                                        case "warrantyreturn":
                                            displayLabel = "Ngày trả bảo hành";
                                            break;
                                        case "stockin":
                                            displayLabel = "Ngày trả kho";
                                            break;
                                        default:
                                            displayLabel = `Ngày ${task.taskType || 'hoạt động'}`;
                                    }
                                    
                                    // ✅ UPDATED: Use startTime as the primary date field
                                    const taskDate = task.startTime || task.createdDate || task.endTime || task.expectedTime
                                    
                                    if (taskDate) {
                                        const action = {
                                            id: task.taskId || `task-${task.taskType}-${actions.length}`,
                                            type: task.taskType?.toLowerCase() || "unknown",
                                            displayLabel: displayLabel,
                                            date: taskDate,
                                            status: task.status || "Unknown",
                                            assigneeName: task.assigneeName || "Unknown" // ✅ Added assigneeName
                                        };
                                        
                                        actions.push(action);
                                        console.log(`➕ Added action:`, action);
                                    }
                                }
                            }
                            
                            // ✅ LEGACY: Keep the old structure handling as fallback
                            else {
                                console.log(`Using legacy task structure for group:`, taskGroup);
                                
                                const taskTypeMap = [
                                    { key: 'repairTasks', type: 'repair', label: 'Ngày sửa máy' },
                                    { key: 'uninstallTasks', type: 'uninstallation', label: 'Ngày tháo máy' },
                                    { key: 'installTasks', type: 'installation', label: 'Ngày lắp máy' },
                                    { key: 'warrantyTasks', type: 'warranty', label: 'Ngày bảo hành máy' },
                                    { key: 'warrantyReturnTasks', type: 'warrantyreturn', label: 'Ngày trả bảo hành' },
                                    { key: 'storageReturnTasks', type: 'stockin', label: 'Ngày trả kho' }
                                ]
                                
                                for (const { key, type, label } of taskTypeMap) {
                                    const tasks = taskGroup[key]
                                    if (tasks && Array.isArray(tasks) && tasks.length > 0) {
                                        for (const task of tasks) {
                                            const taskDate = task.startTime || task.createdDate || task.startDate || task.completedDate || task.expectedStartDate
                                            
                                            if (taskDate) {
                                                actions.push({
                                                    id: task.id || `task-${type}-${actions.length}`,
                                                    type,
                                                    displayLabel: label,
                                                    date: taskDate,
                                                    status: task.status || "Unknown",
                                                    assigneeName: task.assigneeName || "Unknown"
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    // ✅ Sort actions chronologically (earliest → latest as specified)
                    actions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    console.log(`📊 Final actions for request ${requestId}:`, actions)
                    
                } catch (error) {
                    console.warn(`⚠️ Could not fetch tasks for request ${requestId}:`, error)
                    // Continue processing other requests even if this one fails
                }
                
                // ✅ Add request to history
                const historyRequest = {
                    id: requestId,
                    requestCode,
                    requestDate,
                    requesterName,
                    status,
                    actions
                };
                
                historyRequests.push(historyRequest);
                console.log(`➕ Added request to history:`, historyRequest);
            }
            
            // ✅ Sort requests by date (earliest first)
            historyRequests.sort((a, b) => 
                new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()
            )
            
            console.log(`📊 Final device history (${historyRequests.length} requests):`, historyRequests)
            setDeviceHistory(historyRequests)
            
        } catch (error) {
            console.error("❌ Error in fetchDeviceHistory:", error)
        } finally {
            setIsLoadingDeviceHistory(false)
        }
    }

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        })
    }

    const formatDateTime = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const formatCurrency = (amount: number | null | undefined) => {
        if (!amount && amount !== 0) return "N/A"
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount).replace(/\s/g, '') 
    }

    // ✅ Vietnamese status translations using textTypeTask pattern
    const getStatusDisplayText = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "Hoạt động"
            case "inactive":
                return "Không hoạt động"
            case "inuse":
                return "Đang sử dụng"
            case "inrepair":
                return "Đang sửa chữa"
            case "inwarranty":
                return "Đang bảo hành"
            case "decommissioned":
                return "Ngừng sử dụng"
            default:
                return status
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "inactive":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            case "inuse":
                return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
            case "inrepair":
                return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400"
            case "inwarranty":
                return "bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-400"
            case "decommissioned":
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    const getWarrantyBadgeVariant = (isUnderWarranty: boolean) => {
        return isUnderWarranty
            ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
    }

    const getWarrantyTypeBadgeVariant = (warrantyType: string) => {
        switch (warrantyType?.toLowerCase()) {
            case "manufacturer":
                return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
            case "extended":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "third party":
                return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    const getWarrantyStatusBadgeVariant = (warrantyStatus: string) => {
        switch (warrantyStatus?.toLowerCase()) {
            case "inused":
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "completed":
            case "expired":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            case "pending":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    const getHistoryStatusBadgeVariant = (status: boolean) => {
        return status
            ? "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
    }

    const getDaysRemainingVariant = (daysRemaining: number, lowDayWarning: boolean) => {
        if (lowDayWarning || daysRemaining <= 30) {
            return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
        } else if (daysRemaining <= 90) {
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
        }
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
    }

    // ✅ Get badge variant for task status
    const getTaskStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case "completed":
            case "done":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "inprogress":
            case "active":
                return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
            case "pending":
            case "waiting":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
            case "cancelled":
            case "failed":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen)

        if (!newOpen && typeof document !== 'undefined') {
            document.body.style.pointerEvents = 'auto'
            document.body.style.overflow = 'auto'
        }
    }

    if (!device) return null

    // Separate warranties by type
    const manufacturerWarranties = warranties.filter(w => w.warrantyType?.toLowerCase() === "manufacturer")
    const otherWarranties = warranties.filter(w => w.warrantyType?.toLowerCase() !== "manufacturer")

    return (
        <Dialog
            open={open}
            onOpenChange={handleOpenChange}
            modal={true}
        >
            <DialogContent
                className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto"
                onEscapeKeyDown={() => handleOpenChange(false)}
                onPointerDownOutside={() => handleOpenChange(false)}
            >
                <DialogHeader>
                    <DialogTitle>Thông tin chi tiết thiết bị</DialogTitle>
                    <DialogDescription>
                        Xem thông tin thiết bị, thông số kỹ thuật, chi tiết bảo hành, mã QR và lịch sử dịch vụ
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold">{device.deviceName}</h3>
                        <div className="flex gap-2">
                            <Badge variant="outline" className={`${getStatusBadgeVariant(device.status)} border-0`}>
                                {getStatusDisplayText(device.status)}
                            </Badge>
                            <Badge variant="outline" className={`${getWarrantyBadgeVariant(device.isUnderWarranty)} border-0`}>
                                {device.isUnderWarranty ? "Còn bảo hành" : "Hết bảo hành"}
                            </Badge>
                        </div>
                    </div>

                    <Tabs defaultValue="details">
                        <TabsList className="grid w-full grid-cols-5">
                            <TabsTrigger value="details">Thông tin thiết bị</TabsTrigger>
                            <TabsTrigger value="qrcode">Mã QR</TabsTrigger>
                            <TabsTrigger value="warranty">Phiếu bảo hành</TabsTrigger>
                            <TabsTrigger value="warranty-history">Lịch sử bảo hành</TabsTrigger>
                            <TabsTrigger value="device-history">Lịch sử</TabsTrigger>
                        </TabsList>

                        {/* Device Details Tab */}
                        <TabsContent value="details" className="space-y-4">
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Mã thiết bị</Label>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.deviceCode}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Số seri</Label>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.serialNumber || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Mẫu</Label>
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.model || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Nhà sản xuất</Label>
                                    <div className="flex items-center gap-2">
                                        <Factory className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.manufacturer || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Giá mua</Label>
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span>
                                            {device.purchasePrice ?
                                                formatCurrency(device.purchasePrice) :
                                                "N/A"}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Nhà cung cấp</Label>
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.supplier || "N/A"}</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Ngày sản xuất</Label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(device.manufactureDate)}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Ngày lắp đặt</Label>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span>{formatDate(device.installationDate)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Mô tả</Label>
                                <div className="text-sm font-medium mt-1">
                                    {device.description || "N/A"}
                                </div>
                            </div>

                            {/* Specifications */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Thông số kỹ thuật</Label>
                                <div className="text-sm font-medium mt-1">
                                    {device.specifications || "N/A"}
                                </div>
                            </div>

                            {/* Photo URL */}
                            {device.photoUrl && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">URL ảnh</Label>
                                    <div className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                        <a
                                            href={device.photoUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline truncate max-w-xs text-sm"
                                        >
                                            {device.photoUrl}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </TabsContent>

                        {/* QR CODE TAB */}
                        <TabsContent value="qrcode" className="space-y-4">
                            <QRCodeSection
                                deviceId={device.id}
                                deviceName={device.deviceName}
                                deviceCode={device.deviceCode}
                                size={200}
                                showDownload={true}
                                showCopy={true}
                                collapsible={false}
                                className="border-0 shadow-none bg-transparent"
                            />
                            
                            {/* Additional QR Code Info */}
                            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <QrCode className="h-4 w-4 text-blue-600" />
                                        Thông tin mã QR
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Loại nội dung QR</Label>
                                            <p className="text-sm font-medium">ID thiết bị (GUID)</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Cấp độ sửa lỗi</Label>
                                            <p className="text-sm font-medium">Trung bình (M)</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Mục đích</Label>
                                            <p className="text-sm font-medium">Nhận diện & Theo dõi thiết bị</p>
                                        </div>
                                        <div>
                                            <Label className="text-xs text-muted-foreground">Định dạng</Label>
                                            <p className="text-sm font-medium">PNG (Có thể tải xuống)</p>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                            <strong>Mẹo:</strong> Sử dụng mã QR này cho quản lý hàng tồn kho, tìm kiếm thiết bị, hoặc liên kết đến chi tiết thiết bị. 
                                            Mã QR chứa ID thiết bị duy nhất có thể quét để nhanh chóng nhận diện và truy cập thông tin thiết bị này.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* WARRANTY TAB - Keep existing implementation */}
                        <TabsContent value="warranty" className="space-y-4">
                            {isLoadingWarranties ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span className="ml-2">Đang tải bảo hành...</span>
                                    </CardContent>
                                </Card>
                            ) : warranties.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            Không có thông tin bảo hành
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Thiết bị này hiện không có hồ sơ bảo hành nào.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    {/* Primary Manufacturer Warranties */}
                                    {manufacturerWarranties.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <ShieldCheck className="h-5 w-5 text-blue-600" />
                                                <h4 className="text-lg font-semibold">Phiếu bảo hành thiết bị</h4>
                                            </div>
                                            {manufacturerWarranties.map((warranty) => (
                                                <Card key={warranty.id} className="border-blue-200 bg-blue-50/50 dark:bg-blue-900/10">
                                                    <CardHeader className="pb-3">
                                                        <div className="flex items-start justify-between">
                                                            <div className="space-y-1">
                                                                <CardTitle className="text-base flex items-center gap-2">
                                                                    <span>{warranty.warrantyCode}</span>
                                                                    <Badge className={getWarrantyTypeBadgeVariant(warranty.warrantyType)}>
                                                                        {warranty.warrantyType}
                                                                    </Badge>
                                                                </CardTitle>
                                                                <p className="text-sm text-muted-foreground">
                                                                    {warranty.warrantyReason}
                                                                </p>
                                                            </div>
                                                            <div className="flex flex-col gap-2 items-end">
                                                                <Badge className={getWarrantyStatusBadgeVariant(warranty.warrantyStatus)}>
                                                                    {translateTaskStatus(warranty.warrantyStatus)}
                                                                </Badge>
                                                                {warranty.daysRemaining >= 0 && (
                                                                    <Badge className={getDaysRemainingVariant(warranty.daysRemaining, warranty.lowDayWarning)}>
                                                                        {warranty.daysRemaining === 0 ? "Hết hạn hôm nay" :
                                                                            warranty.daysRemaining === 1 ? "Còn 1 ngày" :
                                                                                `Còn ${warranty.daysRemaining} ngày`}
                                                                    </Badge>
                                                                )}
                                                                {warranty.lowDayWarning && (
                                                                    <div className="flex items-center gap-1 text-red-600">
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                        <span className="text-xs">Sắp hết hạn</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Nhà cung cấp</Label>
                                                                    <p className="text-sm font-medium">{warranty.provider}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Ngày bắt đầu</Label>
                                                                    <p className="text-sm">{formatDate(warranty.warrantyStartDate)}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Ngày kết thúc</Label>
                                                                    <p className="text-sm">{formatDate(warranty.warrantyEndDate)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Chi phí</Label>
                                                                    <p className="text-sm font-medium">{formatCurrency(warranty.cost)}</p>
                                                                </div>
                                                                {warranty.documentUrl && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Tài liệu</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                className="h-auto p-0 text-blue-600"
                                                                                onClick={() => window.open(warranty.documentUrl, '_blank')}
                                                                            >
                                                                                <FileText className="h-3 w-3 mr-1" />
                                                                                Xem tài liệu
                                                                                <ExternalLink className="h-3 w-3 ml-1" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {warranty.notes && (
                                                            <div className="mt-3 pt-3 border-t">
                                                                <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                                                                <p className="text-sm mt-1">{warranty.notes}</p>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    )}

                                    {/* Other Warranties (Extended, Third Party, etc.) */}
                                    {otherWarranties.length > 0 && (
                                        <Collapsible open={showOtherWarranties} onOpenChange={setShowOtherWarranties}>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="outline" className="w-full justify-between">
                                                    <span className="flex items-center gap-2">
                                                        <Shield className="h-4 w-4" />
                                                        Bảo hành bổ sung ({otherWarranties.length})
                                                    </span>
                                                    {showOtherWarranties ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="space-y-3 mt-4">
                                                {otherWarranties.map((warranty) => (
                                                    <Card key={warranty.id} className="border-gray-200">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-1">
                                                                    <CardTitle className="text-base flex items-center gap-2">
                                                                        <span>{warranty.warrantyCode}</span>
                                                                        <Badge className={getWarrantyTypeBadgeVariant(warranty.warrantyType)}>
                                                                            {warranty.warrantyType}
                                                                        </Badge>
                                                                    </CardTitle>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {warranty.warrantyReason}
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col gap-2 items-end">
                                                                    <Badge className={getWarrantyStatusBadgeVariant(warranty.warrantyStatus)}>
                                                                        {translateTaskStatus(warranty.warrantyStatus)}
                                                                    </Badge>
                                                                    {warranty.daysRemaining >= 0 && (
                                                                        <Badge className={getDaysRemainingVariant(warranty.daysRemaining, warranty.lowDayWarning)}>
                                                                            {warranty.daysRemaining === 0 ? "Hết hạn hôm nay" :
                                                                                warranty.daysRemaining === 1 ? "Còn 1 ngày" :
                                                                                    `Còn ${warranty.daysRemaining} ngày`}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Nhà cung cấp</Label>
                                                                        <p className="text-sm font-medium">{warranty.provider}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Ngày bắt đầu</Label>
                                                                        <p className="text-sm">{formatDate(warranty.warrantyStartDate)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Ngày kết thúc</Label>
                                                                        <p className="text-sm">{formatDate(warranty.warrantyEndDate)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Chi phí</Label>
                                                                        <p className="text-sm font-medium">{formatCurrency(warranty.cost)}</p>
                                                                    </div>
                                                                    {warranty.documentUrl && (
                                                                        <div>
                                                                            <Label className="text-xs text-muted-foreground">Tài liệu</Label>
                                                                            <div className="flex items-center gap-1">
                                                                                <Button
                                                                                    variant="link"
                                                                                    size="sm"
                                                                                    className="h-auto p-0 text-blue-600"
                                                                                    onClick={() => window.open(warranty.documentUrl, '_blank')}
                                                                                >
                                                                                    <FileText className="h-3 w-3 mr-1" />
                                                                                    Xem tài liệu
                                                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {warranty.notes && (
                                                                <div className="mt-3 pt-3 border-t">
                                                                    <Label className="text-xs text-muted-foreground">Ghi chú</Label>
                                                                    <p className="text-sm mt-1">{warranty.notes}</p>
                                                                </div>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        {/* WARRANTY HISTORY TAB - Keep existing implementation */}
                        <TabsContent value="warranty-history" className="space-y-4">
                            {isLoadingWarrantyHistory ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span className="ml-2">Đang tải lịch sử bảo hành...</span>
                                    </CardContent>
                                </Card>
                            ) : warrantyHistory.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <History className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            Không có lịch sử bảo hành
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Thiết bị này không có lịch sử bảo hành.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <History className="h-5 w-5 text-blue-600" />
                                        <h4 className="text-lg font-semibold">Lịch sử dịch vụ bảo hành</h4>
                                        <Badge variant="secondary" className="ml-2">
                                            {warrantyHistory.length} bản ghi
                                        </Badge>
                                    </div>

                                    {warrantyHistory.map((historyItem, index) => (
                                        <Card key={index} className="border-l-4 border-l-blue-500">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-1">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            {/* <span>Service Record #{index + 1}</span> */}
                                                            <span>Ghi nhận bảo hành</span>
                                                            <Badge className={getHistoryStatusBadgeVariant(historyItem.status)}>
                                                                {historyItem.status ? "Hoàn thành" : "Đang tiến hành"}
                                                            </Badge>
                                                        </CardTitle>
                                                        {historyItem.deviceDescription && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {historyItem.deviceDescription}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Send className="h-3 w-3" />
                                                                Ngày gửi bảo hành
                                                            </Label>
                                                            <p className="text-sm font-medium mt-1">
                                                                {formatDateTime(historyItem.sendDate)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Download className="h-3 w-3" />
                                                                Ngày nhận lại thiết bị
                                                            </Label>
                                                            <p className="text-sm font-medium mt-1">
                                                                {formatDateTime(historyItem.receiveDate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-3">
                                                        <div>
                                                            <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <User className="h-3 w-3" />
                                                                Đơn vị thực hiện bảo hành
                                                            </Label>
                                                            <p className="text-sm font-medium mt-1">
                                                                {historyItem.provider || "N/A"}
                                                            </p>
                                                        </div>
                                                        {historyItem.note && (
                                                            <div>
                                                                <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                                                    <StickyNote className="h-3 w-3" />
                                                                    Ghi chú
                                                                </Label>
                                                                <p className="text-sm font-medium mt-1">
                                                                    {historyItem.note}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Duration calculation if both dates are available */}
                                                {historyItem.sendDate && historyItem.receiveDate && (
                                                    <div className="mt-3 pt-3 border-t">
                                                        <Label className="text-xs text-muted-foreground">Thời gian bảo hành</Label>
                                                        <p className="text-sm font-medium">
                                                            {(() => {
                                                                const sendDate = new Date(historyItem.sendDate)
                                                                const receiveDate = new Date(historyItem.receiveDate)
                                                                const diffTime = Math.abs(receiveDate.getTime() - sendDate.getTime())
                                                                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                                                                return `${diffDays} ngày`
                                                            })()}
                                                        </p>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        {/* ✅ STREAMLINED: DEVICE HISTORY TAB */}
                        <TabsContent value="device-history" className="space-y-4">
                            {isLoadingDeviceHistory ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center p-6">
                                        <Loader2 className="h-8 w-8 animate-spin mr-2" />
                                        <p>Đang tải lịch sử thiết bị...</p>
                                    </CardContent>
                                </Card>
                            ) : deviceHistory.length === 0 ? (
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
                                    {/* Summary Statistics */}
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Tổng quan hoạt động</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <span className="text-muted-foreground">Yêu cầu</span>
                                                    <p className="font-medium">{deviceHistory.length}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Sửa chữa</span>
                                                    <p className="font-medium">
                                                        {deviceHistory.reduce((count, req) => 
                                                            count + req.actions.filter(a => a.type === 'repair').length, 0
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Bảo hành</span>
                                                    <p className="font-medium">
                                                        {deviceHistory.reduce((count, req) => 
                                                            count + req.actions.filter(a => a.type === 'warranty').length, 0
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Lắp/Tháo</span>
                                                    <p className="font-medium">
                                                        {deviceHistory.reduce((count, req) => 
                                                            count + req.actions.filter(a => 
                                                                a.type === 'installation' || a.type === 'uninstallation'
                                                            ).length, 0
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* ✅ STREAMLINED: Request Timeline with Action Timeline */}
                                    <div className="space-y-4">
                                        {deviceHistory.map((request) => (
                                            <Card key={request.id} className="overflow-hidden">
                                                {/* ✅ Request Header - Clean design with essential info only */}
                                                <CardHeader className="bg-muted/30 pb-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-5 w-5 text-blue-600" />
                                                            <div>
                                                                <h4 className="text-base font-medium">{request.requestCode}</h4>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDate(request.requestDate)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Badge variant="outline" className={getTaskStatusBadgeVariant(request.status)}>
                                                            {translateTaskStatus(request.status)}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        Người yêu cầu: <span className="font-medium text-foreground">{request.requesterName}</span>
                                                    </div>
                                                </CardHeader>

                                                {/* ✅ Action Timeline - Focus only on actions and dates */}
                                                <CardContent className="pt-3 pb-3">
                                                    {request.actions.length === 0 ? (
                                                        <div className="text-sm text-center text-muted-foreground py-2">
                                                            Không có hoạt động được ghi nhận
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-3">
                                                            {request.actions.map((action, index) => (
                                                                <div key={action.id} className="p-3 rounded-lg bg-muted/20 border border-muted/30">
                                                                    <div className="flex justify-between items-start">
                                                                        {/* ✅ Left side: Action info with enhanced formatting */}
                                                                        <div className="flex items-start gap-3 flex-1">
                                                                            <div className={`rounded-full h-3 w-3 mt-1 ${
                                                                                action.type === 'repair' ? 'bg-orange-500' :
                                                                                action.type === 'installation' ? 'bg-green-500' :
                                                                                action.type === 'uninstallation' ? 'bg-red-500' :
                                                                                action.type === 'warranty' ? 'bg-blue-500' :
                                                                                action.type === 'warrantyreturn' ? 'bg-purple-500' :
                                                                                'bg-gray-500'
                                                                            }`} />
                                                                            <div className="flex-1">
                                                                                {/* ✅ Enhanced action header with date and time */}
                                                                                <div className="flex items-center gap-2 mb-1">
                                                                                    <p className="text-sm font-medium">
                                                                                        {action.displayLabel}
                                                                                    </p>
                                                                                    <span className="text-muted-foreground">•</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatDateOnly(action.date)}
                                                                                    </span>
                                                                                    <span className="text-muted-foreground">•</span>
                                                                                    <span className="text-xs text-muted-foreground">
                                                                                        {formatTimeOnly(action.date)}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-1 text-muted-foreground">
                                                                                        <Clock className="h-3 w-3" />
                                                                                        <span className="text-xs">
                                                                                            {getTimeAgo(action.date)}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {/* ✅ Assignee information */}
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    Người thực hiện: <span className="font-medium text-foreground">{action.assigneeName}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        
                                                                        {/* ✅ Right side: Status badge */}
                                                                        <Badge variant="outline" className={getTaskStatusBadgeVariant(action.status)}>
                                                                            {translateTaskStatus(action.status)}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ✅ NEW: Helper function to calculate time ago
const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const taskDate = new Date(dateString)
    const diffMs = now.getTime() - taskDate.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    
    if (diffDays > 1) {
        return "Trên 1 ngày"
    } else if (diffDays === 1) {
        return "1 ngày trước"
    } else if (diffHours > 0) {
        return `${diffHours} giờ trước`
    } else if (diffMinutes > 0) {
        return `${diffMinutes} phút trước`
    } else {
        return "Vừa xong"
    }
}

// ✅ NEW: Helper function to format date only
const formatDateOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    })
}

// ✅ NEW: Helper function to format time only
const formatTimeOnly = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
    })
}