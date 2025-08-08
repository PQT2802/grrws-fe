"use client";

import React, { useState } from "react";
import { AlertCircle, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeviceAvailableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  requestTitle: string;
  isLoading?: boolean;
}

export default function ConfirmDeviceAvailableModal({
  isOpen,
  onClose,
  onConfirm,
  requestTitle,
  isLoading = false,
}: ConfirmDeviceAvailableModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsConfirming(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error("Error confirming device availability:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Xác nhận thiết bị thay thế
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isConfirming}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Yêu cầu:
            </p>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {requestTitle}
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                  Xác nhận thiết bị đã sẵn sàng
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Bạn có chắc chắn rằng thiết bị thay thế đã sẵn sàng và có thể
                  tiến hành thay thế không? Hành động này sẽ chuyển trạng thái
                  yêu cầu sang &quot;Đang tiến hành&quot;.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  Lưu ý quan trọng
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Chỉ xác nhận khi thiết bị thay thế đã được kiểm tra và sẵn
                  sàng để lắp đặt. Không thể hoàn tác hành động này.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isConfirming}
            className="px-4 py-2"
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white"
          >
            {isConfirming ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang xác nhận...
              </div>
            ) : (
              "Xác nhận thiết bị sẵn sàng"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
