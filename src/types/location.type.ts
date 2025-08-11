export interface Area {
  description: string;
  id: string;
  areaCode: string;      
  areaName: string;
  createdDate: string;
  modifiedDate: string;
  zoneCount?: number;
}

export interface Zone {
  id: string;
  zoneCode: string;      
  zoneName: string;
  areaId: string;
  areaCode?: string;    
  areaName?: string;
  createdDate: string;
  modifiedDate: string;
  positionCount?: number;
}

export interface Position {
  id: string;
  positionCode: string; 
  positionName: string;  
  index: number;
  zoneId: string;
  zoneCode?: string;    
  zoneName?: string;
  areaCode?: string;     
  areaName?: string;
  description?: string;  
  deviceId?: string;
  deviceCount?: number;  
  createdDate: string;  
  modifiedDate: string;  
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
  areaCode: any;
  description: string | number | readonly string[] | undefined;
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