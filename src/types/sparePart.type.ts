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