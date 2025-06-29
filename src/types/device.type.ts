export interface DEVICE_WEB {
  id: string;
  deviceName: string;
  deviceCode: string;
  serialNumber: string;
  model: string;
  manufacturer: string;
  manufactureDate: string; // ISO Date string
  installationDate: string; // ISO Date string
  description: string;
  photoUrl: string;
  status: "Active" | "Inactive" | "InUse" | "InRepair" | "InWarranty" | "Decommissioned"; // Updated statuses
  positionIndex: number | null;
  zoneName: string | null;
  areaName: string | null;
  isUnderWarranty: boolean;
  specifications: string;
  purchasePrice: number;
  supplier: string;
  machineId: string;
  positionId: string;
  createdDate: string; // ISO Date string
  modifiedDate: string; // ISO Date string
}
