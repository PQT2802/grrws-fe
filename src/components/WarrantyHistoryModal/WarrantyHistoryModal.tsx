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
import { WARRANTY_HISTORY_LIST } from "@/types/warranty.type";
import warrantyService from "@/app/service/warranty.service";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";

interface WarrantyHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  deviceName: string;
}

const WarrantyHistoryModal = ({
  open,
  onOpenChange,
  deviceId,
  deviceName,
}: WarrantyHistoryModalProps) => {
  const [history, setHistory] = useState<WARRANTY_HISTORY_LIST[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!open || !deviceId) return;

      try {
        setLoading(true);
        const data = await warrantyService.getWarrantyHistory(deviceId);
        setHistory(data);
      } catch (error) {
        console.error("Failed to fetch warranty history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [open, deviceId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lịch sử bảo hành</DialogTitle>
          <DialogDescription>
            Lịch sử bảo hành cho thiết bị: {deviceName}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <SkeletonCard />
        ) : (
          <div className="mt-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Không tìm thấy lịch sử bảo hành cho thiết bị này.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mô tả thiết bị</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Ngày gửi</TableHead>
                    <TableHead>Ngày nhận</TableHead>
                    <TableHead>Nhà cung cấp</TableHead>
                    <TableHead>Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.deviceDescription}</TableCell>
                      <TableCell>
                        <Badge variant={item.status ? "default" : "secondary"}>
                          {item.status ? "Đang hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.sendDate
                          ? formatTimeStampDate(item.sendDate, "date")
                          : "---"}
                      </TableCell>
                      <TableCell>
                        {item.receiveDate
                          ? formatTimeStampDate(item.receiveDate, "date")
                          : "---"}
                      </TableCell>
                      <TableCell>{item.provider || "---"}</TableCell>
                      <TableCell>{item.note || "---"}</TableCell>
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

export default WarrantyHistoryModal;
