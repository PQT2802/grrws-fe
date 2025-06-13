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
  supplierId?: string; // Add this field
  unitPrice?: number;
  expectedAvailabilityDate?: string; // Add this field
}
export interface PartCardProps {
  part: PartType;
  onClick: (part: PartType) => void;
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
//model for part detail modal
export interface PartDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  part: PartType;
  onUpdate?: () => void; // Add this line
}

//request  
export interface Request {
  id: string;
  date: string;
  requestedBy: string;
  items: number;
  status: string;
}

export interface RequestPart {
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