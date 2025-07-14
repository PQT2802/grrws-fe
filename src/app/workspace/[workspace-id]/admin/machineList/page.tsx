"use client"

import { useState, useCallback, useEffect } from "react"
import MachineListCpn from "@/components/MachineListCpn/MachineListCpn"
import { MachineDetailModal } from "@/components/MachineCpn/MachineDetailModal"
import { MACHINE_WEB } from "@/types/device.type"
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

export default function MachineListPage() {
    const [selectedMachine, setSelectedMachine] = useState<MACHINE_WEB | null>(null)
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

    const confirmDeleteMachine = useCallback(() => {
        if (!selectedMachine) return
        toast.success(`${selectedMachine.machineName} deletion request submitted.`)
        setDeleteDialogOpen(false)
        setSelectedMachine(null)
    }, [selectedMachine])

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
            // Immediate cleanup
            if (typeof document !== 'undefined') {
                document.body.style.pointerEvents = 'auto'
                document.body.style.overflow = 'auto'
            }
            
            // Clear selected machine after dialog closes
            setTimeout(() => {
                setSelectedMachine(null)
            }, 100)
        }
    }, [])

    return (
        <div className="flex flex-col gap-6 p-6">
            <MachineListCpn 
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
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will submit a deletion request for the machine
                            {selectedMachine && ` "${selectedMachine.machineName}"`}.
                            This machine has {selectedMachine?.deviceIds?.length || 0} associated devices.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleDeleteDialogClose(false)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={() => {
                                confirmDeleteMachine()
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