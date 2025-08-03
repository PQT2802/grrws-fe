'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<void>;
  title: string;
  description: string;
  templateFileName: string;
  isLoading?: boolean;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
  title,
  description,
  templateFileName,
  isLoading = false
}: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const handleClose = () => {
    if (!isLoading) {
      setSelectedFile(null);
      setError('');
      onClose();
    }
  };

  const handleFileSelect = (file: File) => {
    setError('');
    
    // Validate file type
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setError('Chỉ chấp nhận file Excel (.xls, .xlsx)');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File không được vượt quá 10MB');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file để import');
      return;
    }

    try {
      await onImport(selectedFile);
      handleClose();
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  const handleDownloadTemplate = () => {
    // Create a mock download link for the template
    // In real implementation, this would download the actual template file
    const link = document.createElement('a');
    link.href = `/templates/${templateFileName}`;
    link.download = templateFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {/* Template Download */}
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tải xuống file template để import dữ liệu</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="ml-2"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Template
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Chọn file Excel</Label>
            
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' 
                  : selectedFile 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20 dark:border-green-500' 
                    : 'border-border hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <Input
                id="file-input"
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileInputChange}
                className="hidden"
                disabled={isLoading}
              />
              
              {selectedFile ? (
                <div className="space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-300">{selectedFile.name}</p>
                    <p className="text-sm text-green-600 dark:text-green-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                    disabled={isLoading}
                  >
                    Chọn file khác
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground mx-auto" />
                  <div>
                    <p className="font-medium text-foreground">Kéo thả file vào đây hoặc click để chọn</p>
                    <p className="text-sm text-muted-foreground">Chỉ chấp nhận file .xls, .xlsx (tối đa 10MB)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Import Guidelines */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="text-sm space-y-1">
                <p className="font-medium">Lưu ý khi import:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Sử dụng đúng format template đã cung cấp</li>
                  <li>Không để trống các trường bắt buộc</li>
                  <li>Kiểm tra dữ liệu trước khi import</li>
                  <li>Dữ liệu trùng lặp sẽ được bỏ qua</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        {/* Action Buttons */}
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
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Đang import...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}