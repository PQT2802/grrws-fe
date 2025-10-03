'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, RefreshCw, Loader2, Settings, FileText, MapPin } from 'lucide-react'; // ✅ Changed File to FileText
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

interface EnhancedExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => Promise<void>;
  title: string;
  successMessage?: string;
  importType: 'machine' | 'device' | 'area' | 'zone' | 'position' | 'sparepart'; 
  machineOptions?: Array<{ id: string; name: string; code: string }>;
  onLoadMachines?: () => Promise<Array<{ id: string; name: string; code: string }>>;
 
  currentAreaId?: string;
  currentAreaName?: string;
  currentZoneId?: string;
  currentZoneName?: string;
}

export default function EnhancedExcelImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  successMessage = "Import successful",
  importType,
  machineOptions = [],
  onLoadMachines,

  currentAreaId,
  currentAreaName,
  currentZoneId,
  currentZoneName
}: EnhancedExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isLoadingMachines, setIsLoadingMachines] = useState(false);
  const [machines, setMachines] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load machines when modal opens for device import
  useEffect(() => {
    if (isOpen && importType === 'device' && onLoadMachines) {
      loadMachines();
    }
  }, [isOpen, importType, onLoadMachines]);

  const loadMachines = async () => {
    if (!onLoadMachines) return;

    try {
      setIsLoadingMachines(true);
      const machineData = await onLoadMachines();
      setMachines(machineData);
    } catch (error) {
      console.error('Failed to load machines:', error);
      toast.error('Không thể tải danh sách máy');
    } finally {
      setIsLoadingMachines(false);
    }
  };

  // Handle file selection
  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      toast.error("Vui lòng chọn file Excel (.xlsx) hoặc CSV hợp lệ");
      return;
    }

    setSelectedFile(file);
  }, []);

  // ✅ FIXED: Create enhanced file with auto-generated GUIDs and machine assignment
  const createEnhancedFile = useCallback(async (originalFile: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let jsonData: any[] = [];

          // Parse file (existing CSV/Excel logic)
          if (originalFile.type === 'text/csv' || originalFile.name.endsWith('.csv')) {
            const text = data as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim());

            for (let i = 1; i < lines.length; i++) {
              if (lines[i].trim()) {
                const values = lines[i].split(',');
                const row: any = {};
                headers.forEach((header, index) => {
                  row[header] = values[index]?.trim() || '';
                });
                jsonData.push(row);
              }
            }
          } else {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            jsonData = XLSX.utils.sheet_to_json(worksheet);
          }

          // ✅ Process data based on import type
          const processedData = jsonData.map(record => {
            const enhancedRecord = { ...record };

            // ✅ Auto-generate GUID if ID is missing
            if (!enhancedRecord.Id && !enhancedRecord.id) {
              enhancedRecord.Id = uuidv4();
              console.log(`✅ Generated GUID for ${importType}:`, enhancedRecord.Id);
            } else if (enhancedRecord.id && !enhancedRecord.Id) {
              enhancedRecord.Id = enhancedRecord.id;
              delete enhancedRecord.id;
            }

            // ✅ Handle different import types
            switch (importType) {
              case 'device':
                if (selectedMachineId) {
                  enhancedRecord.MachineId = selectedMachineId;
                  enhancedRecord.PositionId = null; // Device goes to warehouse
                  console.log(`✅ Added MachineId to device:`, selectedMachineId);
                }
                break;

              case 'zone':
                if (currentAreaId) {
                  enhancedRecord.AreaId = currentAreaId;
                  console.log(`✅ Added AreaId to zone:`, currentAreaId);
                }
                break;

              case 'position':
                if (currentZoneId) {
                  enhancedRecord.ZoneId = currentZoneId;
                  enhancedRecord.DeviceId = null; // Position starts empty
                  console.log(`✅ Added ZoneId to position:`, currentZoneId);
                  console.log(`✅ Set DeviceId to null for empty position`);
                }
                break;

              // ✅ NEW: Handle spare part imports
              case 'sparepart':
                enhancedRecord.SupplierId = null; // Auto-set supplierId to null
                console.log(`✅ Set SupplierId to null for spare part import`);
                break;

              case 'area':
              case 'machine':
              default:
                // No additional processing needed
                break;
            }

            return enhancedRecord;
          });

          console.log(`✅ Enhanced ${processedData.length} ${importType} records:`, processedData);

          // Create enhanced file (existing logic)
          let enhancedFileContent: Blob;
          let fileName: string;

          if (originalFile.type === 'text/csv' || originalFile.name.endsWith('.csv')) {
            const headers = Object.keys(processedData[0] || {});
            const csvContent = [
              headers.join(','),
              ...processedData.map(row =>
                headers.map(header => `"${row[header] || ''}"`).join(',')
              )
            ].join('\n');

            enhancedFileContent = new Blob([csvContent], { type: 'text/csv' });
            fileName = originalFile.name.replace('.csv', '_enhanced.csv');
          } else {
            const worksheet = XLSX.utils.json_to_sheet(processedData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Enhanced Data');

            const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            enhancedFileContent = new Blob([excelBuffer], {
              type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            fileName = originalFile.name.replace('.xlsx', '_enhanced.xlsx');
          }

          const enhancedFile = new globalThis.File([enhancedFileContent], fileName, {
            type: enhancedFileContent.type
          });

          console.log(`✅ Created enhanced file: ${fileName}`);
          resolve(enhancedFile);

        } catch (error) {
          console.error('File enhancement error:', error);
          reject(new Error('Không thể xử lý file. Vui lòng kiểm tra định dạng file.'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Lỗi khi đọc file'));
      };

      if (originalFile.type === 'text/csv' || originalFile.name.endsWith('.csv')) {
        reader.readAsText(originalFile);
      } else {
        reader.readAsBinaryString(originalFile);
      }
    });
  }, [importType, selectedMachineId, currentAreaId, currentZoneId]);

  // ✅ UPDATED: Enhanced validation
  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file trước khi nhập");
      return;
    }

    // Validate based on import type
    if (importType === 'device' && !selectedMachineId) {
      toast.error("Vui lòng chọn loại máy cho thiết bị");
      return;
    }

    if (importType === 'zone' && !currentAreaId) {
      toast.error("Không xác định được khu vực hiện tại");
      return;
    }

    if (importType === 'position' && !currentZoneId) {
      toast.error("Không xác định được khu hiện tại");
      return;
    }

    try {
      setIsImporting(true);

      const enhancedFile = await createEnhancedFile(selectedFile);
      await onImport(enhancedFile);

      toast.success(successMessage);
      setSelectedFile(null);
      setSelectedMachineId('');
      onClose();

    } catch (error: any) {
      console.error("Import error:", error);
      
      let errorMessage = "Không thể nhập file";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, importType, selectedMachineId, currentAreaId, currentZoneId, createEnhancedFile, onImport, successMessage, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (isImporting) return;

    setSelectedFile(null);
    setSelectedMachineId('');
    onClose();
  }, [isImporting, onClose]);

  // Handle file replacement
  const handleReplaceFile = useCallback(() => {
    setSelectedFile(null);
    setTimeout(() => {
      handleFileSelect();
    }, 100);
  }, [handleFileSelect]);

  // Reset file input when modal closes
  useEffect(() => {
    if (!isOpen && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isOpen]);

  useEffect(() => {
    if (!selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
            {/* ✅ NEW: Context subtitle */}
            {(currentAreaName || currentZoneName) && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {importType === 'zone' && currentAreaName && (
                  <>📍 Khu vực: <span className="font-medium text-blue-600">{currentAreaName}</span></>
                )}
                {importType === 'position' && currentZoneName && (
                  <>📍 Khu: <span className="font-medium text-green-600">{currentZoneName}</span></>
                )}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* ✅ UPDATED: Machine Selection for Device Import (existing) */}
          {importType === 'device' && (
            <div className="mb-6">
              <Label htmlFor="machine-select" className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <span>Chọn loại máy cho thiết bị</span>
                  <span className="text-red-500">*</span>
                </div>
              </Label>
              
              {isLoadingMachines ? (
                <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-center py-3">
                    <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Đang tải danh sách máy...</span>
                  </div>
                </div>
              ) : machines.length === 0 ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                      <Settings className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
                        Không có máy khả dụng
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                        Vui lòng thêm máy trước khi import thiết bị
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* ✅ Enhanced Select with better styling */}
                  <Select value={selectedMachineId} onValueChange={setSelectedMachineId}>
                    <SelectTrigger 
                      id="machine-select"
                      className={`h-12 ${
                        selectedMachineId 
                          ? 'border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700' 
                          : 'border-gray-300 hover:border-blue-400 focus:border-blue-500'
                      } transition-colors`}
                    >
                      <SelectValue 
                        placeholder={
                          <div className="flex items-center gap-3 text-gray-500">
                            <Settings className="w-4 h-4" />
                            <span>Chọn loại máy để gán cho tất cả thiết bị...</span>
                          </div>
                        }
                      />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {machines.length} loại máy khả dụng
                        </p>
                      </div>
                      {machines.map((machine) => (
                        <SelectItem 
                          key={machine.id} 
                          value={machine.id}
                          className="py-3 px-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Settings className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                {machine.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Mã: {machine.code}
                              </div>
                            </div>
                            {selectedMachineId === machine.id && (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* ✅ Selected machine preview */}
                  {selectedMachineId && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                            Đã chọn: {machines.find(m => m.id === selectedMachineId)?.name}
                          </h4>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                            Mã: {machines.find(m => m.id === selectedMachineId)?.code} • 
                            Tất cả thiết bị sẽ được gán vào loại máy này
                          </p>
                        </div>
                        <Button
                          onClick={() => setSelectedMachineId('')}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-900/40"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ✅ NEW: Zone Import Context Info */}
          {importType === 'zone' && currentAreaName && (
            <div className="mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Nhập khu cho khu vực
                    </h4>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                      Khu vực: {currentAreaName} • Các khu mới sẽ được thêm vào khu vực này
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ✅ NEW: Position Import Context Info */}
          {importType === 'position' && currentZoneName && (
            <div className="mb-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-100">
                      Nhập vị trí cho khu
                    </h4>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                      Khu: {currentZoneName} • Các vị trí mới sẽ được thêm vào khu này (trống, không có thiết bị)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* File selection/display area (existing) */}
          {!selectedFile ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Chọn file Excel
              </h3>

              <Button
                onClick={handleFileSelect}
                disabled={isImporting || isLoadingMachines}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Chọn file
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Hỗ trợ file .xlsx, .xls
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>

              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                File đã chọn
              </h3>

              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {selectedFile.name}
              </p>

              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Kích thước: {(selectedFile.size / 1024).toFixed(1)} KB
              </p>

              <Button
                onClick={handleReplaceFile}
                disabled={isImporting}
                variant="outline"
                className="text-blue-600 border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Chọn file khác
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <Button
            onClick={handleClose}
            disabled={isImporting}
            variant="outline"
            className="px-4 py-2"
          >
            Hủy
          </Button>

          <Button
            onClick={handleImport}
            disabled={
              !selectedFile ||
              isImporting ||
              isLoadingMachines ||
              (importType === 'device' && !selectedMachineId) ||
              (importType === 'zone' && !currentAreaId) ||
              (importType === 'position' && !currentZoneId)
            }
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang nhập...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Nhập file
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}