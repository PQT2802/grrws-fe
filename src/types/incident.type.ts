export interface Issue {
  id: string; 
  issueKey: string;
  displayName: string;
  description: string;
  isCommon: boolean;
  occurrenceCount: number | null;
}

export interface TechnicalIssue {
  id: string; 
  symptomCode: string;
  name: string;
  description: string;
  isCommon: boolean;
  occurrenceCount: number;
}

export interface ErrorIncident {
  id: string;
  errorCode: string;
  name: string;
  description: string;
  estimatedRepairTime: string;
  isCommon: boolean;
  occurrenceCount: number;
  severity: string;
}

// API Response interfaces
export interface IssueResponse {
  statusCode: number;
  title: string;
  type: string;
  extensions: {
    message: string;
    data: {
      data: Issue[];
      totalCount: number;
      pageNumber: number;
      pageSize: number;
    };
  };
}

export interface TechnicalIssueResponse {
  statusCode: number;
  title: string;
  type: string;
  extensions: {
    message: string;
    data: {
      data: TechnicalIssue[];
      totalCount: number;
      pageNumber: number;
      pageSize: number;
    };
  };
}

export interface ErrorIncidentResponse {
  statusCode: number;
  title: string;
  type: string;
  extensions: {
    message: string;
    data: {
      data: ErrorIncident[];
      totalCount: number;
      pageNumber: number;
      pageSize: number;
    };
  };
}