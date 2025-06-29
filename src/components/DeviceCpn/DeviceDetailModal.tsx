"use client"

import { useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Calendar,
    Tag,
    Clock,
    Factory,
    Settings,
    Image as ImageIcon,
    DollarSign,
} from "lucide-react"
import { DEVICE_WEB } from "@/types/device.type"

interface DeviceDetailModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    device: DEVICE_WEB | null
}

export default function DeviceDetailModal({ 
    open, 
    onOpenChange, 
    device 
}: DeviceDetailModalProps) {
    // Clean up any potential body style issues when component unmounts
    useEffect(() => {
        return () => {
            // Cleanup function to ensure body pointer events are restored
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    // Additional cleanup when modal closes
    useEffect(() => {
        if (!open && typeof document !== 'undefined') {
            // Small delay to let the dialog component handle its cleanup first
            const timeoutId = setTimeout(() => {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }, 100)
            
            return () => clearTimeout(timeoutId)
        }
    }, [open])

    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return "N/A"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "2-digit",
        })
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

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen)
        
        // Immediate cleanup if closing
        if (!newOpen && typeof document !== 'undefined') {
            document.body.style.pointerEvents = 'auto'
            document.body.style.overflow = 'auto'
        }
    }

    if (!device) return null

    return (
        <Dialog 
            open={open} 
            onOpenChange={handleOpenChange}
            modal={true}
        >
            <DialogContent 
                className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto"
                onEscapeKeyDown={() => handleOpenChange(false)}
                onPointerDownOutside={() => handleOpenChange(false)}
            >
                <DialogHeader>
                    <DialogTitle>Device Details</DialogTitle>
                    <DialogDescription>
                        View device information and specifications
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="space-y-1">
                        <h3 className="text-xl font-semibold">{device.deviceName}</h3>
                        <div className="flex gap-2">
                            <Badge variant="outline" className={`${getStatusBadgeVariant(device.status)} border-0`}>
                                {device.status}
                            </Badge>
                            <Badge variant="outline" className={`${getWarrantyBadgeVariant(device.isUnderWarranty)} border-0`}>
                                {device.isUnderWarranty ? "Under Warranty" : "No Warranty"}
                            </Badge>
                        </div>
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
                                        <span>{device.deviceCode}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Serial Number</Label>
                                    <div className="flex items-center gap-2">
                                        <Tag className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.serialNumber || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Model</Label>
                                    <div className="flex items-center gap-2">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.model || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Manufacturer</Label>
                                    <div className="flex items-center gap-2">
                                        <Factory className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.manufacturer || "N/A"}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Zone</Label>
                                    <div className="text-sm">
                                        {device.zoneName || "N/A"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Area</Label>
                                    <div className="text-sm">
                                        {device.areaName || "N/A"}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Description</Label>
                                <div className="rounded-md border p-2 bg-muted/20 text-sm">
                                    {device.description || "N/A"}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Specifications</Label>
                                <div className="rounded-md border p-2 bg-muted/20 text-sm">
                                    {device.specifications || "N/A"}
                                </div>
                            </div>
                            {device.photoUrl && (
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Photo URL</Label>
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
                        
                        <TabsContent value="about" className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Machine ID</Label>
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-mono">{device.machineId || "N/A"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Position ID</Label>
                                <div className="flex items-center gap-2">
                                    <Tag className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-xs font-mono">{device.positionId || "N/A"}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Purchase Price</Label>
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                        {device.purchasePrice ?
                                            device.purchasePrice.toLocaleString("en-US") :
                                            "N/A"}
                                    </span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Supplier</Label>
                                <div className="flex items-center gap-2">
                                    <Factory className="h-4 w-4 text-muted-foreground" />
                                    <span>{device.supplier || "N/A"}</span>
                                </div>
                            </div>
                        </TabsContent>
                        
                        <TabsContent value="activity" className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Manufacture Date</Label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(device.manufactureDate)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Installation Date</Label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(device.installationDate)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Created Date</Label>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(device.createdDate)}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Modified Date</Label>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{formatDate(device.modifiedDate)}</span>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}