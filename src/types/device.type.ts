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
  status: "Active" | "Inactive" | "InUse" | "InRepair" | "InWarranty" | "Decommissioned"; 
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

export interface MACHINE_WEB {
  id: string;
  machineName: string;
  machineCode: string;
  manufacturer: string;
  model: string;
  description: string;
  status: "Active" | "Discontinued";
  releaseDate: string; // ISO Date string
  specifications: string;
  photoUrl: string;
  deviceIds: string[]; // Array of associated device IDs
  createdDate: string; // ISO Date string
  modifiedDate: string; // ISO Date string
}