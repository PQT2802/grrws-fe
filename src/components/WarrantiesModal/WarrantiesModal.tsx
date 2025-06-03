"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatTimeStampDate } from "@/lib/utils";
import { WARRANTY_LIST } from "@/types/warranty.type";
import warrantyService from "@/app/service/warranty.service";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";

interface WarrantiesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
}

const WarrantiesModal = ({
  open,
  onOpenChange,
  deviceId,
  deviceName,
}: WarrantiesModalProps) => {
  const [warranties, setWarranties] = useState<WARRANTY_LIST[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchWarranties = async () => {
      if (!open || !deviceId) return;

      try {
        setLoading(true);
        const data = await warrantyService.getDeviceWarranties(deviceId);
        setWarranties(data);
      } catch (error) {
        console.error("Failed to fetch warranties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWarranties();
  }, [open, deviceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Warranties</DialogTitle>
          <DialogDescription>
            Active warranties for device: {deviceName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="mt-4">
            {warranties.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No warranties found for this device.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warranty Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Under Warranty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warranties.map((warranty, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {warranty.warrantyCode}
                      </TableCell>
                      <TableCell>{warranty.warrantyType}</TableCell>
                      <TableCell>{warranty.provider}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            warranty.warrantyStatus === "InUsed"
                              ? "default"
                              : warranty.warrantyStatus === "Completed"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {warranty.warrantyStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatTimeStampDate(
                          warranty.warrantyStartDate,
                          "date"
                        )}
                      </TableCell>
                      <TableCell>
                        {formatTimeStampDate(warranty.warrantyEndDate, "date")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            warranty.isUnderWarranty ? "default" : "destructive"
                          }
                        >
                          {warranty.isUnderWarranty ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WarrantiesModal;
