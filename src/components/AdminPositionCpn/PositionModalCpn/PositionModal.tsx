'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Position, CreatePositionRequest, UpdatePositionRequest, Zone } from '@/types/location.type';

interface PositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePositionRequest | UpdatePositionRequest) => void;
  position?: Position | null;
  zones: Zone[];
  isLoading?: boolean;
  selectedZoneId?: string;
}

export default function PositionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  position, 
  zones,
  isLoading = false,
  selectedZoneId
}: PositionModalProps) {
  const [formData, setFormData] = useState({
    positionCode: '',
    positionName: '',
    description: '',
    zoneId: selectedZoneId || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (position) {
      setFormData({
        positionCode: position.positionCode,
        positionName: position.positionName,
        description: position.description || '',
        zoneId: position.zoneId
      });
    } else {
      setFormData({
        positionCode: '',
        positionName: '',
        description: '',
        zoneId: selectedZoneId || ''
      });
    }
    setErrors({});
  }, [position, isOpen, selectedZoneId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.positionCode.trim()) {
      newErrors.positionCode = 'Mã vị trí là bắt buộc';
    } else if (formData.positionCode.length < 2) {
      newErrors.positionCode = 'Mã vị trí phải có ít nhất 2 ký tự';
    }

    if (!formData.positionName.trim()) {
      newErrors.positionName = 'Tên vị trí là bắt buộc';
    } else if (formData.positionName.length < 3) {
      newErrors.positionName = 'Tên vị trí phải có ít nhất 3 ký tự';
    }

    if (!formData.zoneId) {
      newErrors.zoneId = 'Vui lòng chọn khu';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = position 
      ? { ...formData, id: position.id, index: position.index } as UpdatePositionRequest
      : { ...formData, index: 0 } as CreatePositionRequest;

    onSubmit(submitData);
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {position ? 'Chỉnh sửa vị trí' : 'Thêm vị trí mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zoneId">Khu *</Label>
            <Select
              value={formData.zoneId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, zoneId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.zoneId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn khu" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.zoneCode} - {zone.zoneName}
                    {zone.areaName && (
                      <span className="text-gray-500 text-sm ml-2">
                        ({zone.areaCode})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.zoneId && (
              <p className="text-sm text-red-500">{errors.zoneId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionCode">Mã vị trí *</Label>
            <Input
              id="positionCode"
              value={formData.positionCode}
              onChange={(e) => setFormData(prev => ({ ...prev, positionCode: e.target.value }))}
              placeholder="Ví dụ: P01"
              disabled={isLoading}
              className={errors.positionCode ? 'border-red-500' : ''}
            />
            {errors.positionCode && (
              <p className="text-sm text-red-500">{errors.positionCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="positionName">Tên vị trí *</Label>
            <Input
              id="positionName"
              value={formData.positionName}
              onChange={(e) => setFormData(prev => ({ ...prev, positionName: e.target.value }))}
              placeholder="Ví dụ: Máy hàn số 1"
              disabled={isLoading}
              className={errors.positionName ? 'border-red-500' : ''}
            />
            {errors.positionName && (
              <p className="text-sm text-red-500">{errors.positionName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về vị trí này..."
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : (position ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}