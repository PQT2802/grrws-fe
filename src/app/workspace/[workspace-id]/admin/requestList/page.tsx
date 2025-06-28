"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import {
    Search,
    MoreHorizontal,
    Printer,
    Download,
    Loader2,
} from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { apiClient } from "@/lib/api-client"
import { REQUEST_ITEM, REQUEST_WITH_REPORT, REQUEST_WITHOUT_REPORT } from "@/types/dashboard.type"
import RequestDetailModal from "@/components/ChartCpn/RequestChartCpn/RequestDetailModal"
import UnifiedRequestList from "@/components/ChartCpn/RequestChartCpn/UnifiedRequestList"
import RequestWithReportList from "@/components/ChartCpn/RequestChartCpn/RequestWithReportList"
import RequestWithoutReportList from "@/components/ChartCpn/RequestChartCpn/RequestWithoutReportList"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"

type RequestStatus = "pending" | "approved" | "rejected" | "completed" | "all"
type RequestPriority = "low" | "medium" | "high" | "all"

interface UserCache {
    [userId: string]: string
}

export default function RequestListPage() {
    // State management
    const [allRequests, setAllRequests] = useState<REQUEST_ITEM[]>([])
    const [requestsWithReport, setRequestsWithReport] = useState<REQUEST_WITH_REPORT[]>([])
    const [requestsWithoutReport, setRequestsWithoutReport] = useState<REQUEST_WITHOUT_REPORT[]>([])
    const [userCache, setUserCache] = useState<UserCache>({})
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter and pagination states
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<RequestStatus>("all")
    const [filterPriority, setFilterPriority] = useState<RequestPriority>("all")
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCount, setTotalCount] = useState(0)
    const [pageSize, setPageSize] = useState(10) 

    // Modal states
    const [selectedRequest, setSelectedRequest] = useState<REQUEST_ITEM | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Active tab
    const [activeTab, setActiveTab] = useState("all")
    const debouncedSearchTerm = useDebounce(searchTerm, 500)

    // Fetch requests data
    const fetchRequests = useCallback(async (page: number = 1) => {
        try {
            setIsLoading(true)
            setError(null)
            console.log(`🔄 Fetching all requests data (page ${page}, size ${pageSize})...`)

            const response = await apiClient.dashboard.getAllRequests(page, pageSize)
           
            let requestsData: REQUEST_ITEM[] = []
            let totalCount = 0
            let pageNumber = page

            if (response && typeof response === 'object') {
                if (response.data && response.data.data && Array.isArray(response.data.data)) {
                    console.log("📋 Response structure: Nested data object")
                    requestsData = response.data.data
                    totalCount = response.data.totalCount || 0
                    pageNumber = response.data.pageNumber || page
                }
                else if (response.data && Array.isArray(response.data)) {
                    console.log("📋 Response structure: Direct data array")
                    requestsData = response.data
                    totalCount = (response as any).totalCount || response.data.length
                    pageNumber = (response as any).pageNumber || page
                }
                else {
                    console.error("❌ Unexpected response structure:", response)
                    throw new Error("Unexpected API response structure")
                }
            } else {
                throw new Error("Invalid API response")
            }

            if (!Array.isArray(requestsData)) {
                throw new Error("Requests data is not an array")
            }

            // Sort requests by created date (newest first)
            const sortedRequests = requestsData.sort(
                (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
            )

            // Separate requests into two groups
            const withReport: REQUEST_WITH_REPORT[] = []
            const withoutReport: REQUEST_WITHOUT_REPORT[] = []

            sortedRequests.forEach(request => {
                if (request.reportId !== null && request.reportId !== undefined && request.reportId !== '') {
                    withReport.push(request as REQUEST_WITH_REPORT)
                } else {
                    withoutReport.push({
                        ...request,
                        reportId: null
                    } as REQUEST_WITHOUT_REPORT)
                }
            })

            setAllRequests(sortedRequests)
            setRequestsWithReport(withReport)
            setRequestsWithoutReport(withoutReport)
            setTotalCount(totalCount)
            setCurrentPage(pageNumber)

            await fetchUserNames(sortedRequests)

            console.log("✅ Requests processed successfully")
        } catch (error: any) {
            console.error("❌ Error fetching requests:", error)
            console.error("❌ Error stack:", error.stack)
            setError(`Failed to load requests: ${error.message || 'Unknown error'}`)

            // Fallback to empty data to prevent UI crash
            setAllRequests([])
            setRequestsWithReport([])
            setRequestsWithoutReport([])
            setTotalCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [pageSize]) 

    // Fetch user names
    const fetchUserNames = async (requestsData: REQUEST_ITEM[]) => {
        if (!requestsData || requestsData.length === 0) return

        const uniqueUserIds = [...new Set(requestsData.map(req => req.createdBy).filter(Boolean))]
        const newUserCache: UserCache = { ...userCache }

        for (const userId of uniqueUserIds) {
            if (!newUserCache[userId]) {
                try {
                    const userResponse = await apiClient.user.getUserById(userId)
                    newUserCache[userId] = userResponse.data?.fullName || userResponse.fullName || 'Unknown User'
                } catch (error) {
                    console.error(`Failed to fetch user ${userId}:`, error)
                    newUserCache[userId] = 'Unknown User'
                }
            }
        }

        setUserCache(newUserCache)
    }

    const getFilteredRequests = (requests: REQUEST_ITEM[]) => {
        if (!requests || !Array.isArray(requests)) return []
        let filtered = [...requests]

        if (debouncedSearchTerm) {
            filtered = filtered.filter(request =>
                request.requestTitle?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                request.deviceName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                request.deviceCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
            )
        }

        if (filterStatus !== "all") {
            filtered = filtered.filter(request => request.status?.toLowerCase() === filterStatus)
        }

        if (filterPriority !== "all") {
            filtered = filtered.filter(request => request.priority?.toLowerCase() === filterPriority)
        }

        return filtered
    }

    // Get filtered requests for each tab
    const filteredAllRequests = getFilteredRequests(allRequests)
    const filteredRequestsWithReport = getFilteredRequests(requestsWithReport) as REQUEST_WITH_REPORT[]
    const filteredRequestsWithoutReport = getFilteredRequests(requestsWithoutReport) as REQUEST_WITHOUT_REPORT[]

    // Load data on component mount
    useEffect(() => {
        fetchRequests(1)
    }, [])

    // Handle page size change
    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize)
        setCurrentPage(1) // Reset to first page when changing page size
        fetchRequests(1)
    }

    // Handle page change
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= Math.ceil(totalCount / pageSize)) {
            setCurrentPage(page)
            fetchRequests(page)
        }
    }

    // Handle search/filter changes - reset to page 1
    useEffect(() => {
        if (currentPage !== 1 && (debouncedSearchTerm || filterStatus !== "all" || filterPriority !== "all")) {
            setCurrentPage(1)
            fetchRequests(1)
        }
    }, [debouncedSearchTerm, filterStatus, filterPriority])

    // Refetch when pageSize changes
    useEffect(() => {
        if (currentPage === 1) {
            fetchRequests(1)
        }
    }, [pageSize, fetchRequests])

    // Event handlers - Updated to handle all request types
    const handleViewRequest = (request: REQUEST_ITEM) => {
        const requestForModal: REQUEST_WITH_REPORT = {
            ...request,
            reportId: request.reportId || 'no-report' 
        }
        setSelectedRequest(requestForModal)
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedRequest(null)
    }

    const getTabCounts = () => {
        return {
            all: totalCount,
            withReport: requestsWithReport.length,
            withoutReport: requestsWithoutReport.length
        }
    }

    const tabCounts = getTabCounts()
    const totalPages = Math.ceil(totalCount / pageSize)

    if (isLoading && allRequests.length === 0) {
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
                            <p className="text-sm text-gray-500 mb-4">
                                Check the browser console for detailed error information.
                            </p>
                            <button
                                onClick={() => fetchRequests(1)}
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

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mt-4">
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

                {/* Updated tab content - All tab shows unified list */}
                <TabsContent value="all" className="space-y-4">
                    <UnifiedRequestList
                        requests={filteredAllRequests}
                        userCache={userCache}
                        isLoading={isLoading}
                        onViewRequest={handleViewRequest}
                    />
                </TabsContent>

                <TabsContent value="with-report" className="space-y-4">
                    <RequestWithReportList
                        requests={filteredRequestsWithReport}
                        userCache={userCache}
                        isLoading={isLoading}
                        onViewRequest={handleViewRequest}
                    />
                </TabsContent>

                <TabsContent value="without-report" className="space-y-4">
                    <RequestWithoutReportList
                        requests={filteredRequestsWithoutReport}
                        userCache={userCache}
                        isLoading={isLoading}
                        onViewRequest={handleViewRequest}
                    />
                </TabsContent>
            </Tabs>

            {/* Pagination */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between">
                    {/* Page Size Selector - Bottom Left */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">Show</span>
                        <Select 
                            value={pageSize.toString()} 
                            onValueChange={(value) => handlePageSizeChange(Number(value))}
                        >
                            <SelectTrigger className="w-[70px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-sm text-gray-500">per page</span>
                    </div>

                    {/* Pagination Info and Controls - Bottom Right */}
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500">
                            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} results
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                                
                                {/* Dynamic page numbers with ellipsis logic */}
                                {(() => {
                                    const maxVisiblePages = 5
                                    const pages = []
                                    
                                    if (totalPages <= maxVisiblePages) {
                                        // Show all pages if total is small
                                        for (let i = 1; i <= totalPages; i++) {
                                            pages.push(
                                                <PaginationItem key={i}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(i)}
                                                        isActive={currentPage === i}
                                                        className="cursor-pointer"
                                                    >
                                                        {i}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        }
                                    } else {
                                        // Complex pagination with ellipsis
                                        if (currentPage <= 3) {
                                            // Show first few pages
                                            for (let i = 1; i <= 4; i++) {
                                                pages.push(
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(i)}
                                                            isActive={currentPage === i}
                                                            className="cursor-pointer"
                                                        >
                                                            {i}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                            if (totalPages > 4) {
                                                pages.push(
                                                    <PaginationItem key="ellipsis1">
                                                        <span className="flex h-9 w-9 items-center justify-center">...</span>
                                                    </PaginationItem>
                                                )
                                                pages.push(
                                                    <PaginationItem key={totalPages}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(totalPages)}
                                                            className="cursor-pointer"
                                                        >
                                                            {totalPages}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                        } else if (currentPage >= totalPages - 2) {
                                            // Show last few pages
                                            pages.push(
                                                <PaginationItem key={1}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(1)}
                                                        className="cursor-pointer"
                                                    >
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                            pages.push(
                                                <PaginationItem key="ellipsis2">
                                                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                                                </PaginationItem>
                                            )
                                            for (let i = totalPages - 3; i <= totalPages; i++) {
                                                pages.push(
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(i)}
                                                            isActive={currentPage === i}
                                                            className="cursor-pointer"
                                                        >
                                                            {i}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                        } else {
                                            // Show middle pages with ellipsis on both sides
                                            pages.push(
                                                <PaginationItem key={1}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(1)}
                                                        className="cursor-pointer"
                                                    >
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                            pages.push(
                                                <PaginationItem key="ellipsis1">
                                                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                                                </PaginationItem>
                                            )
                                            for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                                                pages.push(
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            onClick={() => handlePageChange(i)}
                                                            isActive={currentPage === i}
                                                            className="cursor-pointer"
                                                        >
                                                            {i}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                )
                                            }
                                            pages.push(
                                                <PaginationItem key="ellipsis2">
                                                    <span className="flex h-9 w-9 items-center justify-center">...</span>
                                                </PaginationItem>
                                            )
                                            pages.push(
                                                <PaginationItem key={totalPages}>
                                                    <PaginationLink
                                                        onClick={() => handlePageChange(totalPages)}
                                                        className="cursor-pointer"
                                                    >
                                                        {totalPages}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            )
                                        }
                                    }
                                    
                                    return pages
                                })()}

                                <PaginationItem>
                                    <PaginationNext 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            )}

            {/* Request Detail Modal - Updated to handle all request types */}
            <RequestDetailModal
                request={selectedRequest as REQUEST_WITH_REPORT}
                isOpen={isModalOpen}
                onClose={handleCloseModal}
            />
        </div>
    )
}