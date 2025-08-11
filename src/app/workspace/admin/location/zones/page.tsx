"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import ZoneListCpn, { ZoneListCpnRef } from "@/components/AdminPositionCpn/PositionListCpn/ZoneListCpn"
import ZoneModal from "@/components/AdminPositionCpn/PositionModalCpn/ZoneModal"
import { Zone, Area, CreateZoneRequest, UpdateZoneRequest } from "@/types/location.type"
import { toast } from "react-toastify"
import { apiClient } from "@/lib/api-client"
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
import LocationBreadcrumb from "@/components/AdminPositionCpn/LocationBreadcrumb"

export default function ZonesPage() {
    const searchParams = useSearchParams()
    const selectedAreaId = searchParams.get('area')
    const router = useRouter()
    
    const [areas, setAreas] = useState<Area[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Create ref to access ZoneListCpn methods
    const zoneListRef = useRef<ZoneListCpnRef>(null)

    const selectedArea = areas.find(area => area.id === selectedAreaId)

    // Fetch areas for modal dropdown
    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await apiClient.location.getAreas(1, 1000)
                let areasData: Area[] = []
                
                if (response?.data?.data && Array.isArray(response.data.data)) {
                    areasData = response.data.data
                } else if (response?.data && Array.isArray(response.data)) {
                    areasData = response.data
                } else if (Array.isArray(response)) {
                    areasData = response
                }
                
                setAreas(areasData)
            } catch (error) {
                console.error("Error fetching areas:", error)
            }
        }

        fetchAreas()
    }, [])

    // Cleanup effect to ensure body styles are reset
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    const handleEditZone = useCallback((zone: Zone) => {
        setSelectedZone(zone)
        setShowZoneModal(true)
    }, [])

    const handleViewZone = useCallback((zone: Zone) => {
        // Use client-side navigation instead of window.location.href
        router.push(`/workspace/admin/location/positions?zone=${zone.id}`)
    }, [router])

    const handleDeleteZone = useCallback((zone: Zone) => {
        setSelectedZone(zone)
        setDeleteDialogOpen(true)
    }, [])

    const handleBackToAreas = useCallback(() => {
        // Use client-side navigation instead of window.location.href
        router.push('/workspace/admin/location/areas')
    }, [router])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedZone(null)
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }, 300)
    }, [])

    const confirmDeleteZone = useCallback(async () => {
        if (!selectedZone) return
        
        setIsDeleting(true)
        try {
            console.log(`🗑️ Deleting zone: ${selectedZone.zoneName} (ID: ${selectedZone.id})`)
            
            await apiClient.location.deleteZone(selectedZone.id)
            
            toast.success("Đã xóa khu thành công")
            closeDeleteDialog()
            
            // Refetch only the current list data (no page reload)
            if (zoneListRef.current) {
                await zoneListRef.current.refetchZones()
                console.log("✅ Zone deleted and list refreshed")
            }
            
        } catch (error: any) {
            console.error("❌ Error deleting zone:", error)
            
            // Extract error message from response
            let errorMessage = "Xóa khu thất bại"
            
            if (error.response?.data?.message) {
                errorMessage = `Xóa thất bại: ${error.response.data.message}`
            } else if (error.response?.data?.error) {
                errorMessage = `Xóa thất bại: ${error.response.data.error}`
            } else if (error.response?.data) {
                if (typeof error.response.data === 'string') {
                    errorMessage = `Xóa thất bại: ${error.response.data}`
                } else {
                    errorMessage = `Xóa thất bại: ${JSON.stringify(error.response.data)}`
                }
            } else if (error.message) {
                errorMessage = `Xóa thất bại: ${error.message}`
            }
            
            toast.error(errorMessage)
        } finally {
            setIsDeleting(false)
        }
    }, [selectedZone, closeDeleteDialog])

    const handleZoneModalClose = useCallback((open: boolean) => {
        setShowZoneModal(open)
        
        if (!open) {
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected zone after a short delay
            setTimeout(() => {
                setSelectedZone(null)
            }, 100)
        }
    }, [])

    const handleDeleteDialogClose = useCallback((open: boolean) => {
        setDeleteDialogOpen(open)
        
        if (!open) {
            closeDeleteDialog()
        }
    }, [closeDeleteDialog])

    const handleZoneSubmit = useCallback(async (data: CreateZoneRequest | UpdateZoneRequest) => {
        try {
            if (selectedZone && 'id' in data) {
                // Update existing zone
                console.log("Updating zone:", data)
                // await apiClient.location.updateZone(selectedZone.id, data as UpdateZoneRequest)
                toast.success("Khu đã được cập nhật thành công")
            } else {
                // Create new zone  
                console.log("Creating zone:", data)
                // await apiClient.location.createZone(data as CreateZoneRequest)
                toast.success("Khu đã được tạo thành công")
            }

            setShowZoneModal(false)
            setSelectedZone(null)

            // Refresh the list
            if (zoneListRef.current) {
                await zoneListRef.current.refetchZones()
            }
        } catch (error: any) {
            console.error("Error saving zone:", error)
            const action = selectedZone ? "cập nhật" : "tạo"
            toast.error(`Có lỗi xảy ra khi ${action} khu: ${error.message || 'Lỗi không xác định'}`)
        }
    }, [selectedZone])

    const breadcrumbItems = [
        { label: 'Khu vực', href: `/workspace/admin/location/areas` },
        ...(selectedArea 
            ? [{ label: selectedArea.areaName, isActive: true }]
            : [{ label: 'Khu', isActive: true }]
        )
    ];

    return (
        <div className="space-y-6 p-2 bg-background min-h-screen">
            <LocationBreadcrumb items={breadcrumbItems} />
            
            <div className="flex flex-col gap-6">
                <ZoneListCpn 
                    ref={zoneListRef}
                    selectedAreaId={selectedAreaId || undefined}
                    onEditZone={handleEditZone}
                    onDeleteZone={handleDeleteZone}
                    onViewZone={handleViewZone}
                    onBackToAreas={handleBackToAreas}
                />

                {/* Zone Modal */}
                <ZoneModal
                    isOpen={showZoneModal}
                    onClose={() => handleZoneModalClose(false)}
                    onSubmit={handleZoneSubmit}
                    zone={selectedZone}
                    areas={areas}
                    isLoading={false}
                    selectedAreaId={selectedAreaId || undefined}
                />

                {/* Delete Confirmation Dialog */}
                <AlertDialog 
                    open={deleteDialogOpen} 
                    onOpenChange={handleDeleteDialogClose}
                >
                    <AlertDialogContent
                        onEscapeKeyDown={() => handleDeleteDialogClose(false)}
                    >
                        <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa khu</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xóa khu
                                {selectedZone && ` "${selectedZone.zoneName}"`}? 
                                Thao tác này không thể hoàn tác và sẽ xóa tất cả vị trí trong khu này.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDeleteZone} 
                                className="bg-red-600 hover:bg-red-700"
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Đang xóa..." : "Xóa"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    )
}