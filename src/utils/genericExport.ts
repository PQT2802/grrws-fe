import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { generateBatchQRCodes } from './qrExport';

export type ExportFormat = 'pdf' | 'excel';

export interface BaseExportConfig {
  title: string;
  filename: string;
  includeQRCodes?: boolean;
  qrCodeField?: string; // Field name to use for QR code generation
}

export interface PDFExportConfig extends BaseExportConfig {
  format: 'pdf';
  headers: string[];
  columnWidths: number[];
  dataMapper: (item: any) => any[];
  qrCodeSize?: number;
}

export interface ExcelExportConfig extends BaseExportConfig {
  format: 'excel';
  worksheets: {
    name: string;
    data: any[];
    columnWidths?: Array<{ wch: number }>;
  }[];
}

export type ExportConfig = PDFExportConfig | ExcelExportConfig;

export class GenericExportService {
  
  // Generic PDF export function
  static async exportToPDF<T>(
    data: T[],
    config: PDFExportConfig,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      console.log('🔄 Starting PDF export for', data.length, 'items');
      
      if (onProgress) {
        onProgress(5, 'Starting PDF export...');
      }
      
      let qrResults: any[] = [];
      
      // Generate QR codes if required
      if (config.includeQRCodes && config.qrCodeField) {
        if (onProgress) {
          onProgress(10, 'Generating QR codes...');
        }
        
        qrResults = await generateBatchQRCodes(
          data.map(item => ({
            id: (item as any)[config.qrCodeField!],
            deviceName: (item as any).deviceName || (item as any).name || 'Item',
            deviceCode: (item as any).deviceCode || (item as any).code || 'N/A'
          })),
          (qrProgress, current, total) => {
            if (onProgress) {
              const overallProgress = 10 + (qrProgress * 0.6);
              onProgress(overallProgress, `Generating QR codes... (${current}/${total})`);
            }
          }
        );
      }
      
      if (onProgress) {
        onProgress(70, 'Creating PDF document...');
      }
      
      // Create PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      // Add title and metadata
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(config.title, 14, 20);
      
      // Add export info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text(`Generated on: ${currentDate}`, 14, 28);
      doc.text(`Total items: ${data.length}`, 14, 34);
      if (config.includeQRCodes) {
        doc.text(`QR codes generated: ${qrResults.filter(r => r.qrCodeDataUrl).length}`, 14, 40);
      }
      
      if (onProgress) {
        onProgress(80, 'Adding data table...');
      }
      
      // Prepare table data
      const tableData = data.map((item, index) => {
        const mappedData = config.dataMapper(item);
        
        // If QR codes are enabled, insert empty string for QR column
        if (config.includeQRCodes) {
          mappedData.unshift(''); // QR Code placeholder
        }
        
        return mappedData;
      });
      
      // Prepare headers
      const headers = config.includeQRCodes 
        ? ['QR Code', ...config.headers]
        : config.headers;
      
      // Prepare column styles
      const columnStyles: any = {};
      config.columnWidths.forEach((width, index) => {
        const columnIndex = config.includeQRCodes ? index + 1 : index;
        columnStyles[columnIndex] = { cellWidth: width };
      });
      
      if (config.includeQRCodes) {
        columnStyles[0] = { cellWidth: config.qrCodeSize || 25, halign: 'center' };
      }
      
      // Create table with autoTable
      (doc as any).autoTable({
        head: [headers],
        body: tableData,
        startY: config.includeQRCodes ? 46 : 40,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: 'linebreak',
          valign: 'middle',
          halign: 'left'
        },
        headStyles: {
          fillColor: [51, 122, 183],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles,
        didDrawCell: function(cellData: any) {
          // Add QR codes to the first column
          if (config.includeQRCodes && cellData.column.index === 0 && cellData.cell.section === 'body') {
            const itemIndex = cellData.row.index;
            const qrResult = qrResults[itemIndex];
            
            if (qrResult && qrResult.qrCodeDataUrl) {
              try {
                const cellX = cellData.cell.x;
                const cellY = cellData.cell.y;
                const cellWidth = cellData.cell.width;
                const cellHeight = cellData.cell.height;
                
                const qrSize = Math.min(cellWidth - 4, cellHeight - 4, config.qrCodeSize || 22);
                const qrX = cellX + (cellWidth - qrSize) / 2;
                const qrY = cellY + (cellHeight - qrSize) / 2;
                
                doc.addImage(
                  qrResult.qrCodeDataUrl,
                  'PNG',
                  qrX,
                  qrY,
                  qrSize,
                  qrSize
                );
              } catch (error) {
                console.warn(`Failed to add QR code for item ${itemIndex}:`, error);
              }
            }
          }
        },
        margin: { top: 46, left: 14, right: 14, bottom: 20 }
      });
      
      if (onProgress) {
        onProgress(95, 'Finalizing PDF...');
      }
      
      // Add footer with page numbers
      const pageCount = (doc as any).getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 20,
          doc.internal.pageSize.height - 10,
          { align: 'right' }
        );
      }
      
      if (onProgress) {
        onProgress(100, 'Download starting...');
      }
      
      // Save the PDF
      console.log('💾 Saving PDF file:', config.filename);
      doc.save(config.filename);
      
      console.log('✅ PDF export completed successfully');
      
    } catch (error) {
      console.error('❌ PDF export failed:', error);
      throw new Error(`Failed to export to PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Generic Excel export function
  static async exportToExcel<T>(
    config: ExcelExportConfig,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    try {
      console.log('🔄 Starting Excel export');
      
      if (onProgress) {
        onProgress(5, 'Starting Excel export...');
      }
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Add each worksheet
      config.worksheets.forEach((worksheet, index) => {
        if (onProgress) {
          onProgress(20 + (index * 60 / config.worksheets.length), `Creating worksheet: ${worksheet.name}`);
        }
        
        const ws = XLSX.utils.json_to_sheet(worksheet.data);
        
        // Set column widths if provided
        if (worksheet.columnWidths) {
          ws['!cols'] = worksheet.columnWidths;
        }
        
        XLSX.utils.book_append_sheet(workbook, ws, worksheet.name);
      });
      
      if (onProgress) {
        onProgress(95, 'Finalizing Excel file...');
      }
      
      if (onProgress) {
        onProgress(100, 'Download starting...');
      }
      
      // Save the Excel file
      XLSX.writeFile(workbook, config.filename);
      
      console.log('✅ Excel export completed successfully');
      
    } catch (error) {
      console.error('❌ Excel export failed:', error);
      throw new Error(`Failed to export to Excel: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Main export function
  static async exportData<T>(
    data: T[],
    config: ExportConfig,
    onProgress?: (progress: number, message: string) => void
  ): Promise<void> {
    if (data.length === 0) {
      throw new Error('No data to export');
    }
    
    console.log(`🚀 Starting ${config.format.toUpperCase()} export for ${data.length} items`);
    
    try {
      if (config.format === 'pdf') {
        await this.exportToPDF(data, config as PDFExportConfig, onProgress);
      } else if (config.format === 'excel') {
        await this.exportToExcel(config as ExcelExportConfig, onProgress);
      } else {
        throw new Error('Unsupported export format');
      }
    } catch (error) {
      console.error(`❌ Export failed for format ${config.format}:`, error);
      throw error;
    }
  }
}