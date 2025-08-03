'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zone, CreateZoneRequest, UpdateZoneRequest, Area } from '@/types/location.type';

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateZoneRequest | UpdateZoneRequest) => void;
  zone?: Zone | null;
  areas: Area[];
  isLoading?: boolean;
  selectedAreaId?: string;
}

export default function ZoneModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  zone, 
  areas,
  isLoading = false,
  selectedAreaId
}: ZoneModalProps) {
  const [formData, setFormData] = useState<CreateZoneRequest>({
    zoneCode: '',
    zoneName: '',
    description: '',
    areaId: selectedAreaId || ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (zone) {
      setFormData({
        zoneCode: zone.zoneCode,
        zoneName: zone.zoneName,
        description: zone.description || '',
        areaId: zone.areaId
      });
    } else {
      setFormData({
        zoneCode: '',
        zoneName: '',
        description: '',
        areaId: selectedAreaId || ''
      });
    }
    setErrors({});
  }, [zone, isOpen, selectedAreaId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.zoneCode.trim()) {
      newErrors.zoneCode = 'Mã khu là bắt buộc';
    } else if (formData.zoneCode.length < 2) {
      newErrors.zoneCode = 'Mã khu phải có ít nhất 2 ký tự';
    }

    if (!formData.zoneName.trim()) {
      newErrors.zoneName = 'Tên khu là bắt buộc';
    } else if (formData.zoneName.length < 3) {
      newErrors.zoneName = 'Tên khu phải có ít nhất 3 ký tự';
    }

    if (!formData.areaId) {
      newErrors.areaId = 'Vui lòng chọn khu vực';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = zone 
      ? { ...formData, id: zone.id } as UpdateZoneRequest
      : formData as CreateZoneRequest;

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
            {zone ? 'Chỉnh sửa khu' : 'Thêm khu mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="areaId">Khu vực *</Label>
            <Select
              value={formData.areaId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, areaId: value }))}
              disabled={isLoading}
            >
              <SelectTrigger className={errors.areaId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Chọn khu vực" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.areaCode} - {area.areaName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.areaId && (
              <p className="text-sm text-red-500">{errors.areaId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoneCode">Mã khu *</Label>
            <Input
              id="zoneCode"
              value={formData.zoneCode}
              onChange={(e) => setFormData(prev => ({ ...prev, zoneCode: e.target.value }))}
              placeholder="Ví dụ: Z01"
              disabled={isLoading}
              className={errors.zoneCode ? 'border-red-500' : ''}
            />
            {errors.zoneCode && (
              <p className="text-sm text-red-500">{errors.zoneCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="zoneName">Tên khu *</Label>
            <Input
              id="zoneName"
              value={formData.zoneName}
              onChange={(e) => setFormData(prev => ({ ...prev, zoneName: e.target.value }))}
              placeholder="Ví dụ: Dây chuyền lắp ráp A"
              disabled={isLoading}
              className={errors.zoneName ? 'border-red-500' : ''}
            />
            {errors.zoneName && (
              <p className="text-sm text-red-500">{errors.zoneName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về khu này..."
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
              {isLoading ? 'Đang xử lý...' : (zone ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}