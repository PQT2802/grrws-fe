export interface Area {
  id: string;
  areaCode: string;
  areaName: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  zoneCount?: number;
}

export interface Zone {
  id: string;
  zoneCode: string;
  zoneName: string;
  description?: string;
  areaId: string;
  areaName?: string;
  areaCode?: string;
  createdAt: string;
  updatedAt: string;
  positionCount?: number;
}

export interface Position {
  id: string;
  positionCode: string;
  positionName: string;
  description?: string;
  zoneId: string;
  zoneName?: string;
  zoneCode?: string;
  areaName?: string;
  areaCode?: string;
  createdAt: string;
  updatedAt: string;
  deviceCount?: number;
}

export interface CreateAreaRequest {
  areaCode: string;
  areaName: string;
  description?: string;
}

export interface CreateZoneRequest {
  zoneCode: string;
  zoneName: string;
  description?: string;
  areaId: string;
}

export interface CreatePositionRequest {
  positionCode: string;
  positionName: string;
  description?: string;
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