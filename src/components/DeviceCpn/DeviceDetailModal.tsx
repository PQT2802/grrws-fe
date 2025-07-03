"use client"

import { useEffect, useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
    Truck
} from "lucide-react"
import { DEVICE_WEB } from "@/types/device.type"
import { WarrantyInfo, WARRANTY_HISTORY_LIST } from "@/types/warranty.type"
import { apiClient } from "@/lib/api-client"

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
    const [warranties, setWarranties] = useState<WarrantyInfo[]>([])
    const [warrantyHistory, setWarrantyHistory] = useState<WARRANTY_HISTORY_LIST[]>([])
    const [isLoadingWarranties, setIsLoadingWarranties] = useState(false)
    const [isLoadingWarrantyHistory, setIsLoadingWarrantyHistory] = useState(false)
    const [showOtherWarranties, setShowOtherWarranties] = useState(false)

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

    // Fetch warranties and warranty history when device changes
    useEffect(() => {
        if (open && device?.id) {
            fetchWarranties(device.id)
            fetchWarrantyHistory(device.id)
        } else {
            setWarranties([])
            setWarrantyHistory([])
        }
    }, [open, device?.id])

    const fetchWarranties = async (deviceId: string) => {
        setIsLoadingWarranties(true)
        try {
            console.log(`🔄 Fetching warranties for device: ${deviceId}`)
            const response = await apiClient.warranty.getDeviceWarranties(deviceId)
            console.log("📋 Warranties response:", response)
            setWarranties(response || [])
        } catch (error) {
            console.error("❌ Error fetching warranties:", error)
            setWarranties([])
        } finally {
            setIsLoadingWarranties(false)
        }
    }

    const fetchWarrantyHistory = async (deviceId: string) => {
        setIsLoadingWarrantyHistory(true)
        try {
            console.log(`🔄 Fetching warranty history for device: ${deviceId}`)
            const response = await apiClient.warranty.getWarrantyHistory(deviceId)
            console.log("📋 Warranty history response:", response)

            // Sort by sendDate descending (latest first)
            const sortedHistory = (response || []).sort((a, b) => {
                if (!a.sendDate && !b.sendDate) return 0
                if (!a.sendDate) return 1
                if (!b.sendDate) return -1
                return new Date(b.sendDate).getTime() - new Date(a.sendDate).getTime()
            })

            setWarrantyHistory(sortedHistory)
        } catch (error) {
            console.error("❌ Error fetching warranty history:", error)
            setWarrantyHistory([])
        } finally {
            setIsLoadingWarrantyHistory(false)
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

    const handleOpenChange = (newOpen: boolean) => {
        onOpenChange(newOpen)

        // Immediate cleanup if closing
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
                    <DialogTitle>Device Details</DialogTitle>
                    <DialogDescription>
                        View device information, specifications, warranty details, and service history
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
                            <TabsTrigger value="warranty">Device Warranty</TabsTrigger>
                            <TabsTrigger value="history">Warranty History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-4">
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
                                    <Label className="text-muted-foreground">Purchase Price</Label>
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
                                    <Label className="text-muted-foreground">Supplier</Label>
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-muted-foreground" />
                                        <span>{device.supplier || "N/A"}</span>
                                    </div>
                                </div>

                                {/* <div className="space-y-1">
                                    <Label className="text-muted-foreground">Area</Label>
                                    <div className="text-sm">
                                        {device.areaName || "N/A"}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Zone</Label>
                                    <div className="text-sm">
                                        {device.zoneName || "N/A"}
                                    </div>
                                </div> */}
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
                            </div>

                            {/* Description */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Description</Label>
                                <div className="text-sm font-medium mt-1">
                                    {device.description || "N/A"}
                                </div>
                            </div>

                            {/* Specifications */}
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Specifications</Label>
                                <div className="text-sm font-medium mt-1">
                                    {device.specifications || "N/A"}
                                </div>
                            </div>

                            {/* Photo URL */}
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

                        <TabsContent value="warranty" className="space-y-4">
                            {isLoadingWarranties ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span className="ml-2">Loading warranties...</span>
                                    </CardContent>
                                </Card>
                            ) : warranties.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            No Warranty Information
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            This device currently has no warranty records on file.
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
                                                <h4 className="text-lg font-semibold">Primary Device Warranty</h4>
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
                                                                    {warranty.warrantyStatus}
                                                                </Badge>
                                                                {warranty.daysRemaining >= 0 && (
                                                                    <Badge className={getDaysRemainingVariant(warranty.daysRemaining, warranty.lowDayWarning)}>
                                                                        {warranty.daysRemaining === 0 ? "Expires today" :
                                                                            warranty.daysRemaining === 1 ? "1 day left" :
                                                                                `${warranty.daysRemaining} days left`}
                                                                    </Badge>
                                                                )}
                                                                {warranty.lowDayWarning && (
                                                                    <div className="flex items-center gap-1 text-red-600">
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                        <span className="text-xs">Expiring soon</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Provider</Label>
                                                                    <p className="text-sm font-medium">{warranty.provider}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Start Date</Label>
                                                                    <p className="text-sm">{formatDate(warranty.warrantyStartDate)}</p>
                                                                </div>
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">End Date</Label>
                                                                    <p className="text-sm">{formatDate(warranty.warrantyEndDate)}</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div>
                                                                    <Label className="text-xs text-muted-foreground">Cost</Label>
                                                                    <p className="text-sm font-medium">{formatCurrency(warranty.cost)}</p>
                                                                </div>
                                                                {warranty.documentUrl && (
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Document</Label>
                                                                        <div className="flex items-center gap-1">
                                                                            <Button
                                                                                variant="link"
                                                                                size="sm"
                                                                                className="h-auto p-0 text-blue-600"
                                                                                onClick={() => window.open(warranty.documentUrl, '_blank')}
                                                                            >
                                                                                <FileText className="h-3 w-3 mr-1" />
                                                                                View Document
                                                                                <ExternalLink className="h-3 w-3 ml-1" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {warranty.notes && (
                                                            <div className="mt-3 pt-3 border-t">
                                                                <Label className="text-xs text-muted-foreground">Notes</Label>
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
                                                        Additional Warranties ({otherWarranties.length})
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
                                                                        {warranty.warrantyStatus}
                                                                    </Badge>
                                                                    {warranty.daysRemaining >= 0 && (
                                                                        <Badge className={getDaysRemainingVariant(warranty.daysRemaining, warranty.lowDayWarning)}>
                                                                            {warranty.daysRemaining === 0 ? "Expires today" :
                                                                                warranty.daysRemaining === 1 ? "1 day left" :
                                                                                    `${warranty.daysRemaining} days left`}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Provider</Label>
                                                                        <p className="text-sm font-medium">{warranty.provider}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Start Date</Label>
                                                                        <p className="text-sm">{formatDate(warranty.warrantyStartDate)}</p>
                                                                    </div>
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">End Date</Label>
                                                                        <p className="text-sm">{formatDate(warranty.warrantyEndDate)}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <div>
                                                                        <Label className="text-xs text-muted-foreground">Cost</Label>
                                                                        <p className="text-sm font-medium">{formatCurrency(warranty.cost)}</p>
                                                                    </div>
                                                                    {warranty.documentUrl && (
                                                                        <div>
                                                                            <Label className="text-xs text-muted-foreground">Document</Label>
                                                                            <div className="flex items-center gap-1">
                                                                                <Button
                                                                                    variant="link"
                                                                                    size="sm"
                                                                                    className="h-auto p-0 text-blue-600"
                                                                                    onClick={() => window.open(warranty.documentUrl, '_blank')}
                                                                                >
                                                                                    <FileText className="h-3 w-3 mr-1" />
                                                                                    View Document
                                                                                    <ExternalLink className="h-3 w-3 ml-1" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {warranty.notes && (
                                                                <div className="mt-3 pt-3 border-t">
                                                                    <Label className="text-xs text-muted-foreground">Notes</Label>
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

                        <TabsContent value="history" className="space-y-4">
                            {isLoadingWarrantyHistory ? (
                                <Card>
                                    <CardContent className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                        <span className="ml-2">Loading warranty history...</span>
                                    </CardContent>
                                </Card>
                            ) : warrantyHistory.length === 0 ? (
                                <Card>
                                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                                        <History className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                                            No Warranty History
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            This device has no warranty history.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <History className="h-5 w-5 text-blue-600" />
                                        <h4 className="text-lg font-semibold">Warranty Service History</h4>
                                        <Badge variant="secondary" className="ml-2">
                                            {warrantyHistory.length} record{warrantyHistory.length !== 1 ? 's' : ''}
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
                                                                {historyItem.status ? "Completed" : "In Progress"}
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
                                                                // return `${diffDays} day${diffDays !== 1 ? 's' : ''}`
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
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}