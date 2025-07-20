'use client';

import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { DEVICE_WEB } from '@/types/device.type';
import { toast } from 'sonner';

interface ReplaceDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (deviceId: string, reason: string, notes?: string) => Promise<void>;
  requestId: string;
  machineId: string;
  currentDeviceName: string;
  isLoading?: boolean;
}

export default function ReplaceDeviceModal({
  isOpen,
  onClose,
  onConfirm,
  requestId,
  machineId,
  currentDeviceName,
  isLoading = false
}: ReplaceDeviceModalProps) {
  const [availableDevices, setAvailableDevices] = useState<DEVICE_WEB[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isLoadingDevices, setIsLoadingDevices] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch available devices when modal opens
  useEffect(() => {
    if (isOpen && machineId) {
      fetchAvailableDevices();
    }
  }, [isOpen, machineId]);

  const fetchAvailableDevices = async () => {
    try {
      setIsLoadingDevices(true);
      
      console.log(`Fetching devices for machine ID: ${machineId}`);
      
      // First try to get devices by machine ID with Active status
      let devices: DEVICE_WEB[] = [];
      
      try {
        devices = await apiClient.machine.getActiveDevicesByMachineId(machineId);
        console.log('Fetched devices by machine ID:', devices);
      } catch (error) {
        console.warn('Failed to fetch devices by machine ID, trying general device list:', error);
        
        // Fallback: Get all devices and filter by machine ID and active status
        const response: any = await apiClient.device.getDevices(1, 100);
        let allDevices: DEVICE_WEB[] = [];
        
        if (Array.isArray(response)) {
          allDevices = response;
        } else if (response?.data && Array.isArray(response.data)) {
          allDevices = response.data;
        }

        // Filter devices by machine ID and active status
        devices = allDevices.filter(device => 
          device.machineId === machineId && 
          device.status === 'Active'
        );
      }
      
      console.log('Final filtered devices for replacement:', devices);
      setAvailableDevices(devices);
      
    } catch (error) {
      console.error('Failed to fetch available devices:', error);
      toast.error('Không thể tải danh sách thiết bị thay thế');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedDeviceId) {
      toast.error('Vui lòng chọn thiết bị thay thế');
      return;
    }

    try {
      setIsSubmitting(true);
      await onConfirm(selectedDeviceId, reason.trim() || 'Thay thế thiết bị', notes.trim() || undefined);
      
      // Reset form
      setSelectedDeviceId('');
      setReason('');
      setNotes('');
      
      onClose();
    } catch (error) {
      console.error('Error replacing device:', error);
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    
    // Reset form
    setSelectedDeviceId('');
    setReason('');
    setNotes('');
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal content */}
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thay thế thiết bị
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Thiết bị hiện tại: {currentDeviceName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - scrollable */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Device Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Chọn thiết bị thay thế *
            </label>
            
            {/* Device List */}
            {isLoadingDevices ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-gray-500">Đang tải danh sách thiết bị...</span>
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                {availableDevices.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {availableDevices.map((device) => (
                      <div
                        key={device.id}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-700 ${
                          selectedDeviceId === device.id
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500'
                            : ''
                        }`}
                        onClick={() => setSelectedDeviceId(device.id)}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            checked={selectedDeviceId === device.id}
                            onChange={() => setSelectedDeviceId(device.id)}
                            className="text-blue-600"
                          />
                          <Package className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-gray-100">
                              {device.deviceName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {device.deviceCode} • {device.serialNumber} • {device.model}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {device.status} • {device.manufacturer}
                            </div>
                            {device.areaName && (
                              <div className="text-xs text-gray-400">
                                Vị trí: {device.areaName} - {device.zoneName}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Không có thiết bị khả dụng cho máy này
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reason - Optional */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Lý do thay thế
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Nhập lý do thay thế thiết bị (tùy chọn)..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-100"
            />
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ghi chú
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm nếu có..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-slate-700/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-6 py-2"
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDeviceId}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Đang thay thế...
              </div>
            ) : (
              'Xác nhận thay thế'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}