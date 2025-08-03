'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Area, CreateAreaRequest, UpdateAreaRequest } from '@/types/location.type';

interface AreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAreaRequest | UpdateAreaRequest) => void;
  area?: Area | null;
  isLoading?: boolean;
}

export default function AreaModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  area, 
  isLoading = false 
}: AreaModalProps) {
  const [formData, setFormData] = useState<CreateAreaRequest>({
    areaCode: '',
    areaName: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (area) {
      setFormData({
        areaCode: area.areaCode,
        areaName: area.areaName,
        description: area.description || ''
      });
    } else {
      setFormData({
        areaCode: '',
        areaName: '',
        description: ''
      });
    }
    setErrors({});
  }, [area, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.areaCode.trim()) {
      newErrors.areaCode = 'Mã khu vực là bắt buộc';
    } else if (formData.areaCode.length < 2) {
      newErrors.areaCode = 'Mã khu vực phải có ít nhất 2 ký tự';
    }

    if (!formData.areaName.trim()) {
      newErrors.areaName = 'Tên khu vực là bắt buộc';
    } else if (formData.areaName.length < 3) {
      newErrors.areaName = 'Tên khu vực phải có ít nhất 3 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const submitData = area 
      ? { ...formData, id: area.id } as UpdateAreaRequest
      : formData as CreateAreaRequest;

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
            {area ? 'Chỉnh sửa khu vực' : 'Thêm khu vực mới'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="areaCode">Mã khu vực *</Label>
            <Input
              id="areaCode"
              value={formData.areaCode}
              onChange={(e) => setFormData(prev => ({ ...prev, areaCode: e.target.value }))}
              placeholder="Ví dụ: KV01"
              disabled={isLoading}
              className={errors.areaCode ? 'border-red-500' : ''}
            />
            {errors.areaCode && (
              <p className="text-sm text-red-500">{errors.areaCode}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaName">Tên khu vực *</Label>
            <Input
              id="areaName"
              value={formData.areaName}
              onChange={(e) => setFormData(prev => ({ ...prev, areaName: e.target.value }))}
              placeholder="Ví dụ: Khu vực sản xuất chính"
              disabled={isLoading}
              className={errors.areaName ? 'border-red-500' : ''}
            />
            {errors.areaName && (
              <p className="text-sm text-red-500">{errors.areaName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả chi tiết về khu vực này..."
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
              {isLoading ? 'Đang xử lý...' : (area ? 'Cập nhật' : 'Thêm mới')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}