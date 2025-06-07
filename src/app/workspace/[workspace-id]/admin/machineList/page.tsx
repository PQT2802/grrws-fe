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

type MachineStatus = "active" | "discontinued"
type DialogMode = "view" | "edit" | "create"

interface Machine {
    id: string
    machineName: string
    machineCode: string
    manufacturer: string
    model: string
    description: string
    status: MachineStatus
    releaseDate: string
    specifications: string
    photoUrl: string
    createdDate: string
    modifiedDate: string
}

// Mock machine data
const mockMachines: Machine[] = Array.from({ length: 50 }, (_, i) => ({
    id: `a1b2c3d4-0001-0001-0001-000000000${String(i + 1).padStart(3, "0")}`,
    machineCode: `MC${String(i + 1).padStart(3, "0")}-JUKI-DDL${8700 + i}`,
    machineName: `Máy May Công Nghiệp ${i + 1}`,
    manufacturer: i % 2 === 0 ? "Juki" : "Brother",
    model: `DDL-${8700 + i}`,
    description: `Máy may kim đơn tốc độ cao, phù hợp cho vải nhẹ, trung bình, và dày. Máy ${i + 1}.`,
    status: i % 3 === 0 ? "discontinued" : "active",
    releaseDate: `202${i % 5}-0${(i % 9) + 1}-15`,
    specifications: `Tốc độ tối đa: ${5500 + i * 10} SPM, Độ dài mũi may tối đa: ${5 + i * 0.1}mm`,
    photoUrl: `https://example.com/photos/juki_ddl${8700 + i}.jpg`,
    createdDate: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
    modifiedDate: `2023-${(i % 12) + 1}-${(i % 28) + 1}`,
}))

export default function MachineManagement() {
    const [machines, setMachines] = useState<Machine[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [page, setPage] = useState(1)
    const [pageSize] = useState(10)
    const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogMode, setDialogMode] = useState<DialogMode>("view")
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [selectedStatus, setSelectedStatus] = useState<MachineStatus | "">("")

    const debouncedSearchTerm = useDebounce(searchTerm, 1000)

    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        })
    }

    const openDialog = useCallback((mode: DialogMode, machine: Machine | null = null) => {
        setDialogMode(mode)
        setSelectedMachine(machine)
        setSelectedStatus(machine ? machine.status : "")
        setDialogOpen(true)
    }, [])

    const closeDialog = useCallback(() => {
        setDialogOpen(false)
        setTimeout(() => {
            setSelectedMachine(null)
            setDialogMode("view")
            setSelectedStatus("")
            document.body.style.pointerEvents = "auto"
        }, 300)
    }, [])

    const fetchMachines = useCallback(() => {
        setIsLoading(true)
        setTimeout(() => {
            let filteredMachines = [...mockMachines]

            // Apply search filter
            if (debouncedSearchTerm) {
                filteredMachines = filteredMachines.filter(
                    (machine) =>
                        machine.machineName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                        machine.machineCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
                )
            }

            // Apply status filter
            if (filterStatus !== "all") {
                filteredMachines = filteredMachines.filter((machine) => machine.status === filterStatus)
            }

            setTotalCount(filteredMachines.length)
            const start = (page - 1) * pageSize
            const paginatedMachines = filteredMachines.slice(start, start + pageSize)
            setMachines(paginatedMachines)
            setIsLoading(false)
        }, 500)
    }, [debouncedSearchTerm, filterStatus, page, pageSize])

    useEffect(() => {
        fetchMachines()
    }, [fetchMachines])

    const handleViewMachine = useCallback((machine: Machine) => {
        openDialog("view", machine)
    }, [openDialog])

    const handleEditMachine = useCallback((machine: Machine) => {
        openDialog("edit", machine)
    }, [openDialog])

    const handleCreateMachine = useCallback(() => {
        openDialog("create", null)
    }, [openDialog])

    const openDeleteDialog = useCallback((machine: Machine) => {
        setSelectedMachine(machine)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedMachine(null)
            document.body.style.pointerEvents = "auto"
        }, 300)
    }, [])

    const handleDeleteMachine = useCallback((machine: Machine) => {
        openDeleteDialog(machine)
    }, [openDeleteDialog])

    const confirmDeleteMachine = useCallback(() => {
        if (!selectedMachine) return

        setMachines((prev) => prev.filter((machine) => machine.id !== selectedMachine.id))
        setTotalCount((prev) => prev - 1)
        toast.success(`${selectedMachine.machineName} has been deleted successfully.`)
        closeDeleteDialog()
        fetchMachines()
    }, [selectedMachine, closeDeleteDialog, fetchMachines])

    const handleSaveMachine = useCallback(
        (formData: any) => {
            const currentDate = new Date().toISOString().split("T")[0]
            if (dialogMode === "create") {
                if (!selectedStatus) {
                    toast.error("Please select a status for the new machine.")
                    return
                }
                const newMachine: Machine = {
                    id: `a1b2c3d4-0001-0001-0001-${Date.now()}`,
                    machineName: formData.machineName,
                    machineCode: formData.machineCode,
                    manufacturer: formData.manufacturer,
                    model: formData.model,
                    description: formData.description,
                    status: selectedStatus,
                    releaseDate: formData.releaseDate,
                    specifications: formData.specifications,
                    photoUrl: formData.photoUrl,
                    createdDate: currentDate,
                    modifiedDate: currentDate,
                }
                setMachines((prev) => [...prev, newMachine])
                setTotalCount((prev) => prev + 1)
                toast.success("Machine created successfully")
                closeDialog()
                fetchMachines()
            } else if (dialogMode === "edit" && selectedMachine) {
                const updatedMachine: Machine = {
                    ...selectedMachine,
                    machineName: formData.machineName,
                    machineCode: formData.machineCode,
                    manufacturer: formData.manufacturer,
                    model: formData.model,
                    description: formData.description,
                    status: selectedStatus || selectedMachine.status,
                    releaseDate: formData.releaseDate,
                    specifications: formData.specifications,
                    photoUrl: formData.photoUrl,
                    modifiedDate: currentDate,
                }
                setMachines((prev) =>
                    prev.map((machine) => (machine.id === selectedMachine.id ? updatedMachine : machine))
                )
                toast.success("Machine updated successfully")
                closeDialog()
                fetchMachines()
            }
        },
        [dialogMode, selectedMachine, selectedStatus, closeDialog, fetchMachines]
    )

    const totalPages = Math.ceil(totalCount / pageSize)

    const getStatusBadgeVariant = (status: MachineStatus) => {
        switch (status) {
            case "active":
                return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
            case "discontinued":
                return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
        }
    }

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Machine Management</h1>
                <Button onClick={handleCreateMachine} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Machine
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
                            <SelectItem value="discontinued">Discontinued</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b bg-muted/50">
                                <th className="px-4 py-3 text-left">Model</th>
                                <th className="px-4 py-3 text-left">Manufacturer</th>
                                <th className="px-4 py-3 text-left">Machine Name</th>
                                <th className="px-4 py-3 text-left">Status</th>
                                <th className="px-4 py-3 text-left">Created</th>
                                <th className="w-[80px] px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={`skeleton-${index}`} className="border-b animate-pulse">
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
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
                                        <td className="px-4 py-3 text-muted-foreground">{machine.model}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{machine.manufacturer}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{machine.machineName}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className={`${getStatusBadgeVariant(machine.status)} border-0`}>
                                                {machine.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatDate(machine.createdDate)}</td>
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

                <div className="flex items-center justify-between px-4 py-3 border-t">
                    <div className="text-sm text-gray-500">
                        {totalCount > 0 ? (
                            <>
                                {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} machines
                            </>
                        ) : (
                            "No machines"
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
                                ? "Machine Details"
                                : dialogMode === "edit"
                                    ? "Edit Machine"
                                    : "Create New Machine"}
                        </DialogTitle>
                        <DialogDescription>
                            {dialogMode === "view"
                                ? "View machine information"
                                : dialogMode === "edit"
                                    ? "Make changes to machine information"
                                    : "Add a new machine to the system"}
                        </DialogDescription>
                    </DialogHeader>

                    {dialogMode === "view" && selectedMachine ? (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <h3 className="text-xl font-semibold">{selectedMachine.machineName}</h3>
                                <Badge variant="outline" className={`${getStatusBadgeVariant(selectedMachine.status)} border-0`}>
                                    {selectedMachine.status}
                                </Badge>
                            </div>

                            <Tabs defaultValue="details">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">Machine Details</TabsTrigger>
                                    <TabsTrigger value="activity">Activity</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="space-y-3">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Machine Code</Label>
                                            <div className="flex items-center gap-2">
                                                <Tag className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedMachine.machineCode}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Manufacturer</Label>
                                            <div className="flex items-center gap-2">
                                                <Factory className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedMachine.manufacturer}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-muted-foreground">Model</Label>
                                            <div className="flex items-center gap-2">
                                                <Settings className="h-4 w-4 text-muted-foreground" />
                                                <span>{selectedMachine.model}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Description</Label>
                                        <div className="rounded-md border p-2 bg-muted/20 text-sm">{selectedMachine.description}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Specifications</Label>
                                        <div className="rounded-md border p-2 bg-muted/20 text-sm">{selectedMachine.specifications}</div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Photo URL</Label>
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            <a
                                                href={selectedMachine.photoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline truncate max-w-xs text-sm"
                                            >
                                                {selectedMachine.photoUrl}
                                            </a>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="activity" className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Release Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedMachine.releaseDate)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Created Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedMachine.createdDate)}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-muted-foreground">Modified Date</Label>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span>{formatDate(selectedMachine.modifiedDate)}</span>
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
                                    machineName: formData.get("machineName") as string,
                                    machineCode: formData.get("machineCode") as string,
                                    manufacturer: formData.get("manufacturer") as string,
                                    model: formData.get("model") as string,
                                    description: formData.get("description") as string,
                                    releaseDate: formData.get("releaseDate") as string,
                                    specifications: formData.get("specifications") as string,
                                    photoUrl: formData.get("photoUrl") as string,
                                }
                                handleSaveMachine(data)
                            }}
                        >
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <div className="space-y-1">
                                    <Label htmlFor="machineName">Machine Name</Label>
                                    <Input
                                        id="machineName"
                                        name="machineName"
                                        defaultValue={selectedMachine?.machineName || ""}
                                        placeholder="Enter machine name"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="machineCode">Machine Code</Label>
                                    <Input
                                        id="machineCode"
                                        name="machineCode"
                                        defaultValue={selectedMachine?.machineCode || ""}
                                        placeholder="Enter machine code"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="manufacturer">Manufacturer</Label>
                                    <Input
                                        id="manufacturer"
                                        name="manufacturer"
                                        defaultValue={selectedMachine?.manufacturer || ""}
                                        placeholder="Enter manufacturer"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="model">Model</Label>
                                    <Input
                                        id="model"
                                        name="model"
                                        defaultValue={selectedMachine?.model || ""}
                                        placeholder="Enter model"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as MachineStatus)}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="discontinued">Discontinued</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="releaseDate">Release Date</Label>
                                    <Input
                                        id="releaseDate"
                                        name="releaseDate"
                                        type="date"
                                        defaultValue={selectedMachine?.releaseDate.split("T")[0] || ""}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    name="description"
                                    rows={3}
                                    defaultValue={selectedMachine?.description || ""}
                                    placeholder="Enter description"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="specifications">Specifications</Label>
                                <Textarea
                                    id="specifications"
                                    name="specifications"
                                    rows={3}
                                    defaultValue={selectedMachine?.specifications || ""}
                                    placeholder="Enter specifications"
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="photoUrl">Photo URL</Label>
                                <Input
                                    id="photoUrl"
                                    name="photoUrl"
                                    defaultValue={selectedMachine?.photoUrl || ""}
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
                            This action cannot be undone. This will permanently delete the machine
                            {selectedMachine && ` "${selectedMachine.machineName}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteMachine} className="bg-red-600 hover:bg-red-700">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}