"use client"

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react"
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
    Settings,
    Factory,
    Calendar,
} from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "react-toastify"
import { Card, CardContent } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import { MACHINE_WEB } from "@/types/device.type"
import ExcelImportModal from "@/components/ExcelImportModal/ExcelImportModal"

interface MachineListCpnProps {
    onEditMachine?: (machine: MACHINE_WEB) => void
    onDeleteMachine?: (machine: MACHINE_WEB) => void
    onViewMachine?: (machine: MACHINE_WEB) => void
}

// Add ref interface for parent component access
export interface MachineListCpnRef {
    refetchMachines: () => Promise<void>
}

const MachineListCpn = forwardRef<MachineListCpnRef, MachineListCpnProps>(({ 
    onEditMachine, 
    onDeleteMachine,
    onViewMachine
}, ref) => {
    const [machines, setMachines] = useState<MACHINE_WEB[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    
    // Import modal state
    const [showImportModal, setShowImportModal] = useState(false)

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

    // Status badge colors for machine status
    const getStatusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "discontinued":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    // Get device count badge variant
    const getDeviceCountBadgeVariant = (deviceCount: number) => {
        if (deviceCount === 0) {
            return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        } else if (deviceCount <= 5) {
            return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
        } else if (deviceCount <= 10) {
            return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
        } else {
            return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
        }
    }

    // Fetch machines from API
    const fetchMachines = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)
            console.log(`🔄 Fetching machines (page ${page}, size ${pageSize})...`)

            const response = await apiClient.machine.getMachines(page, pageSize)
            console.log("📦 Machines API response:", response)

            // Handle different response structures
            let machinesData: MACHINE_WEB[] = []
            let total = 0

            if (response && typeof response === 'object') {
                // Case 1: Direct array response
                if (Array.isArray(response)) {
                    machinesData = response
                    total = response.length
                }
                else if ((response as any).data && Array.isArray((response as any).data)) {
                    machinesData = (response as any).data
                    total = (response as any).totalCount || (response as any).data.length
                }
                else if ((response as any).data && (response as any).data.data && Array.isArray((response as any).data.data)) {
                    machinesData = (response as any).data.data
                    total = (response as any).data.totalCount || (response as any).data.data.length
                }
                else {
                    console.error("❌ Unexpected response structure:", response)
                    throw new Error("Unexpected API response structure")
                }
            } else {
                throw new Error("Invalid API response")
            }

            console.log(`📊 Extracted: ${machinesData.length} machines, total: ${total}`)

            // Apply client-side filtering if needed
            let filteredMachines = machinesData

            // Apply search filter
            if (debouncedSearchTerm) {
                filteredMachines = filteredMachines.filter(
                    (machine) =>
                        machine.machineName?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        machine.machineCode?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        machine.model?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        machine.manufacturer?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            }

            // Apply status filter
            if (filterStatus !== "all") {
                filteredMachines = filteredMachines.filter((machine) => 
                    machine.status?.toLowerCase() === filterStatus.toLowerCase()
                )
            }

            setMachines(filteredMachines)
            setTotalCount(total)
            console.log("✅ Machines processed successfully")
        } catch (error: any) {
            console.error("❌ Error fetching machines:", error)
            setError(`Failed to load machines: ${error.message || 'Unknown error'}`)
            setMachines([])
            setTotalCount(0)
        } finally {
            setIsLoading(false)
        }
    }, [page, pageSize, debouncedSearchTerm, filterStatus])

    // Expose refetch method to parent component
    useImperativeHandle(ref, () => ({
        refetchMachines: fetchMachines
    }), [fetchMachines])

    useEffect(() => {
        fetchMachines()
    }, [fetchMachines])

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

    // Handle import modal
    const handleImportClick = useCallback(() => {
        setShowImportModal(true)
    }, [])

    const handleImportModalClose = useCallback(() => {
        setShowImportModal(false)
    }, [])

    // Handle file import
    const handleFileImport = useCallback(async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        console.log(`📂 Importing machine file: ${file.name}`)
        
        await apiClient.machine.importMachine(formData)
        
        // Refresh the machine list
        await fetchMachines()
        
    }, [fetchMachines])

    const handleViewMachine = useCallback((machine: MACHINE_WEB) => {
        if (onViewMachine) {
            onViewMachine(machine)
        } else {
            toast.info("View functionality will be implemented when needed.")
        }
    }, [onViewMachine])

    const handleEditMachine = useCallback((machine: MACHINE_WEB) => {
        if (onEditMachine) {
            onEditMachine(machine)
        } else {
            toast.info("Edit functionality will be implemented when the API is available.")
        }
    }, [onEditMachine])

    const handleDeleteMachine = useCallback((machine: MACHINE_WEB) => {
        if (onDeleteMachine) {
            onDeleteMachine(machine)
        } else {
            toast.info("Delete functionality will be implemented when the API is available.")
        }
    }, [onDeleteMachine])

    const handlePageSizeChange = useCallback((newPageSize: string) => {
        setPageSize(Number(newPageSize))
    }, [])

    const totalPages = Math.ceil(totalCount / pageSize)

    // Loading state
    if (isLoading && machines.length === 0) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Loading machines...</span>
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
                            onClick={() => fetchMachines()} 
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
                <h1 className="text-2xl font-semibold">Machine Management</h1>
                <div className="flex items-center gap-2">
                    <Button 
                        onClick={handleImportClick}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Upload className="mr-2 h-4 w-4" />
                        Import Machine
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex flex-1 gap-2">
                    <div className="relative w-1/3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, code, model, or manufacturer..."
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
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Machine Table */}
            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left">Machine Name</th>
                                <th className="px-4 py-3 text-left">Model & Manufacturer</th>
                                <th className="px-4 py-3 text-left">Associated Devices</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Release Date</th>
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
                                        <td className="px-4 py-3 text-right">
                                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                                        </td>
                                    </tr>
                                ))
                            ) : machines.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                                        No machines found
                                    </td>
                                </tr>
                            ) : (
                                machines.map((machine) => (
                                    <tr key={machine.id} className="border-b hover:bg-muted/50">
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{machine.machineName}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {machine.machineCode || "N/A"}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4" />
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {machine.model || "N/A"}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Factory className="h-3 w-3" />
                                                        {machine.manufacturer || "Unknown"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge 
                                                variant="outline" 
                                                className={`${getDeviceCountBadgeVariant(machine.deviceIds?.length || 0)} border-0`}
                                            >
                                                {machine.deviceIds?.length || 0} devices
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`${getStatusBadgeVariant(machine.status)} border-0`}>
                                                {machine.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                {formatDate(machine.releaseDate)}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleViewMachine(machine)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleEditMachine(machine)}>
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit Machine
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleDeleteMachine(machine)} className="text-red-600">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete Machine
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
                                    {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} machines
                                </>
                            ) : (
                                "No machines"
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

            {/* Import Modal */}
            <ExcelImportModal
                isOpen={showImportModal}
                onClose={handleImportModalClose}
                onImport={handleFileImport}
                title="Nhập máy từ Excel"
                successMessage="Nhập máy thành công"
            />
        </div>
    )
})

MachineListCpn.displayName = "MachineListCpn"

export default MachineListCpn