'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Plus, 
  Trash2, 
  MapPin, 
  Building, 
  Hash,
  X,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { CreateAreaWithZonesRequest, ZoneInput } from '@/types/location.type';

interface EnhancedAreaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateAreaWithZonesRequest) => Promise<void>;
  isLoading?: boolean;
}

export default function EnhancedAreaModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false
}: EnhancedAreaModalProps) {
  // Area form state
  const [areaName, setAreaName] = useState('');
  const [areaCode, setAreaCode] = useState('');
  
  // Zones state
  const [zones, setZones] = useState<ZoneInput[]>([
    {
      id: uuidv4(),
      ZoneName: '',
      ZoneCode: '',
      NumberOfPositions: 1
    }
  ]);

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAreaName('');
      setAreaCode('');
      setZones([{
        id: uuidv4(),
        ZoneName: '',
        ZoneCode: '',
        NumberOfPositions: 1
      }]);
      setErrors({});
    }
  }, [isOpen]);

  // Add new zone
  const handleAddZone = useCallback(() => {
    const newZone: ZoneInput = {
      id: uuidv4(),
      ZoneName: '',
      ZoneCode: '',
      NumberOfPositions: 1
    };
    setZones(prev => [...prev, newZone]);
  }, []);

  // Remove zone
  const handleRemoveZone = useCallback((zoneId: string) => {
    if (zones.length === 1) {
      toast.warning('Phải có ít nhất một khu trong khu vực');
      return;
    }
    setZones(prev => prev.filter(zone => zone.id !== zoneId));
  }, [zones.length]);

  // Update zone data
  const handleZoneChange = useCallback((zoneId: string, field: keyof Omit<ZoneInput, 'id'>, value: string | number) => {
    setZones(prev => prev.map(zone => 
      zone.id === zoneId 
        ? { ...zone, [field]: value }
        : zone
    ));
    
    // Clear specific error when user starts typing
    if (errors[`zone_${zoneId}_${field}`]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[`zone_${zoneId}_${field}`];
        return newErrors;
      });
    }
  }, [errors]);

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate area fields
    if (!areaName.trim()) {
      newErrors.areaName = 'Tên khu vực là bắt buộc';
    }
    if (!areaCode.trim()) {
      newErrors.areaCode = 'Mã khu vực là bắt buộc';
    }

    // Validate zones
    const usedZoneCodes = new Set<string>();
    zones.forEach((zone, index) => {
      const prefix = `zone_${zone.id}`;
      
      if (!zone.ZoneName.trim()) {
        newErrors[`${prefix}_ZoneName`] = 'Tên khu là bắt buộc';
      }
      
      if (!zone.ZoneCode.trim()) {
        newErrors[`${prefix}_ZoneCode`] = 'Mã khu là bắt buộc';
      } else if (usedZoneCodes.has(zone.ZoneCode.trim())) {
        newErrors[`${prefix}_ZoneCode`] = 'Mã khu đã được sử dụng';
      } else {
        usedZoneCodes.add(zone.ZoneCode.trim());
      }
      
      if (zone.NumberOfPositions < 1) {
        newErrors[`${prefix}_NumberOfPositions`] = 'Số vị trí phải ít nhất là 1';
      }
      if (zone.NumberOfPositions > 100) {
        newErrors[`${prefix}_NumberOfPositions`] = 'Số vị trí không được vượt quá 100';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [areaName, areaCode, zones]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    try {
      const requestData: CreateAreaWithZonesRequest = {
        AreaName: areaName.trim(),
        AreaCode: areaCode.trim(),
        Zones: zones.map(zone => ({
          ZoneName: zone.ZoneName.trim(),
          ZoneCode: zone.ZoneCode.trim(),
          NumberOfPositions: zone.NumberOfPositions
        }))
      };

      console.log('✅ Submitting area with zones:', requestData);
      
      await onSubmit(requestData);
      
      // Reset form after successful submission
      setAreaName('');
      setAreaCode('');
      setZones([{
        id: uuidv4(),
        ZoneName: '',
        ZoneCode: '',
        NumberOfPositions: 1
      }]);
      setErrors({});
      
    } catch (error) {
      console.error('❌ Error submitting area:', error);
      // Error is handled by parent component
    }
  }, [validateForm, areaName, areaCode, zones, onSubmit]);

  // Calculate totals
  const totalPositions = zones.reduce((sum, zone) => sum + zone.NumberOfPositions, 0);
  const totalZones = zones.length;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600" />
            Tạo khu vực mới
          </DialogTitle>
          <DialogDescription>
            Tạo khu vực với các khu và vị trí tương ứng
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Area Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Thông tin khu vực
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="areaName">
                    Tên khu vực <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaName"
                    value={areaName}
                    onChange={(e) => {
                      setAreaName(e.target.value);
                      if (errors.areaName) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.areaName;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Nhập tên khu vực..."
                    className={errors.areaName ? 'border-red-500' : ''}
                  />
                  {errors.areaName && (
                    <p className="text-sm text-red-500">{errors.areaName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaCode">
                    Mã khu vực <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaCode"
                    value={areaCode}
                    onChange={(e) => {
                      setAreaCode(e.target.value);
                      if (errors.areaCode) {
                        setErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.areaCode;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Nhập mã khu vực..."
                    className={errors.areaCode ? 'border-red-500' : ''}
                  />
                  {errors.areaCode && (
                    <p className="text-sm text-red-500">{errors.areaCode}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zones Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Danh sách khu
                  <Badge variant="secondary" className="ml-2">
                    {totalZones} khu, {totalPositions} vị trí
                  </Badge>
                </CardTitle>
                <Button 
                  type="button"
                  onClick={handleAddZone}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Thêm khu
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {zones.map((zone, index) => (
                <Card key={zone.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Khu {index + 1}
                      </h4>
                      {zones.length > 1 && (
                        <Button
                          type="button"
                          onClick={() => handleRemoveZone(zone.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`zoneName_${zone.id}`}>
                          Tên khu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`zoneName_${zone.id}`}
                          value={zone.ZoneName}
                          onChange={(e) => handleZoneChange(zone.id, 'ZoneName', e.target.value)}
                          placeholder="Nhập tên khu..."
                          className={errors[`zone_${zone.id}_ZoneName`] ? 'border-red-500' : ''}
                        />
                        {errors[`zone_${zone.id}_ZoneName`] && (
                          <p className="text-sm text-red-500">{errors[`zone_${zone.id}_ZoneName`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`zoneCode_${zone.id}`}>
                          Mã khu <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`zoneCode_${zone.id}`}
                          value={zone.ZoneCode}
                          onChange={(e) => handleZoneChange(zone.id, 'ZoneCode', e.target.value)}
                          placeholder="Nhập mã khu..."
                          className={errors[`zone_${zone.id}_ZoneCode`] ? 'border-red-500' : ''}
                        />
                        {errors[`zone_${zone.id}_ZoneCode`] && (
                          <p className="text-sm text-red-500">{errors[`zone_${zone.id}_ZoneCode`]}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`numberOfPositions_${zone.id}`}>
                          Số vị trí <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id={`numberOfPositions_${zone.id}`}
                          type="number"
                          min="1"
                          max="100"
                          value={zone.NumberOfPositions}
                          onChange={(e) => handleZoneChange(zone.id, 'NumberOfPositions', parseInt(e.target.value) || 1)}
                          placeholder="Số vị trí..."
                          className={errors[`zone_${zone.id}_NumberOfPositions`] ? 'border-red-500' : ''}
                        />
                        {errors[`zone_${zone.id}_NumberOfPositions`] && (
                          <p className="text-sm text-red-500">{errors[`zone_${zone.id}_NumberOfPositions`]}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Tổng số khu:</span>
                    <Badge variant="secondary">{totalZones}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Tổng số vị trí:</span>
                    <Badge variant="secondary">{totalPositions}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Tạo khu vực
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}