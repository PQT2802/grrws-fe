"use client";

import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useCallback,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/app/service/auth.service";
import { AuthUser, USER_ROLES, canAccessWorkspace } from "@/types/auth.type";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isHOT: boolean;
  isAdmin: boolean;
  isStockKeeper: boolean;
  canAccessWorkspace: boolean;
  logout: () => Promise<void>; // ✅ Add logout function
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();
  const pathName = usePathname();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // ✅ Add logout function
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Starting logout process...");

      // 1. Optional: Call backend logout API
      try {
        await authService.logout();
        console.log("✅ Backend logout successful");
      } catch (error) {
        console.log("⚠️ Backend logout failed, continuing with local logout");
      }

      // 2. Clear all localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("lastUserVerified");
      console.log("🗑️ localStorage cleared");

      // 3. Clear user state
      setUser(null);
      console.log("👤 User state cleared");

      // 4. Redirect to login using router.push
      router.push("/");
      console.log("🔄 Redirected to login page");

      console.log("✅ Logout completed successfully");
    } catch (error) {
      console.error("❌ Logout error:", error);
      // Force logout even if there's an error
      localStorage.clear();
      setUser(null);
      router.push("/");
    }
  }, [router]);

  // ✅ Only role 2 (HOT) and 5 (ADMIN) can access workspace
  const isHOT = user?.role === USER_ROLES.HOT; // Role 2
  const isAdmin = user?.role === USER_ROLES.ADMIN; // Role 5
  const isStockKeeper = user?.role === USER_ROLES.STOCK_KEEPER; // Role 4
  const canAccess =
    user?.role === USER_ROLES.HOT ||
    user?.role === USER_ROLES.ADMIN ||
    user?.role === USER_ROLES.STOCK_KEEPER; // Role 2 or 5 or 4

  // ... existing useEffect code for auth check ...
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const storedUser = localStorage.getItem("currentUser");
        const lastVerified = localStorage.getItem("lastUserVerified");

        console.log("🔍 Debug localStorage:");
        console.log("  - accessToken:", token ? "EXISTS" : "MISSING");
        console.log("  - currentUser:", storedUser ? "EXISTS" : "MISSING");

        if (token && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log("📦 Parsed user successfully:", parsedUser);
            console.log(
              "🔍 User role:",
              parsedUser.role,
              "Can access workspace:",
              parsedUser.role === USER_ROLES.HOT ||
                parsedUser.role === USER_ROLES.ADMIN ||
                parsedUser.role === USER_ROLES.STOCK_KEEPER
            );
            setUser(parsedUser);

            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            const shouldVerify =
              !lastVerified || now - parseInt(lastVerified) > fiveMinutes;

            if (shouldVerify) {
              try {
                console.log("🔄 Verifying user with backend...");
                const currentUser = await authService.getCurrentUser();
                console.log("✅ Fresh user from backend:", currentUser);
                setUser(currentUser);
                localStorage.setItem(
                  "currentUser",
                  JSON.stringify(currentUser)
                );
                localStorage.setItem("lastUserVerified", now.toString());
              } catch (error) {
                console.error("❌ Failed to verify user with backend:", error);
                console.log(
                  "📦 Keeping stored user data since backend verification failed"
                );
              }
            }
          } catch (parseError) {
            console.error("❌ Error parsing stored user:", parseError);
            localStorage.removeItem("currentUser");
            localStorage.removeItem("lastUserVerified");
            setUser(null);
          }
        } else {
          console.log("🚫 Missing token or stored user");
          setUser(null);
          localStorage.removeItem("lastUserVerified");
        }
      } catch (error) {
        console.error("❌ Auth check failed:", error);
        setUser(null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        localStorage.removeItem("lastUserVerified");
      } finally {
        setTimeout(() => {
          setLoading(false);
        }, 500);
      }
    };

    // Initial check
    checkAuth();

    // ✅ Listen for storage changes (like after login)
    const handleStorageChange = () => {
      console.log("🔄 Storage changed, re-checking auth...");
      checkAuth();
    };

    // ✅ Listen for both storage events and custom events
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authChange", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authChange", handleStorageChange);
    };
  }, []);

  // ... existing useEffect for redirect logic ...
  useEffect(() => {
    if (!loading) {
      console.log(
        "🎯 Auth loading complete. User:",
        user,
        "Path:",
        pathName,
        "Can access:",
        canAccess
      );

      if (user) {
        console.log("🔍 Role check details:");
        console.log("  - User role:", user.role);
        console.log("  - Is HOT (role 2):", user.role === USER_ROLES.HOT);
        console.log("  - Is ADMIN (role 5):", user.role === USER_ROLES.ADMIN);
        console.log("  - Final canAccess:", canAccess);

        if (pathName === "/") {
          if (canAccess) {
            console.log(
              "✅ User can access workspace, redirecting from root..."
            );
            router.push("/workspace");
          } else {
            console.log(
              "❌ User cannot access workspace, redirecting to access denied from root..."
            );
            router.push("/access-denied");
          }
        } else if (pathName.startsWith("/workspace")) {
          if (!canAccess) {
            console.log(
              "❌ User trying to access workspace without permission, redirecting..."
            );
            router.push("/access-denied");
          } else {
            console.log("✅ User has permission to access workspace");
          }
        } else if (pathName === "/access-denied") {
          if (canAccess) {
            console.log(
              "✅ User with access is on access-denied page, redirecting to workspace..."
            );
            router.push("/workspace");
          } else {
            console.log(
              "❌ User without access is correctly on access-denied page"
            );
          }
        }
      } else {
        if (pathName !== "/" && pathName !== "/sign-up") {
          console.log("👤 No user, redirecting to login...");
          router.push("/");
        }
      }
    }
  }, [user, loading, pathName, router, canAccess]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isHOT,
        isAdmin,
        isStockKeeper, // ✅ Provide Stock Keeper role check
        canAccessWorkspace: canAccess,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
