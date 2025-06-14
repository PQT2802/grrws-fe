export interface WARRANTY_LIST {
  isUnderWarranty: boolean; // Indicates if the device is under warranty
  warrantyStatus: string; // Status of the warranty (e.g., "InUsed", "Completed")
  warrantyCode: string; // Unique code for the warranty
  warrantyType: string; // Type of warranty (e.g., "Manufacturer", "Extended")
  provider: string; // Name of the warranty provider
  warrantyStartDate: string; // Start date of the warranty in ISO format
  warrantyEndDate: string; // End date of the warranty in ISO format
}
export interface WARRANTY_HISTORY_LIST {
  deviceId: string; // Guid → string
  deviceDescription: string;
  status: boolean;
  sendDate?: string; // DateTime? → optional string (ISO format)
  receiveDate?: string; // DateTime? → optional string (ISO format)
  provider?: string; // Optional string
  note?: string; // Optional string
}
export interface WarrantyInfo {
  id: string; // Unique identifier for the warranty
  isUnderWarranty: boolean;
  warrantyStatus: string; // tùy vào các trạng thái có thể có
  warrantyCode: string;
  warrantyType: string;
  warrantyReason: string;
  provider: string;
  warrantyStartDate: string; // ISO 8601 datetime string
  warrantyEndDate: string; // ISO 8601 datetime string
  notes: string;
  cost: number;
  documentUrl: string;
  daysRemaining: number;
  lowDayWarning: boolean;
}
