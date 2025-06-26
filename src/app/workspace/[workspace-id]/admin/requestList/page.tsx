"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Search,
    MoreHorizontal,
    Eye,
    Printer,
    Download,
    ChevronLeft,
    ChevronRight,
    Calendar,
    User,
    Loader2,
    Filter,
    AlertTriangle,
    CheckCircle,
    FileText,
    XCircle
} from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "react-toastify"
import { apiClient } from "@/lib/api-client"
import { REQUEST_WITH_REPORT } from "@/types/dashboard.type"
import RequestDetailModal from "@/components/ChartCpn/RequestChartCpn/RequestDetailModal"

type RequestStatus = "pending" | "approved" | "rejected" | "completed" | "all"
type RequestPriority = "low" | "medium" | "high" | "all"

interface RequestListItem {
    id: string
    requestTitle: string
    deviceName: string
    deviceCode: string
    status: string
    priority: string
    createdDate: string
    createdBy: string
    createdByName?: string
    hasReport: boolean
    issueCount: number
    zoneName?: string
    areaName?: string
    description: string
}

interface UserCache {
    [userId: string]: string
}

export default function RequestListPage() {
    // State management
    const [allRequests, setAllRequests] = useState<RequestListItem[]>([])
    const [filteredRequests, setFilteredRequests] = useState<RequestListItem[]>([])
    const [userCache, setUserCache] = useState<UserCache>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    
    // Filter and pagination states
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<RequestStatus>("all")
    const [filterPriority, setFilterPriority] = useState<RequestPriority>("all")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    
    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<REQUEST_WITH_REPORT | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    
    // Active tab
    const [activeTab, setActiveTab] = useState("all")
    
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    // Fetch requests data
    const fetchRequests = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            console.log("🔄 Fetching all requests data...")

            // For now, we'll use the requests with report endpoint and mock some additional data
            const response = await apiClient.dashboard.getRequestsWithReport()
            console.log("📦 Raw API response:", response)

            let requestsData: REQUEST_WITH_REPORT[]
            if (response.data) {
                requestsData = response.data
            } else if (Array.isArray(response)) {
                requestsData = response as any
            } else {
                throw new Error("Invalid response structure")
            }

            // Transform and add mock data for demonstration
            const transformedRequests: RequestListItem[] = [
                // Real requests with reports
                ...requestsData.map(req => ({
                    id: req.id,
                    requestTitle: req.requestTitle,
                    deviceName: req.deviceName,
                    deviceCode: req.deviceCode,
                    status: req.status,
                    priority: req.priority,
                    createdDate: req.createdDate,
                    createdBy: req.createdBy,
                    hasReport: true,
                    issueCount: req.issues.length,
                    zoneName: req.zoneName,
                    areaName: req.areaName,
                    description: req.description
                })),
                // Mock requests without reports
                ...Array.from({ length: 15 }, (_, i) => ({
                    id: `mock-${i + 1}`,
                    requestTitle: `Yêu cầu sửa chữa thiết bị ${i + 1}`,
                    deviceName: `Máy may công nghiệp ${i + 1}`,
                    deviceCode: `DEV${String(i + 1).padStart(3, "0")}`,
                    status: ["pending", "approved", "rejected", "completed"][i % 4],
                    priority: ["low", "medium", "high"][i % 3],
                    createdDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
                    createdBy: `user-${i + 1}`,
                    hasReport: false,
                    issueCount: Math.floor(Math.random() * 5) + 1,
                    zoneName: `Zone ${i % 3 + 1}`,
                    areaName: `Area ${String.fromCharCode(65 + (i % 5))}`,
                    description: `Mô tả chi tiết về vấn đề của thiết bị ${i + 1}. Cần được kiểm tra và sửa chữa.`
                }))
            ]

            // Sort by created date (newest first)
            const sortedRequests = transformedRequests.sort(
                (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
            )

            setAllRequests(sortedRequests)
            await fetchUserNames(sortedRequests)
            
            console.log("✅ Requests processed successfully")
        } catch (error: any) {
            console.error("❌ Error fetching requests:", error)
            setError(`Failed to load requests: ${error.message || 'Unknown error'}`)
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Fetch user names
    const fetchUserNames = async (requestsData: RequestListItem[]) => {
        const uniqueUserIds = [...new Set(requestsData.map(req => req.createdBy))]
        const newUserCache: UserCache = { ...userCache }
        
        for (const userId of uniqueUserIds) {
            if (!newUserCache[userId] && !userId.startsWith('user-')) {
                try {
                    const userResponse = await apiClient.user.getUserById(userId)
                    newUserCache[userId] = userResponse.data?.fullName || userResponse.fullName || 'Unknown User'
                } catch (error) {
                    console.error(`Failed to fetch user ${userId}:`, error)
                    newUserCache[userId] = 'Unknown User'
                }
            } else if (userId.startsWith('user-')) {
                // Mock user names
                newUserCache[userId] = `User ${userId.split('-')[1]}`
            }
        }
        
        setUserCache(newUserCache)
    }

    // Apply filters
    useEffect(() => {
        let filtered = [...allRequests]

        // Apply search filter
        if (debouncedSearchTerm) {
            filtered = filtered.filter(request =>
                request.requestTitle.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                request.deviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                request.deviceCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            )
        }

        // Apply status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter(request => request.status === filterStatus)
        }

        // Apply priority filter
        if (filterPriority !== "all") {
            filtered = filtered.filter(request => request.priority === filterPriority)
        }

        // Apply tab filter
        if (activeTab === "with-report") {
            filtered = filtered.filter(request => request.hasReport)
        } else if (activeTab === "without-report") {
            filtered = filtered.filter(request => !request.hasReport)
        }

        setFilteredRequests(filtered)
        setPage(1) // Reset to first page when filters change
    }, [allRequests, debouncedSearchTerm, filterStatus, filterPriority, activeTab])

    // Load data on component mount
    useEffect(() => {
        fetchRequests()
    }, [fetchRequests])

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / pageSize)
    const paginatedRequests = filteredRequests.slice(
        (page - 1) * pageSize,
        page * pageSize
    )

    // Utility functions
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        const vietnamTime = new Date(date.getTime() + (7 * 60 * 60 * 1000))
        
        return vietnamTime.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Ho_Chi_Minh'
        })
    }

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'high':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'low':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
            default:
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved':
            case 'completed':
                return <CheckCircle className="h-4 w-4" />
            case 'pending':
                return <AlertTriangle className="h-4 w-4" />
            case 'rejected':
                return <XCircle className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    // Event handlers
    const handleViewRequest = async (request: RequestListItem) => {
        if (request.hasReport) {
            // For requests with reports, we need to fetch the full data
            try {
                const fullRequest = allRequests.find(r => r.id === request.id && r.hasReport)
                if (fullRequest) {
                    // Convert to REQUEST_WITH_REPORT format
                    const requestWithReport: REQUEST_WITH_REPORT = {
                        id: fullRequest.id,
                        reportId: "mock-report-id",
                        deviceId: "mock-device-id",
                        deviceName: fullRequest.deviceName,
                        deviceCode: fullRequest.deviceCode,
                        positionIndex: 1,
                        zoneName: fullRequest.zoneName || "Unknown Zone",
                        areaName: fullRequest.areaName || "Unknown Area",
                        requestDate: fullRequest.createdDate,
                        requestTitle: fullRequest.requestTitle,
                        description: fullRequest.description,
                        status: fullRequest.status,
                        priority: fullRequest.priority,
                        createdDate: fullRequest.createdDate,
                        createdBy: fullRequest.createdBy,
                        issues: Array.from({ length: fullRequest.issueCount }, (_, i) => ({
                            id: `issue-${i + 1}`,
                            displayName: `Vấn đề ${i + 1}`,
                            imageUrls: []
                        }))
                    }
                    setSelectedRequest(requestWithReport)
                    setIsModalOpen(true)
                }
            } catch (error) {
                console.error("Error preparing request data:", error)
                toast.error("Unable to load request details")
            }
        } else {
            toast.info("Detailed view only available for requests with reports")
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRequest(null)
    }

    const getTabCounts = () => {
        return {
            all: allRequests.length,
            withReport: allRequests.filter(r => r.hasReport).length,
            withoutReport: allRequests.filter(r => !r.hasReport).length
        }
    }

    const tabCounts = getTabCounts()

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Request Management</h1>
                </div>
                <Card>
                    <CardContent className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <span className="ml-2">Loading requests...</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold">Request Management</h1>
                </div>
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
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Request Management</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                            <MoreHorizontal className="mr-2 h-4 w-4" />
                            Actions
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Report
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Export (Excel)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="all" className="relative">
                        Tất cả yêu cầu
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {tabCounts.all}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="with-report" className="relative">
                        Có báo cáo
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {tabCounts.withReport}
                        </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="without-report" className="relative">
                        Chưa có báo cáo
                        <Badge variant="secondary" className="ml-2 text-xs">
                            {tabCounts.withoutReport}
                        </Badge>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex flex-1 gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search requests..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                                {searchTerm && searchTerm !== debouncedSearchTerm && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">
                                        Searching...
                                    </span>
                                )}
                            </div>

                            <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as RequestStatus)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="approved">Approved</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={filterPriority} onValueChange={(value) => setFilterPriority(value as RequestPriority)}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Priority</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Requests Table */}
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="px-4 py-3 text-left">Người tạo</th>
                                            <th className="px-4 py-3 text-left">Tiêu đề yêu cầu</th>
                                            <th className="px-4 py-3 text-left">Thiết bị</th>
                                            <th className="px-4 py-3 text-left">Mức độ ưu tiên</th>
                                            <th className="px-4 py-3 text-left">Trạng thái</th>
                                            <th className="px-4 py-3 text-left">Báo cáo</th>
                                            <th className="px-4 py-3 text-left">Ngày tạo</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedRequests.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                                    Không có yêu cầu nào được tìm thấy
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedRequests.map((request) => (
                                                <tr key={request.id} className="border-b hover:bg-muted/50">
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarFallback>
                                                                    <User className="h-4 w-4" />
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <div className="font-medium text-sm">
                                                                    {userCache[request.createdBy] || 'Loading...'}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    {request.issueCount} vấn đề
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium text-sm">
                                                            {request.requestTitle}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.zoneName} - {request.areaName}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm">{request.deviceName}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {request.deviceCode}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`${getPriorityColor(request.priority)} border-0`}
                                                        >
                                                            {request.priority}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-2">
                                                            {getStatusIcon(request.status)}
                                                            <Badge 
                                                                variant="secondary" 
                                                                className={`${getStatusColor(request.status)} border-0`}
                                                            >
                                                                {request.status}
                                                            </Badge>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {request.hasReport ? (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-0">
                                                                <FileText className="h-3 w-3 mr-1" />
                                                                Có
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-0">
                                                                Chưa có
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {formatDate(request.createdDate)}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            onClick={() => handleViewRequest(request)}
                                                            disabled={!request.hasReport}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-gray-500">
                                    {filteredRequests.length > 0 ? (
                                        <>
                                            {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filteredRequests.length)} of {filteredRequests.length} requests
                                        </>
                                    ) : (
                                        "No requests"
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">
                                        Page {page} of {totalPages || 1}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                        disabled={page === 1}
                                        className="h-8 w-8"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                        disabled={page >= totalPages}
                                        className="h-8 w-8"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Request Detail Modal */}
            <RequestDetailModal
                request={selectedRequest}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    )
}