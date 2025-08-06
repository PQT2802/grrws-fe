"use client";

import { useRouter } from "next/navigation";
import { useContext, useEffect } from "react";
import { AuthContext } from "./AuthProvider";
import Loading from "@/components/Loading/Loading";
import router from "next/router";

interface PropType {
  children: React.ReactNode;
}

const AuthProtectProvider = (props: PropType) => {
  const { children } = props;
  const router = useRouter();
  const { user, loading, logout }: any = useContext(AuthContext);

  // Check token expiration
  const checkTokenExpiration = () => {
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
  };

  useEffect(() => {
    if (!loading) {
      const isTokenExpired = checkTokenExpiration();

      if (isTokenExpired || !user) {
        router.push("/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Set up interval to check token expiration periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (user && checkTokenExpiration()) {
        router.push("/");
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [user, router]);

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
