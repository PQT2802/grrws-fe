import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Factory,
  Settings,
  Image as ImageIcon,
  Tag,
  FileText,
  Monitor,
  Clock,
  Eye,
  Loader2
} from "lucide-react";
import { MACHINE_WEB, DEVICE_WEB } from "@/types/device.type";
import { apiClient } from "@/lib/api-client";
import DeviceDetailModal from "@/components/DeviceCpn/DeviceDetailModal";

interface MachineDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  machine: MACHINE_WEB | null;
}

interface DeviceDisplayInfo {
  id: string;
  deviceName: string;
  deviceCode: string;
  fullDevice?: DEVICE_WEB;
  isLoading?: boolean;
  error?: string;
}

export const MachineDetailModal = ({
  open,
  onOpenChange,
  machine
}: MachineDetailModalProps) => {
  const [deviceDisplayInfos, setDeviceDisplayInfos] = useState<DeviceDisplayInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<DEVICE_WEB | null>(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);

  // Handle modal close with proper cleanup - BUT NOT when child modal is opening
  const handleOpenChange = (newOpen: boolean) => {
    // Don't close if child modal is opening/open
    if (!newOpen && showDeviceModal) {
      return; // Prevent closing when device modal is open
    }

    // Immediately call the parent's onOpenChange
    onOpenChange(newOpen);

    // If closing and no child modal is open, restore pointer events
    if (!newOpen && !showDeviceModal) {
      setTimeout(() => {
        if (typeof document !== 'undefined') {
          document.body.style.pointerEvents = "auto";
          document.body.style.overflow = "auto";
        }
      }, 100);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "2-digit",
    })
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400 border-0"
      case "discontinued":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400 border-0"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400 border-0"
    }
  }

  // Fetch device details for each deviceId
  useEffect(() => {
    if (open && machine?.deviceIds && machine.deviceIds.length > 0) {
      const fetchDeviceDetails = async () => {
        // Initialize with loading state
        const initialInfos: DeviceDisplayInfo[] = machine.deviceIds.map((deviceId, index) => ({
          id: deviceId,
          deviceName: `Loading...`,
          deviceCode: `Loading...`,
          isLoading: true
        }));
        setDeviceDisplayInfos(initialInfos);

        // Fetch each device's details
        const updatedInfos = await Promise.all(
          machine.deviceIds.map(async (deviceId, index) => {
            try {
              console.log(`🔄 Fetching device details for ID: ${deviceId}`);
              const deviceDetail = await apiClient.device.getDeviceById(deviceId);
              console.log(`✅ Device details fetched:`, deviceDetail);

              return {
                id: deviceId,
                deviceName: deviceDetail.deviceName || `Device #${index + 1}`,
                deviceCode: deviceDetail.deviceCode || 'N/A',
                fullDevice: deviceDetail,
                isLoading: false
              };
            } catch (error) {
              console.error(`❌ Error fetching device ${deviceId}:`, error);
              return {
                id: deviceId,
                deviceName: `Device #${index + 1}`,
                deviceCode: 'Failed to load',
                isLoading: false,
                error: 'Failed to load device details'
              };
            }
          })
        );

        setDeviceDisplayInfos(updatedInfos);
      };

      fetchDeviceDetails();
    } else {
      setDeviceDisplayInfos([]);
    }
  }, [open, machine?.deviceIds]);

  const handleViewDevice = (deviceInfo: DeviceDisplayInfo) => {
    if (deviceInfo.fullDevice) {
      console.log("🔄 Opening device modal for:", deviceInfo.deviceName);
      setSelectedDevice(deviceInfo.fullDevice);
      setShowDeviceModal(true);
    }
  };

  const handleDeviceModalClose = (newOpen: boolean) => {
    console.log("🔄 Device modal close event:", newOpen);
    setShowDeviceModal(newOpen);

    if (!newOpen) {
      // Clear selected device after modal closes
      setTimeout(() => {
        setSelectedDevice(null);
        console.log("✅ Device modal cleanup completed");
      }, 100);
    }
  };

  // Handle escape key for the machine modal only when device modal is closed
  const handleEscapeKey = () => {
    if (!showDeviceModal) {
      handleOpenChange(false);
    }
  };

  // Handle click outside for the machine modal only when device modal is closed
  const handleInteractOutside = () => {
    if (!showDeviceModal) {
      handleOpenChange(false);
    }
  };

  if (!machine) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto"
          onEscapeKeyDown={handleEscapeKey}
          onInteractOutside={handleInteractOutside}
        >
          <DialogHeader>
            <DialogTitle>Machine Details</DialogTitle>
            <DialogDescription>
              View comprehensive information about this machine
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {/* Header Section */}
            <div className="space-y-1">
                <h3 className="text-xl font-semibold">{machine.machineName}</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className={getStatusBadgeVariant(machine.status)}>
                    {machine.status}
                  </Badge>
              </div>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Machine Details</TabsTrigger>
                <TabsTrigger value="devices">
                  Linked Devices ({machine.deviceIds?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Machine Details Tab */}
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Machine Name</Label>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{machine.machineName}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Machine Code</Label>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{machine.machineCode}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Manufacturer</Label>
                    <div className="flex items-center gap-2">
                      <Factory className="h-4 w-4 text-muted-foreground" />
                      <span>{machine.manufacturer}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Model</Label>
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span>{machine.model}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Release Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(machine.releaseDate)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Linked Devices</Label>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {machine.deviceIds?.length || 0} devices
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Description</Label>
                  <div className="text-sm font-medium mt-1">
                    {machine.description || "N/A"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Specifications</Label>
                  <div className="text-sm font-medium mt-1">
                    {machine.specifications || "N/A"}
                  </div>
                </div>

                {machine.photoUrl && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Photo URL</Label>
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <a
                        href={machine.photoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline truncate max-w-xs text-sm"
                      >
                        {machine.photoUrl}
                      </a>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Linked Devices Tab */}
              <TabsContent value="devices" className="space-y-4">
                {deviceDisplayInfos.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      This machine type has {deviceDisplayInfos.length} device{deviceDisplayInfos.length !== 1 ? 's' : ''} of this type:
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {deviceDisplayInfos.map((deviceInfo, index) => (
                        <div
                          key={deviceInfo.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-muted/20 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Monitor className="h-5 w-5 text-blue-600" />
                            <div className="flex-1">
                              <div className="font-medium text-base flex items-center gap-2">
                                Device #{index + 1}:
                                {deviceInfo.isLoading ? (
                                  <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-muted-foreground">Loading...</span>
                                  </div>
                                ) : (
                                  <span className="text-blue-700">{deviceInfo.deviceName}</span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground font-mono mt-1">
                                {deviceInfo.isLoading ? 'Loading...' : deviceInfo.deviceCode}
                              </div>
                              {deviceInfo.error && (
                                <div className="text-xs text-red-500 mt-1">
                                  {deviceInfo.error}
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent event bubbling
                              handleViewDevice(deviceInfo);
                            }}
                            disabled={deviceInfo.isLoading || !!deviceInfo.error || !deviceInfo.fullDevice}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="text-xs text-muted-foreground mt-3">
                      * Click the eye icon to view detailed device information
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No devices of this machine type found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Devices can be configured to use this machine type during device creation or editing
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Device Detail Modal - Stacked on top */}
      {selectedDevice && (
        <DeviceDetailModal
          open={showDeviceModal}
          onOpenChange={handleDeviceModalClose}
          device={selectedDevice}
        />
      )}
    </>
  );
};