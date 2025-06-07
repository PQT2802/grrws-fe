"use client"

import { useState, useCallback, useEffect } from "react"
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
    Plus,
    Calendar,
    Tag,
    Clock,
    Factory,
    Settings,
    Image as ImageIcon,
    DollarSign,
} from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "react-toastify"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type DeviceStatus = "active" | "inactive" | "inrepair" | "retired"
type DialogMode = "view" | "edit" | "create"

interface Device {
    id: string
    deviceName: string
    deviceCode: string
    serialNumber: string | null
    model: string | null
    manufacturer: string | null
    manufactureDate: string | null
    installationDate: string | null
    description: string | null
    photoUrl: string | null
    status: DeviceStatus
    isUnderWarranty: boolean
    specifications: string | null
    purchasePrice: number | null
    supplier: string | null
    machineId: string | null
    positionId: string | null
    createdDate: string
    modifiedDate: string
}

// Mock device data
const mockDevices: Device[] = Array.from({ length: 50 }, (_, i) => ({
    id: `d1e2f3a4-0001-0001-0001-000000000${String(i + 1).padStart(3, "0")}`,
    deviceCode: `DEV${String(i + 1).padStart(3, "0")}-JUKI-DDL8700-${String(i + 1).padStart(2, "0")}`,
    deviceName: `Juki DDL-8700 Unit ${i + 1}`,
    serialNumber: `J8700-D${String(i + 1).padStart(3, "0")}`,
    model: `DDL-8700-${i % 5}`,
    manufacturer: i % 2 === 0 ? "Juki" : "Brother",
    manufactureDate: `2022-${(i % 12) + 1}-${(i % 28) + 1}`,
    installationDate: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
    description: `Máy may kim đơn tốc độ cao cho vải nhẹ. Thiết bị ${i + 1}.`,
    photoUrl: `https://example.com/photos/device_juki_ddl8700_${String(i + 1).padStart(2, "0")}.jpg`,
    status: ["active", "inactive", "inrepair", "retired"][i % 4] as DeviceStatus,
    isUnderWarranty: i % 2 === 0,
    specifications: `Tốc độ tối đa: ${5500 + i * 10} SPM, Độ dài mũi may: ${5 + i * 0.1}mm`,
    purchasePrice: 15000000 + i * 100000,
    supplier: i % 2 === 0 ? "Juki Vietnam" : "Brother Vietnam",
    machineId: `a1b2c3d4-0001-0001-0001-000000000${String((i % 50) + 1).padStart(3, "0")}`,
    positionId: `f1e2d3c4-0001-0001-0001-000000000${String((i % 50) + 1).padStart(3, "0")}`,
    createdDate: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
    modifiedDate: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
}))

export default function DeviceManagement() {
    const [devices, setDevices] = useState<Device[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<DialogMode>("view")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | "">("")
    const [selectedWarranty, setSelectedWarranty] = useState<string>("")

    const debouncedSearchTerm = useDebounce(searchTerm, 1000)

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        })
    }

    const openDialog = useCallback((mode: DialogMode, device: Device | null = null) => {
        setDialogMode(mode)
        setSelectedDevice(device)
        setSelectedStatus(device ? device.status : "")
        setSelectedWarranty(device ? (device.isUnderWarranty ? "yes" : "no") : "")
        setDialogOpen(true)
    }, [])

    const closeDialog = useCallback(() => {
        setDialogOpen(false)
        setTimeout(() => {
            setSelectedDevice(null)
            setDialogMode("view")
            setSelectedStatus("")
            setSelectedWarranty("")
            document.body.style.pointerEvents = "auto"
        }, 300)
    }, [])

    const fetchDevices = useCallback(() => {
        setIsLoading(true)
        setTimeout(() => {
            let filteredDevices = [...mockDevices]

            // Apply search filter
            if (debouncedSearchTerm) {
                filteredDevices = filteredDevices.filter(
                    (device) =>
                        device.deviceName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        device.deviceCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            }

            // Apply status filter
            if (filterStatus !== "all") {
                filteredDevices = filteredDevices.filter((device) => device.status === filterStatus)
            }

            setTotalCount(filteredDevices.length)
            const start = (page - 1) * pageSize
            const paginatedDevices = filteredDevices.slice(start, start + pageSize)
            setDevices(paginatedDevices)
            setIsLoading(false)
        }, 500)
    }, [debouncedSearchTerm, filterStatus, page, pageSize])

    useEffect(() => {
        fetchDevices()
    }, [fetchDevices])

    const handleViewDevice = useCallback((device: Device) => {
        openDialog("view", device)
    }, [openDialog])

    const handleEditDevice = useCallback((device: Device) => {
        openDialog("edit", device)
    }, [openDialog])

    const handleCreateDevice = useCallback(() => {
        openDialog("create", null)
    }, [openDialog])

    const openDeleteDialog = useCallback((device: Device) => {
        setSelectedDevice(device)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedDevice(null)
            document.body.style.pointerEvents = "auto"
        }, 300)
    }, [])

    const handleDeleteDevice = useCallback((device: Device) => {
        openDeleteDialog(device)
    }, [openDeleteDialog])

    const confirmDeleteDevice = useCallback(() => {
        if (!selectedDevice) return

        setDevices((prev) => prev.filter((device) => device.id !== selectedDevice.id))
        setTotalCount((prev) => prev - 1)
        toast.success(`${selectedDevice.deviceName} has been deleted successfully.`)
        closeDeleteDialog()
        fetchDevices()
    }, [selectedDevice, closeDeleteDialog, fetchDevices])

    const handleSaveDevice = useCallback(
        (formData: any) => {
            const currentDate = new Date().toISOString().split("T")[0]
            if (dialogMode === "create") {
                if (!selectedStatus) {
                    toast.error("Please select a status for the new device.")
                    return
                }
                if (!selectedWarranty) {
                    toast.error("Please select warranty status for the new device.")
                    return
                }
                const newDevice: Device = {
                    id: `d1e2f3a4-0001-0001-0001-${Date.now()}`,
                    deviceName: formData.deviceName,
                    deviceCode: formData.deviceCode,
                    serialNumber: formData.serialNumber || null,
                    model: formData.model || null,
                    manufacturer: formData.manufacturer || null,
                    manufactureDate: formData.manufactureDate || null,
                    installationDate: formData.installationDate || null,
                    description: formData.description || null,
                    photoUrl: formData.photoUrl || null,
                    status: selectedStatus,
                    isUnderWarranty: selectedWarranty === "yes",
                    specifications: formData.specifications || null,
                    purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
                    supplier: formData.supplier || null,
                    machineId: formData.machineId || null,
                    positionId: formData.positionId || null,
                    createdDate: currentDate,
                    modifiedDate: currentDate,
                }
                setDevices((prev) => [...prev, newDevice])
                setTotalCount((prev) => prev + 1)
                toast.success("Device created successfully")
                closeDialog()
                fetchDevices()
            } else if (dialogMode === "edit" && selectedDevice) {
                const updatedDevice: Device = {
                    ...selectedDevice,
                    deviceName: formData.deviceName,
                    deviceCode: formData.deviceCode,
                    serialNumber: formData.serialNumber || null,
                    model: formData.model || null,
                    manufacturer: formData.manufacturer || null,
                    manufactureDate: formData.manufactureDate || null,
                    installationDate: formData.installationDate || null,
                    description: formData.description || null,
                    photoUrl: formData.photoUrl || null,
                    status: selectedStatus || selectedDevice.status,
                    isUnderWarranty: selectedWarranty ? selectedWarranty === "yes" : selectedDevice.isUnderWarranty,
                    specifications: formData.specifications || null,
                    purchasePrice: formData.purchasePrice ? Number(formData.purchasePrice) : null,
                    supplier: formData.supplier || null,
                    machineId: formData.machineId || null,
                    positionId: formData.positionId || null,
                    modifiedDate: currentDate,
                }
                setDevices((prev) =>
                    prev.map((device) => (device.id === selectedDevice.id ? updatedDevice : device))
                )
                toast.success("Device updated successfully")
                closeDialog()
                fetchDevices()
            }
        },
        [dialogMode, selectedDevice, selectedStatus, selectedWarranty, closeDialog, fetchDevices]
    )

    const totalPages = Math.ceil(totalCount / pageSize)

    const getStatusBadgeVariant = (status: DeviceStatus) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "inactive":
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
            case "inrepair":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
            case "retired":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    const getWarrantyBadgeVariant = (isUnderWarranty: boolean) => {
        return isUnderWarranty
            ? "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
            : "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Device Management</h1>
                <Button onClick={handleCreateDevice} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Device
                </Button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex flex-1 gap-2">
                    <div className="relative w-1/3">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or code..."
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
                            <SelectItem value="inrepair">In Repair</SelectItem>
                            <SelectItem value="retired">Retired</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left">Serial Number</th>
                                <th className="px-4 py-3 text-left">Device Name</th>
                                <th className="px-4 py-3 text-left">Supplier</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Warranty</th>
                                <th className="px-4 py-3 text-left">Created</th>
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
                                        <td className="px-4 py-3 text-muted-foreground">{device.serialNumber || "N/A"}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{device.deviceName}</div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{device.supplier || "N/A"}</td>
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
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(device.createdDate)}</td>
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

                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-gray-500">
                        {totalCount > 0 ? (
                            <>
                                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} devices
                            </>
                        ) : (
                            "No devices"
                        )}
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

            <Dialog
                open={dialogOpen}
                onOpenChange={(open) => {
                    setDialogOpen(open)
                    if (!open) {
                        closeDialog()
                    }
                }}
            >
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {dialogMode === "view"
                                ? "Device Details"
                                : dialogMode === "edit"
                                    ? "Edit Device"
                                    : "Create New Device"}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogMode === "view"
                                ? "View device information"
                                : dialogMode === "edit"
                                    ? "Make changes to device information"
                                    : "Add a new device to the system"}
                        </DialogDescription>
                    </DialogHeader>

                    {dialogMode === "view" && selectedDevice ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">{selectedDevice.deviceName}</h3>
                                <Badge variant="outline" className={`${getStatusBadgeVariant(selectedDevice.status)} border-0`}>
                                    {selectedDevice.status}
                                </Badge>
                                <Badge variant="outline" className={`${getWarrantyBadgeVariant(selectedDevice.isUnderWarranty)} border-0`}>
                                    {selectedDevice.isUnderWarranty ? "Under Warranty" : "No Warranty"}
                                </Badge>
                            </div>

                            <Tabs defaultValue="details">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="details">Device Details</TabsTrigger>
                                    <TabsTrigger value="about">About</TabsTrigger>
                                    <TabsTrigger value="activity">Activity</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Device Code</Label>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedDevice.deviceCode}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Serial Number</Label>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedDevice.serialNumber || "N/A"}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Model</Label>
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedDevice.model || "N/A"}</span>
                                            </div>
                                        </div>
                                        {/* <div className="space-y-1">
                                            <Label className="text-muted-foreground">Status</Label>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`${getStatusBadgeVariant(selectedDevice.status)} border-0`}
                                                >
                                                    {selectedDevice.status}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Warranty</Label>
                                            <div className="flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    className={`${getWarrantyBadgeVariant(selectedDevice.isUnderWarranty)} border-0`}
                                                >
                                                    {selectedDevice.isUnderWarranty ? "Yes" : "No"}
                                                </Badge>
                                            </div>
                                        </div> */}
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Supplier</Label>
                                            <div className="flex items-center gap-2">
                                                <Factory className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedDevice.supplier || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Description</Label>
                                        <div className="rounded-md border p-2 bg-muted/20 text-sm">
                                            {selectedDevice.description || "N/A"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Specifications</Label>
                                        <div className="rounded-md border p-2 bg-muted/20 text-sm">
                                            {selectedDevice.specifications || "N/A"}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Photo URL</Label>
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={selectedDevice.photoUrl || "#"}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline truncate max-w-xs text-sm"
                                            >
                                                {selectedDevice.photoUrl || "N/A"}
                                            </a>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="about" className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Machine ID</Label>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-mono">{selectedDevice.machineId || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Position ID</Label>
                                        <div className="flex items-center gap-2">
                                            <Tag className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-xs font-mono">{selectedDevice.positionId || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Manufacturer</Label>
                                        <div className="flex items-center gap-2">
                                            <Factory className="h-4 w-4 text-muted-foreground" />
                                            <span>{selectedDevice.manufacturer || "N/A"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Purchase Price</Label>
                                        <div className="flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                                            <span>
                                                {selectedDevice.purchasePrice
                                                    ? selectedDevice.purchasePrice.toLocaleString("en-US")
                                                    : "N/A"}
                                            </span>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="activity" className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Manufacture Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedDevice.manufactureDate)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Installation Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedDevice.installationDate)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Created Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedDevice.createdDate)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Modified Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedDevice.modifiedDate)}</span>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    ) : (
                        <form
                            className="space-y-3"
                            onSubmit={(e) => {
                                e.preventDefault()
                                const formData = new FormData(e.currentTarget)
                                const data = {
                                    deviceName: formData.get("deviceName") as string,
                                    deviceCode: formData.get("deviceCode") as string,
                                    serialNumber: formData.get("serialNumber") as string,
                                    model: formData.get("model") as string,
                                    manufacturer: formData.get("manufacturer") as string,
                                    manufactureDate: formData.get("manufactureDate") as string,
                                    installationDate: formData.get("installationDate") as string,
                                    description: formData.get("description") as string,
                                    photoUrl: formData.get("photoUrl") as string,
                                    specifications: formData.get("specifications") as string,
                                    purchasePrice: formData.get("purchasePrice") as string,
                                    supplier: formData.get("supplier") as string,
                                    machineId: formData.get("machineId") as string,
                                    positionId: formData.get("positionId") as string,
                                }
                                handleSaveDevice(data)
                            }}
                        >
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="deviceName">Device Name</Label>
                                    <Input
                                        id="deviceName"
                                        name="deviceName"
                                        defaultValue={selectedDevice?.deviceName || ""}
                                        placeholder="Enter device name"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="deviceCode">Device Code</Label>
                                    <Input
                                        id="deviceCode"
                                        name="deviceCode"
                                        defaultValue={selectedDevice?.deviceCode || ""}
                                        placeholder="Enter device code"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="serialNumber">Serial Number</Label>
                                    <Input
                                        id="serialNumber"
                                        name="serialNumber"
                                        defaultValue={selectedDevice?.serialNumber || ""}
                                        placeholder="Enter serial number"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        name="model"
                                        defaultValue={selectedDevice?.model || ""}
                                        placeholder="Enter model"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="manufacturer">Manufacturer</Label>
                                    <Input
                                        id="manufacturer"
                                        name="manufacturer"
                                        defaultValue={selectedDevice?.manufacturer || ""}
                                        placeholder="Enter manufacturer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="supplier">Supplier</Label>
                                    <Input
                                        id="supplier"
                                        name="supplier"
                                        defaultValue={selectedDevice?.supplier || ""}
                                        placeholder="Enter supplier"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as DeviceStatus)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="inrepair">In Repair</SelectItem>
                                            <SelectItem value="retired">Retired</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="isUnderWarranty">Warranty</Label>
                                    <Select value={selectedWarranty} onValueChange={setSelectedWarranty}>
                                        <SelectTrigger id="isUnderWarranty">
                                            <SelectValue placeholder="Select warranty" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="yes">Yes</SelectItem>
                                            <SelectItem value="no">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="manufactureDate">Manufacture Date</Label>
                                    <Input
                                        id="manufactureDate"
                                        name="manufactureDate"
                                        type="date"
                                        defaultValue={selectedDevice?.manufactureDate?.split("T")[0] || ""}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="installationDate">Installation Date</Label>
                                    <Input
                                        id="installationDate"
                                        name="installationDate"
                                        type="date"
                                        defaultValue={selectedDevice?.installationDate?.split("T")[0] || ""}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                                    <Input
                                        id="purchasePrice"
                                        name="purchasePrice"
                                        type="number"
                                        defaultValue={selectedDevice?.purchasePrice || ""}
                                        placeholder="Enter purchase price"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="machineId">Machine ID</Label>
                                    <Input
                                        id="machineId"
                                        name="machineId"
                                        defaultValue={selectedDevice?.machineId || ""}
                                        placeholder="Enter machine ID"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="positionId">Position ID</Label>
                                    <Input
                                        id="positionId"
                                        name="positionId"
                                        defaultValue={selectedDevice?.positionId || ""}
                                        placeholder="Enter position ID"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={selectedDevice?.description || ""}
                                    placeholder="Enter description"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="specifications">Specifications</Label>
                                <Textarea
                                    id="specifications"
                                    name="specifications"
                                    rows={3}
                                    defaultValue={selectedDevice?.specifications || ""}
                                    placeholder="Enter specifications"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="photoUrl">Photo URL</Label>
                                <Input
                                    id="photoUrl"
                                    name="photoUrl"
                                    defaultValue={selectedDevice?.photoUrl || ""}
                                    placeholder="Enter photo URL"
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={closeDialog}>
                                    Cancel
                                </Button>
                                <Button type="submit">{dialogMode === "create" ? "Create" : "Save"}</Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open)
                    if (!open) {
                        closeDeleteDialog()
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the device
                            {selectedDevice && ` "${selectedDevice.deviceName}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteDevice} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}