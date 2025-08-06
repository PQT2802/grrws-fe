"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import DeviceListCpn, { DeviceListCpnRef } from "@/components/DeviceListCpn/DeviceListCpn"
import DeviceDetailModal from "@/components/DeviceCpn/DeviceDetailModal"
import { DEVICE_WEB } from "@/types/device.type"
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

export default function StockKeeperDeviceListPage() {
    const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Create ref to access DeviceListCpn methods
    const deviceListRef = useRef<DeviceListCpnRef>(null)

    // Cleanup effect to ensure body styles are reset
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    const handleEditDevice = useCallback((device: DEVICE_WEB) => {
        toast.info(`Chức năng chỉnh sửa cho ${device.deviceName} sẽ được triển khai khi API có sẵn.`)
    }, [])

    const handleViewDevice = useCallback((device: DEVICE_WEB) => {
        setSelectedDevice(device)
        setShowDetailModal(true)
    }, [])

    const handleDeleteDevice = useCallback((device: DEVICE_WEB) => {
        setSelectedDevice(device)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedDevice(null)
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }, 300)
    }, [])

    const confirmDeleteDevice = useCallback(async () => {
        if (!selectedDevice) return
        
        setIsDeleting(true)
        try {
            console.log(`🗑️ Xóa thiết bị: ${selectedDevice.deviceName} (ID: ${selectedDevice.id})`)
            
            await apiClient.device.deleteDevice(selectedDevice.id)
            
            toast.success("Đã xóa thành công")
            closeDeleteDialog()
            
            // Refetch only the current list data (no page reload)
            if (deviceListRef.current) {
                await deviceListRef.current.refetchDevices()
                console.log("✅ Thiết bị đã được xóa và danh sách đã được làm mới")
            }
            
        } catch (error: any) {
            console.error("❌ Lỗi khi xóa thiết bị:", error)
            
            // Extract error message from response
            let errorMessage = "Xóa thất bại"
            
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
    }, [selectedDevice, closeDeleteDialog])

    const handleDetailModalClose = useCallback((open: boolean) => {
        setShowDetailModal(open)
        
        if (!open) {
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected device after a short delay
            setTimeout(() => {
                setSelectedDevice(null)
            }, 100)
        }
    }, [])

    const handleDeleteDialogClose = useCallback((open: boolean) => {
        setDeleteDialogOpen(open)
        
        if (!open) {
            closeDeleteDialog()
        }
    }, [closeDeleteDialog])

    return (
        <div className="flex flex-col gap-6 p-2">
            <DeviceListCpn 
                ref={deviceListRef}
                onEditDevice={handleEditDevice}
                onDeleteDevice={handleDeleteDevice}
                onViewDevice={handleViewDevice}
            />

            {/* Device Detail Modal */}
            <DeviceDetailModal
                open={showDetailModal}
                onOpenChange={handleDetailModalClose}
                device={selectedDevice}
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
                        <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc muốn xóa thiết bị
                            {selectedDevice && ` "${selectedDevice.deviceName}"`}? 
                            Thao tác này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteDevice} 
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Đang xóa..." : "Xóa"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}