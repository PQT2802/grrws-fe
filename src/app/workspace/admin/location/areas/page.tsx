"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import AreaListCpn, { AreaListCpnRef } from "@/components/AdminPositionCpn/PositionListCpn/AreaListCpn"
import AreaModal from "@/components/AdminPositionCpn/PositionModalCpn/AreaModal"
import EnhancedAreaModal from "@/components/AdminPositionCpn/PositionModalCpn/EnhancedAreaModal"
import { Area, CreateAreaRequest, UpdateAreaRequest, CreateAreaWithZonesRequest } from "@/types/location.type"
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
import { useRouter } from "next/navigation"

export default function AreasPage() {
    const [selectedArea, setSelectedArea] = useState<Area | null>(null)
    const [showAreaModal, setShowAreaModal] = useState(false)
    const [showEnhancedAreaModal, setShowEnhancedAreaModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isCreatingArea, setIsCreatingArea] = useState(false)
    
    // Create ref to access AreaListCpn methods
    const areaListRef = useRef<AreaListCpnRef>(null)
    const router = useRouter()

    // Cleanup effect to ensure body styles are reset
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    const handleEditArea = useCallback((area: Area) => {
        setSelectedArea(area)
        setShowAreaModal(true)
    }, [])

    const handleViewArea = useCallback((area: Area) => {
        // Use client-side navigation instead of window.location.href
        router.push(`/workspace/admin/location/zones?area=${area.id}`)
    }, [router])

    const handleDeleteArea = useCallback((area: Area) => {
        setSelectedArea(area)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedArea(null)
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }, 300)
    }, [])

    const confirmDeleteArea = useCallback(async () => {
        if (!selectedArea) return
        
        setIsDeleting(true)
        try {
            console.log(`🗑️ Deleting area: ${selectedArea.areaName} (ID: ${selectedArea.id})`)
            
            await apiClient.location.deleteArea(selectedArea.id)
            
            toast.success("Đã xóa khu vực thành công")
            closeDeleteDialog()
            
            // Refetch only the current list data (no page reload)
            if (areaListRef.current) {
                await areaListRef.current.refetchAreas()
                console.log("✅ Area deleted and list refreshed")
            }
            
        } catch (error: any) {
            console.error("❌ Error deleting area:", error)
            
            // Extract error message from response
            let errorMessage = "Xóa khu vực thất bại"
            
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
    }, [selectedArea, closeDeleteDialog])

    const handleAreaModalClose = useCallback((open: boolean) => {
        setShowAreaModal(open)
        
        if (!open) {
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected area after a short delay
            setTimeout(() => {
                setSelectedArea(null)
            }, 100)
        }
    }, [])

    const handleEnhancedAreaModalClose = useCallback(() => {
        setShowEnhancedAreaModal(false)
    }, [])

    const handleDeleteDialogClose = useCallback((open: boolean) => {
        setDeleteDialogOpen(open)
        
        if (!open) {
            closeDeleteDialog()
        }
    }, [closeDeleteDialog])

    const handleAreaSubmit = useCallback(async (data: CreateAreaRequest | UpdateAreaRequest) => {
        try {
            if (selectedArea && 'id' in data) {
                // Update existing area
                console.log("Updating area:", data)
                // await apiClient.location.updateArea(selectedArea.id, data as UpdateAreaRequest)
                toast.success("Khu vực đã được cập nhật thành công")
            } else {
                // Create new area  
                console.log("Creating area:", data)
                // await apiClient.location.createArea(data as CreateAreaRequest)
                toast.success("Khu vực đã được tạo thành công")
            }

            setShowAreaModal(false)
            setSelectedArea(null)

            // Refresh the list
            if (areaListRef.current) {
                await areaListRef.current.refetchAreas()
            }
        } catch (error: any) {
            console.error("Error saving area:", error)
            const action = selectedArea ? "cập nhật" : "tạo"
            toast.error(`Có lỗi xảy ra khi ${action} khu vực: ${error.message || 'Lỗi không xác định'}`)
        }
    }, [selectedArea])

    // ✅ New handler for enhanced area creation
    const handleCreateAreaWithZones = useCallback(async (data: CreateAreaWithZonesRequest) => {
        try {
            setIsCreatingArea(true)
            console.log("Creating area with zones:", data)
            
            await apiClient.location.createAreaWithZonePosition(data)
            
            toast.success(`Đã tạo khu vực "${data.AreaName}" thành công với ${data.Zones.length} khu và ${data.Zones.reduce((sum, zone) => sum + zone.NumberOfPositions, 0)} vị trí!`)
            
            setShowEnhancedAreaModal(false)
            
            // Refresh the list
            if (areaListRef.current) {
                await areaListRef.current.refetchAreas()
            }
        } catch (error: any) {
            console.error("Error creating area with zones:", error)
            
            let errorMessage = "Tạo khu vực thất bại"
            
            if (error.response?.data?.message) {
                errorMessage = error.response.data.message
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error
            } else if (error.message) {
                errorMessage = error.message
            }
            
            toast.error(errorMessage)
        } finally {
            setIsCreatingArea(false)
        }
    }, [])

    const breadcrumbItems = [
        { label: 'Khu vực', isActive: true }
    ];

    return (
        <div className="space-y-6 p-2 bg-background min-h-screen">
            <LocationBreadcrumb items={breadcrumbItems} />
            
            <div className="flex flex-col gap-6">
                <AreaListCpn 
                    ref={areaListRef}
                    onEditArea={handleEditArea}
                    onDeleteArea={handleDeleteArea}
                    onViewArea={handleViewArea}
                    onCreateArea={() => setShowEnhancedAreaModal(true)} // ✅ Connect create handler
                />

                {/* Original Area Modal */}
                <AreaModal
                    isOpen={showAreaModal}
                    onClose={() => handleAreaModalClose(false)}
                    onSubmit={handleAreaSubmit}
                    area={selectedArea}
                    isLoading={false}
                />

                {/* ✅ NEW: Enhanced Area Modal */}
                <EnhancedAreaModal
                    isOpen={showEnhancedAreaModal}
                    onClose={handleEnhancedAreaModalClose}
                    onSubmit={handleCreateAreaWithZones}
                    isLoading={isCreatingArea}
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
                            <AlertDialogTitle>Xác nhận xóa khu vực</AlertDialogTitle>
                            <AlertDialogDescription>
                                Bạn có chắc muốn xóa khu vực
                                {selectedArea && ` "${selectedArea.areaName}"`}? 
                                Thao tác này không thể hoàn tác và sẽ xóa tất cả khu và vị trí trong khu vực này.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeleting}>
                                Hủy
                            </AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={confirmDeleteArea} 
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