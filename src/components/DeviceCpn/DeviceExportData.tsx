import { DEVICE_WEB } from '@/types/device.type';
import { GenericExportService, PDFExportConfig, ExcelExportConfig } from '@/utils/genericExport';

// Format date for display
const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatDateTime = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toISOString();
};

export class DeviceExportService {
  
  static async exportDevicesToPDF(
    devices: DEVICE_WEB[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    const config: PDFExportConfig = {
      format: 'pdf',
      title: 'Device Inventory Report with QR Codes',
      filename: `Device_Inventory_${new Date().toISOString().split('T')[0]}.pdf`,
      includeQRCodes: true,
      qrCodeField: 'id',
      qrCodeSize: 30, // Increased from 22 to 30 for better scanning
      headers: [
        'Device Code', 
        'Device Name',
        'Status',
        'Manufacturer',
        'Model',
        'Serial Number',
        'Installation Date',
        'Warranty'
      ],
      columnWidths: [25, 35, 20, 28, 25, 28, 25, 18], // Adjusted for larger QR codes
      dataMapper: (device: DEVICE_WEB) => [
        device.deviceCode,
        device.deviceName,
        device.status,
        device.manufacturer || 'N/A',
        device.model || 'N/A',
        device.serialNumber || 'N/A',
        formatDate(device.installationDate),
        device.isUnderWarranty ? 'Yes' : 'No'
      ]
    };
    
    return GenericExportService.exportData(devices, config, onProgress);
  }
  
  static async exportDevicesToExcel(
    devices: DEVICE_WEB[],
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    // Map devices to include all 18 fields for re-importable Excel
    const deviceData = devices.map(device => ({
      'Id': device.id,
      'DeviceName': device.deviceName,
      'DeviceCode': device.deviceCode,
      'SerialNumber': device.serialNumber || '',
      'Model': device.model || '',
      'Manufacturer': device.manufacturer || '',
      'ManufactureDate': formatDateTime(device.manufactureDate),
      'InstallationDate': formatDateTime(device.installationDate),
      'Description': device.description || '',
      'PhotoUrl': device.photoUrl || '',
      'Status': device.status,
      'IsUnderWarranty': device.isUnderWarranty,
      'InUsed': device.status === 'InUse', // Derive from status
      'Specifications': device.specifications || '',
      'PurchasePrice': device.purchasePrice || 0,
      'Supplier': device.supplier || '',
      'MachineId': device.machineId || '',
      'PositionId': device.positionId || ''
    }));
    
    // Create summary data
    const summary = [
      { 'Metric': 'Total Devices', 'Value': devices.length },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString('vi-VN') },
      { 'Metric': 'Active Devices', 'Value': devices.filter(d => d.status === 'Active').length },
      { 'Metric': 'Devices Under Warranty', 'Value': devices.filter(d => d.isUnderWarranty).length },
      { 'Metric': 'Devices In Use', 'Value': devices.filter(d => d.status === 'InUse').length },
    ];
    
    const config: ExcelExportConfig = {
      format: 'excel',
      title: 'Device Inventory Export',
      filename: `Device_Inventory_${new Date().toISOString().split('T')[0]}.xlsx`,
      worksheets: [
        {
          name: 'Devices',
          data: deviceData,
          columnWidths: [
            { wch: 40 }, // Id
            { wch: 25 }, // DeviceName
            { wch: 15 }, // DeviceCode
            { wch: 18 }, // SerialNumber
            { wch: 15 }, // Model
            { wch: 15 }, // Manufacturer
            { wch: 20 }, // ManufactureDate
            { wch: 20 }, // InstallationDate
            { wch: 30 }, // Description
            { wch: 30 }, // PhotoUrl
            { wch: 12 }, // Status
            { wch: 12 }, // IsUnderWarranty
            { wch: 10 }, // InUsed
            { wch: 30 }, // Specifications
            { wch: 15 }, // PurchasePrice
            { wch: 15 }, // Supplier
            { wch: 40 }, // MachineId
            { wch: 40 }  // PositionId
          ]
        },
        {
          name: 'Summary',
          data: summary,
          columnWidths: [{ wch: 20 }, { wch: 20 }]
        }
      ]
    };
    
    return GenericExportService.exportData(devices, config, onProgress);
  }
  
  static async exportDevices(
    devices: DEVICE_WEB[], 
    format: 'pdf' | 'excel',
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    if (format === 'pdf') {
      return this.exportDevicesToPDF(devices, onProgress);
    } else {
      return this.exportDevicesToExcel(devices, onProgress);
    }
  }
}