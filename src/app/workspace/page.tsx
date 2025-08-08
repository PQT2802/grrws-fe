"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { USER_ROLES } from "@/types/auth.type";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import AccessDenied from "@/components/AccessDenied/AccessDenied";

const WorkspacePage = () => {
  const router = useRouter();
  const { user, canAccessWorkspace, loading: authLoading } = useAuth();

  const getRouteByRole = (role: number) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return `/workspace/admin/dashboard`; 
      case USER_ROLES.STOCK_KEEPER:
        return `/workspace/stock_keeper/dashboard`; 
      case USER_ROLES.HOT:
        return `/workspace/hot`; 
      default:
        return "/access-denied";
    }
  };

  // Redirect based on role when user is loaded
  useEffect(() => {
    if (!authLoading && user?.role && canAccessWorkspace) {
      const targetPath = getRouteByRole(user.role);
      router.push(targetPath);
    }
  }, [authLoading, user?.role, canAccessWorkspace, router]);

  // Redirect if user can't access workspace
  useEffect(() => {
    if (!authLoading && !canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [authLoading, canAccessWorkspace, router]);

  // Show loading while checking auth and redirecting
  if (authLoading || (user?.role && canAccessWorkspace)) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <SkeletonCard />
      </div>
    );
  }

  // Show access denied if user can't access
  if (!canAccessWorkspace) {
    return (
      <AccessDenied
        title="Access Denied"
        description="You need special permissions to access this system."
        allowedRoles={["Head of Technical (HOT)", "Admin", "Stock Keeper"]}
        showUserRole={true}
      />
    );
  }

  // Fallback - should not reach here normally
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-semibold mb-2">Redirecting...</h1>
        <p className="text-gray-600">
          Please wait while we redirect you to the appropriate page.
        </p>
      </div>
    </div>
  );
};

export default WorkspacePage;
