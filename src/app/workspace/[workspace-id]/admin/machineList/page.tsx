"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import MachineListCpn, { MachineListCpnRef } from "@/components/MachineListCpn/MachineListCpn"
import { MachineDetailModal } from "@/components/MachineCpn/MachineDetailModal"
import { MACHINE_WEB } from "@/types/device.type"
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

export default function MachineListPage() {
    const [selectedMachine, setSelectedMachine] = useState<MACHINE_WEB | null>(null)
    const [showDetailModal, setShowDetailModal] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    
    // Create ref to access MachineListCpn methods
    const machineListRef = useRef<MachineListCpnRef>(null)

    // Cleanup effect to ensure body styles are reset
    useEffect(() => {
        return () => {
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }
    }, [])

    const handleEditMachine = useCallback((machine: MACHINE_WEB) => {
        toast.info(`Edit functionality for ${machine.machineName} will be implemented when the API is available.`)
    }, [])

    const handleViewMachine = useCallback((machine: MACHINE_WEB) => {
        // Clear any previous modal state
        setSelectedMachine(null)
        
        // Small delay to ensure clean state
        setTimeout(() => {
            setSelectedMachine(machine)
            setShowDetailModal(true)
        }, 50)
    }, [])

    const handleDeleteMachine = useCallback((machine: MACHINE_WEB) => {
        setSelectedMachine(machine)
        setDeleteDialogOpen(true)
    }, [])

    const closeDeleteDialog = useCallback(() => {
        setDeleteDialogOpen(false)
        setTimeout(() => {
            setSelectedMachine(null)
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
        }, 300)
    }, [])

    const confirmDeleteMachine = useCallback(async () => {
        if (!selectedMachine) return
        
        setIsDeleting(true)
        try {
            console.log(`🗑️ Deleting machine: ${selectedMachine.machineName} (ID: ${selectedMachine.id})`)
            
            await apiClient.machine.deleteMachine(selectedMachine.id)
            
            toast.success("Đã xóa thành công")
            closeDeleteDialog()
            
            // Refetch only the current list data (no page reload)
            if (machineListRef.current) {
                await machineListRef.current.refetchMachines()
                console.log("✅ Machine deleted and list refreshed")
            }
            
        } catch (error: any) {
            console.error("❌ Error deleting machine:", error)
            
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
    }, [selectedMachine, closeDeleteDialog])

    const handleDetailModalClose = useCallback((open: boolean) => {
        setShowDetailModal(open)
        
        if (!open) {
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected machine after modal closes
            setTimeout(() => {
                setSelectedMachine(null)
            }, 150)
        }
    }, [])

    const handleDeleteDialogClose = useCallback((open: boolean) => {
        setDeleteDialogOpen(open)
        
        if (!open) {
            closeDeleteDialog()
        }
    }, [closeDeleteDialog])

    return (
        <div className="flex flex-col gap-6 p-6">
            <MachineListCpn 
                ref={machineListRef}
                onEditMachine={handleEditMachine}
                onDeleteMachine={handleDeleteMachine}
                onViewMachine={handleViewMachine}
            />

            {/* Machine Detail Modal */}
            <MachineDetailModal
                open={showDetailModal}
                onOpenChange={handleDetailModalClose}
                machine={selectedMachine}
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
                            Bạn có chắc muốn xóa máy
                            {selectedMachine && ` "${selectedMachine.machineName}"`}? 
                            Máy này có {selectedMachine?.deviceIds?.length || 0} thiết bị liên kết.
                            Thao tác này không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Hủy
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={confirmDeleteMachine} 
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