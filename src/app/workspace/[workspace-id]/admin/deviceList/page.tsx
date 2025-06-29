"use client"

import { useState, useCallback, useEffect } from "react"
import DeviceListCpn from "@/components/DeviceListCpn/DeviceListCpn"
import DeviceDetailModal from "@/components/DeviceCpn/DeviceDetailModal"
import { DEVICE_WEB } from "@/types/device.type"
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

export default function DeviceListPage() {
    const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    // Cleanup effect to ensure body styles are reset
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    const handleCreateDevice = useCallback(() => {
        toast.info("Create device functionality will be implemented when the API is available.")
    }, [])

    const handleEditDevice = useCallback((device: DEVICE_WEB) => {
        toast.info(`Edit functionality for ${device.deviceName} will be implemented when the API is available.`)
    }, [])

    const handleViewDevice = useCallback((device: DEVICE_WEB) => {
        setSelectedDevice(device)
        setShowDetailModal(true)
    }, [])

    const handleDeleteDevice = useCallback((device: DEVICE_WEB) => {
        setSelectedDevice(device)
        setDeleteDialogOpen(true)
    }, [])

    const confirmDeleteDevice = useCallback(() => {
        if (!selectedDevice) return
        toast.success(`${selectedDevice.deviceName} deletion request submitted.`)
        setDeleteDialogOpen(false)
        setSelectedDevice(null)
    }, [selectedDevice])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setSelectedDevice(null)
    }, [])

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

    return (
        <div className="flex flex-col gap-6 p-6">
            <DeviceListCpn 
                onCreateDevice={handleCreateDevice}
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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will submit a deletion request for the device
                            {selectedDevice && ` "${selectedDevice.deviceName}"`}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleDeleteDialogClose(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                confirmDeleteDevice()
                                handleDeleteDialogClose(false)
                            }} 
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}