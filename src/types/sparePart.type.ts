export interface SPAREPART_USAGE {
  sparePartId: string;
  quantityUsed: number;
  isTakenFromStock: boolean;
}

export interface SPAREPART_REQUEST {
  id: string;
  requestCode: string;
  requestDate: string;
  assigneeName: string;
  status: string;
  confirmedDate: string | null;
  notes: string | null;
  sparePartUsages: SPAREPART_USAGE[];
}

export interface SPAREPART_REQUESTS_RESPONSE {
  data: {
    data: SPAREPART_REQUEST[];
  }
}

export interface FILTER_STATE {
  search: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortDirection: string;
}

export interface SPAREPART {
  id: string;
  sparepartCode: string;
  sparepartName: string;
  description: string;
  specification: string;
  stockQuantity: number;
}

export interface SPAREPART_USAGE_DETAIL {
  id: string;
  requestTakeSparePartUsageId: string;
  sparePartId: string;
  quantityUsed: number;
  isTakenFromStock: boolean;
  spareparts: SPAREPART[];
}

export interface SPAREPART_REQUEST_DETAIL {
  id: string;
  requestCode: string;
  requestDate: string;
  requestedById: string;
  assigneeId: string;
  assigneeName: string;
  status: string;
  confirmedDate: string | null;
  confirmedById: string | null;
  notes: string;
  sparePartUsages: SPAREPART_USAGE_DETAIL[];
  assigneeConfirm: boolean; // New field
  stockKeeperConfirm: boolean; // New field
}

export interface SPAREPART_REQUEST_DETAIL_RESPONSE {
  data: SPAREPART_REQUEST_DETAIL;
}

export interface SPAREPART_INVENTORY_ITEM {
  id: string;
  sparepartCode: string;
  sparepartName: string;
  description: string;
  specification: string;
  stockQuantity: number;
  isAvailable: boolean;
  unit: string;
  unitPrice: number;
  expectedAvailabilityDate: string | null;
  supplierId: string;
  supplierName: string;
  category: string | null;
  machineIds: string[];
  machineNames: string[];
  imgUrl: string | null;
}

export interface SPAREPART_INVENTORY_RESPONSE {
  data: {
    data: SPAREPART_INVENTORY_ITEM[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  }
}

// Add a new type for pagination params
export interface PAGINATION_PARAMS {
  pageNumber: number;
  pageSize: number;
}

// Add these new interfaces for Machine Replacement Requests
export interface MACHINE_REPLACEMENT_REQUEST {
  id: string;
  title: string;
  description: string;
  requestDate: string;
  assigneeId: string;
  assigneeName: string;
  oldDeviceId: string;
  newDeviceId: string;
  machineId: string;
  status: string;
  assigneeConfirm: boolean; 
  stokkKeeperConfirm: boolean; 
}

export interface MACHINE_REPLACEMENT_REQUESTS_RESPONSE {
  data: {
    data: MACHINE_REPLACEMENT_REQUEST[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  }
}

// Also update the existing MACHINE_REQUEST interface to use the new structure
export interface MACHINE_REQUEST {
  id: string;
  requestCode: string;
  title: string;
  description: string;
  requestDate: string;
  requestedBy: string;
  assigneeId: string;
  assigneeName: string;
  status: string;
  reason: string;
  currentMachineName: string;
  replacementMachineName: string;
  priority: string;
  oldDeviceId: string;
  newDeviceId: string;
  machineId: string;
}