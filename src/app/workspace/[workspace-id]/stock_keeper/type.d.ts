// spareparts
export interface PartType {
  id: string;
  name: string;
  machineType: string;
  category: string;
  quantity: number;
  minThreshold: number;
  description: string;
  image: string;
  importedDate: string;
  unit: string;
  location?: string;
  specification?: string; 
  supplier?: string;
  supplierId?: string; 
  unitPrice?: number;
  expectedAvailabilityDate?: string; 
}
export interface PartCardProps {
  part: PartType;
  onClick: (part: PartType) => void;
  isViewOnlyMode?: boolean; 
}
export interface FilterBarProps {
  search: string;
  setSearch: (v: string) => void;
  machineFilter: string;
  setMachineFilter: (v: string) => void;
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  sortDirection: string;
  setSortDirection: (v: string) => void;
  machineTypes: string[];
  categories: string[];
}

export interface PartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartType | null; 
  onUpdate?: () => void; 
  partId?: string | undefined; 
  isViewOnlyMode?: boolean;
}

//request  
export interface Request {
  id: string;      
  code: string;   
  date: string;
  requestedBy: string;
  items: number;
  status: string;
}

export interface RequestPart {
  usageId: string;
  code: string;
  id: string;
  name: string;
  requested: number;
}

export interface RequestDetail {
  id: string;
  date: string;
  requestedBy: string;
  parts: RequestPart[];
  status: string;
}

export interface UnavailablePart {
  id: string;
  reason: string;
  restockDate: string;
}

export interface FilterState {
  search: string;
  statusFilter: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortDirection: string;
}