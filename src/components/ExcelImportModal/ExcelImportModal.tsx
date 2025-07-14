'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, File, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  title: string;
  successMessage?: string;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  successMessage = "Import successful"
}: ExcelImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection - FIXED to allow re-selecting same file
  const handleFileSelect = useCallback(() => {
    // Clear the file input value to allow re-selecting the same file
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
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error("Vui lòng chọn file Excel hợp lệ (.xlsx)");
      return;
    }

    setSelectedFile(file);
  }, []);

  // Handle import action
  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      toast.error("Vui lòng chọn file trước khi nhập");
      return;
    }

    try {
      setIsImporting(true);
      
      await onImport(selectedFile);
      
      toast.success(successMessage);
      
      // Reset state and close modal
      setSelectedFile(null);
      onClose();
      
    } catch (error: any) {
      console.error("Import error:", error);
      
      // Extract error message
      let errorMessage = "Không thể nhập file";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
      
      // Keep modal open for retry
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, onImport, successMessage, onClose]);

  // Handle modal close
  const handleClose = useCallback(() => {
    if (isImporting) return; // Prevent closing during import
    
    setSelectedFile(null);
    onClose();
  }, [isImporting, onClose]);

  // Handle file replacement - FIXED to allow re-selecting same file
  const handleReplaceFile = useCallback(() => {
    // Clear the current selected file first
    setSelectedFile(null);
    
    // Small delay to ensure state is updated before opening file picker
    setTimeout(() => {
      handleFileSelect();
    }, 100);
  }, [handleFileSelect]);

  // Reset file input when modal closes
  React.useEffect(() => {
    if (!isOpen && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [isOpen]);

  // Reset file input when selectedFile changes to null
  React.useEffect(() => {
    if (!selectedFile && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFile]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h2>
          <button
            onClick={handleClose}
            disabled={isImporting}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {!selectedFile ? (
            /* File selection area */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Chọn file Excel
              </h3>
              
              <Button
                onClick={handleFileSelect}
                disabled={isImporting}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Upload className="w-4 h-4 mr-2" />
                Chọn file
              </Button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Chỉ hỗ trợ file .xlsx
              </p>
            </div>
          ) : (
            /* File selected display */
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-green-600 dark:text-green-400" />
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

          {/* Import instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Lưu ý quan trọng
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Đảm bảo file Excel có định dạng đúng theo template. Dữ liệu sai có thể gây lỗi khi nhập.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
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
            disabled={!selectedFile || isImporting}
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