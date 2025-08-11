"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import PositionListCpn, { PositionListCpnRef } from "@/components/AdminPositionCpn/PositionListCpn/PositionListCpn"
import PositionModal from "@/components/AdminPositionCpn/PositionModalCpn/PositionModal"
import { Position, Zone, Area, CreatePositionRequest, UpdatePositionRequest } from "@/types/location.type"
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

export default function PositionsPage() {
    const searchParams = useSearchParams()
    const selectedZoneId = searchParams.get('zone')
    const selectedAreaId = searchParams.get('area')
    
    const [areas, setAreas] = useState<Area[]>([])
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
    const [showPositionModal, setShowPositionModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Create ref to access PositionListCpn methods
    const positionListRef = useRef<PositionListCpnRef>(null)

    const selectedZone = zones.find(zone => zone.id === selectedZoneId)
    const selectedArea = selectedZone ? areas.find(area => area.id === selectedZone.areaId) : areas.find(area => area.id === selectedAreaId)

    // Fetch areas and zones for modal dropdown
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch areas
                const areasResponse = await apiClient.location.getAreas(1, 1000)
                let areasData: Area[] = []
                
                if (areasResponse?.data?.data && Array.isArray(areasResponse.data.data)) {
                    areasData = areasResponse.data.data
                } else if (areasResponse?.data && Array.isArray(areasResponse.data)) {
                    areasData = areasResponse.data
                } else if (Array.isArray(areasResponse)) {
                    areasData = areasResponse
                }
                
                setAreas(areasData)

                // Fetch zones
                const zonesResponse = await apiClient.location.getZones(1, 1000)
                let zonesData: Zone[] = []
                
                if (zonesResponse?.data?.data && Array.isArray(zonesResponse.data.data)) {
                    zonesData = zonesResponse.data.data
                } else if (zonesResponse?.data && Array.isArray(zonesResponse.data)) {
                    zonesData = zonesResponse.data
                } else if (Array.isArray(zonesResponse)) {
                    zonesData = zonesResponse
                }

                // Map area names to zones
                const zonesWithAreaNames = zonesData.map(zone => {
                    const area = areasData.find(a => a.id === zone.areaId)
                    return {
                        ...zone,
                        areaName: area?.areaName || zone.areaName || 'Unknown Area',
                        areaCode: area?.areaCode || zone.areaCode || 'N/A'
                    }
                })
                
                setZones(zonesWithAreaNames)
            } catch (error) {
                console.error("Error fetching data:", error)
            }
        }

        fetchData()
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

    const handleEditPosition = useCallback((position: Position) => {
        setSelectedPosition(position)
        setShowPositionModal(true)
    }, [])

    const handleViewPosition = useCallback((position: Position) => {
        toast.info("View position functionality will be implemented when needed.")
    }, [])

    const handleDeletePosition = useCallback((position: Position) => {
        setSelectedPosition(position)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedPosition(null)
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }, 300)
    }, [])

    const confirmDeletePosition = useCallback(async () => {
        if (!selectedPosition) return
        
        setIsDeleting(true)
        try {
            console.log(`🗑️ Deleting position: Vị trí ${selectedPosition.index} (ID: ${selectedPosition.id})`)
            
            await apiClient.location.deletePosition(selectedPosition.id)
            
            toast.success("Đã xóa vị trí thành công")
            closeDeleteDialog()
            
            // Refetch only the current list data (no page reload)
            if (positionListRef.current) {
                await positionListRef.current.refetchPositions()
                console.log("✅ Position deleted and list refreshed")
            }
            
        } catch (error: any) {
            console.error("❌ Error deleting position:", error)
            
            // Extract error message from response
            let errorMessage = "Xóa vị trí thất bại"
            
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
    }, [selectedPosition, closeDeleteDialog])

    const handlePositionModalClose = useCallback((open: boolean) => {
        setShowPositionModal(open)
        
        if (!open) {
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected position after a short delay
            setTimeout(() => {
                setSelectedPosition(null)
            }, 100)
        }
    }, [])

    const handleDeleteDialogClose = useCallback((open: boolean) => {
        setDeleteDialogOpen(open)
        
        if (!open) {
            closeDeleteDialog()
        }
    }, [closeDeleteDialog])

    const handlePositionSubmit = useCallback(async (data: CreatePositionRequest | UpdatePositionRequest) => {
        try {
            if (selectedPosition && 'id' in data) {
                // Update existing position
                console.log("Updating position:", data)
                // await apiClient.location.updatePosition(selectedPosition.id, data as UpdatePositionRequest)
                toast.success("Vị trí đã được cập nhật thành công")
            } else {
                // Create new position  
                console.log("Creating position:", data)
                // await apiClient.location.createPosition(data as CreatePositionRequest)
                toast.success("Vị trí đã được tạo thành công")
            }

            setShowPositionModal(false)
            setSelectedPosition(null)

            // Refresh the list
            if (positionListRef.current) {
                await positionListRef.current.refetchPositions()
            }
        } catch (error: any) {
            console.error("Error saving position:", error)
            const action = selectedPosition ? "cập nhật" : "tạo"
            toast.error(`Có lỗi xảy ra khi ${action} vị trí: ${error.message || 'Lỗi không xác định'}`)
        }
    }, [selectedPosition])

    // Dynamic breadcrumb based on context
    const breadcrumbItems = selectedZoneId && selectedZone ? [
        { label: 'Khu vực', href: `/workspace/admin/location/areas` },
        { label: 'Khu', href: `/workspace/admin/location/zones` },
        { label: selectedZone.zoneName, isActive: true }
    ] : [
        { label: 'Khu vực', href: `/workspace/admin/location/areas` },
        { label: 'Khu', href: `/workspace/admin/location/zones` },
        { label: 'Vị trí', isActive: true }
    ];

    return (
        <div className="space-y-6 p-2 bg-background min-h-screen">
            <LocationBreadcrumb items={breadcrumbItems} />
            
            <div className="flex flex-col gap-6">
                <PositionListCpn 
                    ref={positionListRef}
                    selectedZoneId={selectedZoneId || undefined}
                    selectedAreaId={selectedAreaId || undefined}
                    onEditPosition={handleEditPosition}
                    onDeletePosition={handleDeletePosition}
                    onViewPosition={handleViewPosition}
                />

                {/* Position Modal */}
                <PositionModal
                    isOpen={showPositionModal}
                    onClose={() => handlePositionModalClose(false)}
                    onSubmit={handlePositionSubmit}
                    position={selectedPosition}
                    zones={zones}
                    isLoading={false}
                    selectedZoneId={selectedZoneId || undefined}
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
                            <AlertDialogTitle>Xác nhận xóa vị trí</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xóa vị trí
                                {selectedPosition && ` "${selectedPosition.positionName || `Vị trí ${selectedPosition.index}`}"`}? 
                                Thao tác này không thể hoàn tác.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDeletePosition} 
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