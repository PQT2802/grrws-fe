"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import {
    Search,
    MoreHorizontal,
    Eye,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Upload,
    Loader2,
} from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "react-toastify"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { DEVICE_WEB } from "@/types/device.type"
import OperationStatsCpn from "../ChartCpn/OperationStatsCpn"

// Updated device status mapping based on backend enum
type DeviceStatus = "Active" | "Inactive" | "InUse" | "InRepair" | "InWarranty" | "Decommissioned"

interface DeviceListCpnProps {
    onCreateDevice?: () => void
    onEditDevice?: (device: DEVICE_WEB) => void
    onDeleteDevice?: (device: DEVICE_WEB) => void
    onViewDevice?: (device: DEVICE_WEB) => void
}

export default function DeviceListCpn({ 
    onCreateDevice, 
    onEditDevice, 
    onDeleteDevice,
    onViewDevice
}: DeviceListCpnProps) {
    const [devices, setDevices] = useState<DEVICE_WEB[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isImporting, setIsImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    
    // File input ref for Excel import
    const fileInputRef = useRef<HTMLInputElement>(null)

    const debouncedSearchTerm = useDebounce(searchTerm, 1000)

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        })
    }

    // Updated status badge colors based on new device status enum
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

    // Fetch devices from API
    const fetchDevices = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            console.log(`🔄 Fetching devices (page ${page}, size ${pageSize})...`)

            const response = await apiClient.device.getDevices(page, pageSize)
            console.log("📦 Devices API response:", response)

            // Handle different response structures
            let devicesData: DEVICE_WEB[] = []
            let total = 0

            if (response && typeof response === 'object') {
                // Case 1: Direct array response
                if (Array.isArray(response)) {
                    devicesData = response
                    total = response.length
                }
                else if ((response as any).data && Array.isArray((response as any).data)) {
                    devicesData = (response as any).data
                    total = (response as any).totalCount || (response as any).data.length
                }
                else if ((response as any).data && (response as any).data.data && Array.isArray((response as any).data.data)) {
                    devicesData = (response as any).data.data
                    total = (response as any).data.totalCount || (response as any).data.data.length
                }
                else {
                    console.error("❌ Unexpected response structure:", response)
                    throw new Error("Unexpected API response structure")
                }
            } else {
                throw new Error("Invalid API response")
            }

            console.log(`📊 Extracted: ${devicesData.length} devices, total: ${total}`)

            // Apply client-side filtering if needed
            let filteredDevices = devicesData

            // Apply search filter
            if (debouncedSearchTerm) {
                filteredDevices = filteredDevices.filter(
                    (device) =>
                        device.deviceName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        device.deviceCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        device.serialNumber?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            }

            // Apply status filter
            if (filterStatus !== "all") {
                filteredDevices = filteredDevices.filter((device) => 
                    device.status?.toLowerCase() === filterStatus.toLowerCase()
                )
            }

            setDevices(filteredDevices)
            setTotalCount(total)
            console.log("✅ Devices processed successfully")
        } catch (error: any) {
            console.error("❌ Error fetching devices:", error)
            setError(`Failed to load devices: ${error.message || 'Unknown error'}`)
            setDevices([])
            setTotalCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [page, pageSize, debouncedSearchTerm, filterStatus])

    useEffect(() => {
        fetchDevices()
    }, [fetchDevices])

    // Reset to page 1 when search/filter/pageSize changes
    useEffect(() => {
        if (page !== 1 && (debouncedSearchTerm || filterStatus !== "all")) {
            setPage(1)
        }
    }, [debouncedSearchTerm, filterStatus])

    // Reset to page 1 when page size changes
    useEffect(() => {
        setPage(1)
    }, [pageSize])

    // Handle Excel import
    const handleImportClick = useCallback(() => {
        // Reset any previous state before opening file dialog
        setIsImporting(false)
        fileInputRef.current?.click()
    }, [])

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) {
            // Reset importing state if no file selected
            setIsImporting(false)
            return
        }

        // Validate file type
        const allowedTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ]
        
        if (!allowedTypes.includes(file.type)) {
            toast.error("Please select a valid Excel file (.xlsx or .xls)")
            setIsImporting(false)
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            return
        }

        try {
            setIsImporting(true)
            
            const formData = new FormData()
            formData.append('file', file)

            console.log(`📂 Importing device file: ${file.name}`)
            
            const response = await apiClient.device.importDevice(formData)
            console.log('✅ Device import successful:', response)
            
            toast.success("Device data imported successfully!")
            
            // Refresh the device list
            await fetchDevices()
            
        } catch (error: any) {
            console.error("❌ Error importing device:", error)
            
            // Extract error message from response with better error handling
            let errorMessage = "Failed to import device data"
            
            try {
                // Handle different error response structures
                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message
                } else if (error.response?.data?.error) {
                    errorMessage = error.response.data.error
                } else if (error.response?.data) {
                    // If data is a string
                    if (typeof error.response.data === 'string') {
                        errorMessage = error.response.data
                    } else {
                        errorMessage = JSON.stringify(error.response.data)
                    }
                } else if (error.message) {
                    errorMessage = error.message
                }
            } catch (parseError) {
                console.error("Error parsing error response:", parseError)
                errorMessage = "Failed to import device data - Unknown error"
            }
            
            toast.error(errorMessage)
            
            // Force state reset on error
            setIsImporting(false)
            
        } finally {
            // Ensure state is always reset
            setTimeout(() => {
                setIsImporting(false)
                
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
            }, 100)
        }
    }, [fetchDevices])

    // Add cleanup and auto-reset effects
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            setIsImporting(false)
        }
    }, [])

    useEffect(() => {
        // Auto-reset importing state if it gets stuck
        const timeoutId = setTimeout(() => {
            if (isImporting) {
                console.warn("⚠️ Device import seems to be stuck, auto-resetting...")
                setIsImporting(false)
            }
        }, 30000) // 30 seconds timeout

        return () => clearTimeout(timeoutId)
    }, [isImporting])

    const handleViewDevice = useCallback((device: DEVICE_WEB) => {
        if (onViewDevice) {
            onViewDevice(device)
        } else {
            toast.info("View functionality will be implemented when needed.")
        }
    }, [onViewDevice])

    const handleEditDevice = useCallback((device: DEVICE_WEB) => {
        if (onEditDevice) {
            onEditDevice(device)
        } else {
            toast.info("Edit functionality will be implemented when the API is available.")
        }
    }, [onEditDevice])

    const handleCreateDevice = useCallback(() => {
        if (onCreateDevice) {
            onCreateDevice()
        } else {
            toast.info("Create functionality will be implemented when the API is available.")
        }
    }, [onCreateDevice])

    const handleDeleteDevice = useCallback((device: DEVICE_WEB) => {
        if (onDeleteDevice) {
            onDeleteDevice(device)
        } else {
            toast.info("Delete functionality will be implemented when the API is available.")
        }
    }, [onDeleteDevice])

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        setPageSize(Number(newPageSize))
    }, [])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Loading state
    if (isLoading && devices.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading devices...</span>
                </CardContent>
            </Card>
        )
    }

    // Error state
    if (error) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8 text-center">
                    <div>
                        <p className="text-red-500 mb-2">{error}</p>
                        <p className="text-sm text-gray-500 mb-4">
                            Check the browser console for detailed error information.
                        </p>
                        <button 
                            onClick={() => fetchDevices()} 
                            className="text-blue-500 underline text-sm"
                        >
                            Retry
                        </button>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Device Management</h1>
                <div className="flex items-center gap-2">
                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    
                    {/* Import button */}
                    <Button 
                        onClick={handleImportClick}
                        disabled={isImporting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isImporting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Importing...
                            </>
                        ) : (
                            <>
                                <Upload className="mr-2 h-4 w-4" />
                                Import Device
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <OperationStatsCpn/>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-1 gap-2">
                    <div className="relative w-1/3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, code, or serial..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                        {searchTerm && searchTerm !== debouncedSearchTerm && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">Searching...</span>
                        )}
                    </div>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="inuse">In Use</SelectItem>
                            <SelectItem value="inrepair">In Repair</SelectItem>
                            <SelectItem value="inwarranty">In Warranty</SelectItem>
                            <SelectItem value="decommissioned">Decommissioned</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Device Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left">Serial Number</th>
                                <th className="px-4 py-3 text-left">Device Name</th>
                                <th className="px-4 py-3 text-left">Model</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Warranty</th>
                                <th className="px-4 py-3 text-left">Installed</th>
                                <th className="w-[80px] px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="border-b animate-pulse">
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : devices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                        No devices found
                                    </td>
                                </tr>
                            ) : (
                                devices.map((device) => (
                                    <tr key={device.id} className="border-b hover:bg-muted/50">
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {device.serialNumber || "N/A"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{device.deviceName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {device.deviceCode}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="text-sm">
                                                {device.model || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {device.manufacturer || "Unknown"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`${getStatusBadgeVariant(device.status)} border-0`}>
                                                {device.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`${getWarrantyBadgeVariant(device.isUnderWarranty)} border-0`}>
                                                {device.isUnderWarranty ? "Yes" : "No"}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(device.installationDate)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewDevice(device)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit Device
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteDevice(device)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Device
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">Show:</span>
                            <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-[70px] h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="text-sm text-gray-500">
                            {totalCount > 0 ? (
                                <>
                                    {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} devices
                                </>
                            ) : (
                                "No devices"
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                            Page {page} of {totalPages}
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
            </div>
        </div>
    )
}