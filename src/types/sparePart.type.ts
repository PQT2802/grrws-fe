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