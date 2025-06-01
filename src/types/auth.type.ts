export interface LoginRequest {
  Email: string;
  Password: string;
}

// ✅ AuthResponse stays exactly the same - no user field added
export interface AuthResponse {
  reNewToken?: string;
  accessToken: string;
}

// ✅ AuthUser stays the same - role is already here
export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  dateOfBirth: Date;
  role: number; // ✅ Role comes from here
}

// ✅ Add role constants for better type safety
export const USER_ROLES = {
  HOD: 1, // Head of Department
  HOT: 2, // Head of Technical ✅ ALLOWED
  MECHANIC: 3, // Mechanic
  STOCK_KEEPER: 4, // Stock Keeper
  ADMIN: 5, // Admin ✅ ALLOWED
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// ✅ Fix: Allow role 2 (HOT) and role 5 (ADMIN)
export const canAccessWorkspace = (role: number): boolean => {
  const allowedRoles = [USER_ROLES.HOT, USER_ROLES.ADMIN]; // [2, 5]

  console.log("🔍 Checking workspace access:");
  console.log("  User role:", role);
  console.log("  Allowed roles:", allowedRoles);
  console.log("  Has access:", (allowedRoles as number[]).includes(role));

  return (allowedRoles as number[]).includes(role);
};

// ✅ Fix: Update role names to match your constants
export const getRoleName = (role: number): string => {
  switch (role) {
    case USER_ROLES.HOD:
      return "HOD (Head of Department)";
    case USER_ROLES.HOT:
      return "HOT (Head of Technical)";
    case USER_ROLES.MECHANIC:
      return "Mechanic";
    case USER_ROLES.STOCK_KEEPER:
      return "Stock Keeper";
    case USER_ROLES.ADMIN:
      return "Admin";
    default:
      return `Unknown Role (${role})`;
  }
};
