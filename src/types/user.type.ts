export interface GET_MECHANIC_USER {
  id: string;
  fullName: string;
  email: string;
}

export interface USER_LIST_ITEM {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  profilePictureUrl: string;
  dateOfBirth: string;
  createdDate: string;
  role: number;
}

export interface USER_LIST_RESPONSE {
  data: {
    data: USER_LIST_ITEM[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
  };
}

export interface CREATE_USER_REQUEST {
  FullName?: string;
  UserName: string;
  Email: string;
  Password: string;
  PhoneNumber?: string;
  DateOfBirth?: string;
  Role: number;
  ProfilePictureUrl?: string;
}

export interface UPDATE_USER_REQUEST {
  Id: string;
  FullName?: string;
  UserName: string;
  Email: string;
  PhoneNumber?: string;
  ProfilePictureUrl?: string;
  DateOfBirth?: string;
  Role: number;
}

export const ROLE_MAPPING: Record<string, number> = {
  "Head Department": 1,
  "Head of Technical": 2,
  "Mechanic": 3,
  "Stock Keeper": 4,
  "Admin": 5
};