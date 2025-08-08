"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthProvider";
import Loading from "@/components/Loading/Loading";

interface AuthContextType {
  user: any; // Replace 'any' with a more specific type if available
  loading: boolean;
  logout: () => void;
}

interface PropType {
  children: React.ReactNode;
}

const AuthProtectProvider = ({ children }: PropType) => {
  const router = useRouter();
  const { user, loading, logout } = useContext(AuthContext) as AuthContextType;

  // Check token expiration, memoized
  const checkTokenExpiration = useCallback(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        // Decode JWT token to check expiration
        const payload = JSON.parse(atob(token.split(".")[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp < currentTime) {
          // Token expired - auto logout
          logout();
          return true;
        }
      } catch (error) {
        // Invalid token - auto logout
        logout();
        return true;
      }
    }
    return false;
  }, [logout]);

  // Check token on initial load
  useEffect(() => {
    if (!loading) {
      const isTokenExpired = checkTokenExpiration();

      if (isTokenExpired || !user) {
        router.push("/");
      }
    }
  }, [loading, user, router, checkTokenExpiration]);

  // Set up interval to check token expiration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && checkTokenExpiration()) {
        router.push("/");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, router, checkTokenExpiration]);

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Loading width={60} height={60} />
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthProtectProvider;
