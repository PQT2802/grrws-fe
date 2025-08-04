export interface Area {
  id: string;
  areaCode: string;      // Added missing field
  areaName: string;
  createdDate: string;
  modifiedDate: string;
  zoneCount?: number;
}

export interface Zone {
  id: string;
  zoneCode: string;      // Added missing field
  zoneName: string;
  areaId: string;
  areaCode?: string;     // Added missing field
  areaName?: string;
  createdDate: string;
  modifiedDate: string;
  positionCount?: number;
}

export interface Position {
  id: string;
  positionCode: string;  // Added missing field
  positionName: string;  // Added missing field  
  index: number;
  zoneId: string;
  zoneCode?: string;     // Added missing field
  zoneName?: string;
  areaCode?: string;     // Added missing field
  areaName?: string;
  description?: string;  // Added missing field
  deviceId?: string;
  deviceCount?: number;  // Added missing field
  createdDate: string;   // Changed from createdAt
  modifiedDate: string;  // Changed from modifiedAt
  device?: {
    id: string;
    deviceName: string;
    deviceCode: string;
    serialNumber: string;
    model: string;
    manufacturer: string;
    manufactureDate: string;
    installationDate: string;
    description: string;
    photoUrl: string;
    status: string;
    isUnderWarranty: boolean;
    specifications: string;
    purchasePrice: number;
    supplier: string;
    positionId: string;
    createdDate: string;
    modifiedDate: string;
  };
}

export interface PositionWithDeviceAndRequest {
  positionId: string;
  positionName: string;
  currentDevice?: {
    deviceId: string;
    deviceName: string;
    deviceCode: string;
    serialNumber: string;
    model: string;
    status: string;
    isUnderWarranty: boolean;
  };
  originalDevice?: any;
  currentRequest?: {
    requestId: string;
    requestTitle: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
  };
}

export interface CreateAreaRequest {
  areaName: string;
}

export interface CreateZoneRequest {
  zoneName: string;
  areaId: string;
}

export interface CreatePositionRequest {
  index: number;
  zoneId: string;
}

export interface UpdateAreaRequest extends CreateAreaRequest {
  id: string;
}

export interface UpdateZoneRequest extends CreateZoneRequest {
  id: string;
}

export interface UpdatePositionRequest extends CreatePositionRequest {
  id: string;
}