export interface CREATE_ERROR_DETAIL {
  ErrorId: string; // The ID of the request this error is associated with
  RequestId: string; // The ID of the error being created
}
export interface ErrorFixStep {
  id: string;
  stepDescription: string;
  stepOrder: number;
}

export interface ErrorSparepart {
  sparepartId: string;
  quantityNeeded: number;
}

export interface ErrorGuideline {
  id: string;
  errorId?: string; // ✅ Add optional errorId field
  title: string;
  estimatedRepairTime: string;
  priority: string | number; // ✅ Allow both string and number
  errorFixSteps: ErrorFixStep[];
  errorSpareparts: ErrorSparepart[];
}
