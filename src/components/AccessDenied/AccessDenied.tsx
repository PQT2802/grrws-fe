"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { ShieldX, Home, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getRoleName } from "@/types/auth.type";
import { toast } from "react-toastify";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  allowedRoles?: string[];
  showUserRole?: boolean;
  showHomeButton?: boolean;
  showLogoutButton?: boolean;
  className?: string;
}

const AccessDenied = ({
  title = "Access Denied",
  description = "You are logged in but don't have permission to access this workspace.",
  allowedRoles = ["Head of Technical (HOT)", "Admin"],
  showUserRole = true,
  showHomeButton = true,
  showLogoutButton = true,
  className,
}: AccessDeniedProps) => {
  const router = useRouter();
  const { user, logout } = useAuth(); // ✅ Get logout from AuthProvider
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleGoHome = () => {
    router.push("/");
  };

  // ✅ Use AuthProvider's logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log("🚪 AccessDenied logout clicked");
      await logout(); // ✅ Uses AuthProvider logout function
      toast.success("Logged out successfully");
      // No need to manually navigate - AuthProvider handles it
    } catch (error) {
      console.error("❌ Logout failed:", error);
      toast.error("Logout failed");
      // Fallback: force logout even if there's an error
      localStorage.clear();
      router.push("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-4 ${
        className || ""
      }`}
    >
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ✅ Show user info if logged in */}
          {showUserRole && user && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-300">
                <strong>Logged in as:</strong> {user.fullName} ({user.email})
              </p>
              <p className="text-sm text-blue-600 dark:text-blue-300">
                <strong>Your role:</strong> {getRoleName(user.role)}
              </p>
            </div>
          )}

          {/* Allowed Roles */}
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
            <p className="mb-2">
              Only the following roles can access this area:
            </p>
            <ul className="list-disc list-inside space-y-1">
              {allowedRoles.map((role, index) => (
                <li key={index}>
                  <strong>{role}</strong>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            )}
            {showLogoutButton && (
              <Button
                onClick={handleLogout}
                className="w-full"
                disabled={isLoggingOut} // ✅ Disable during logout
              >
                <LogOut className="w-4 h-4 mr-2" />
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessDenied;
