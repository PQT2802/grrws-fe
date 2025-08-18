"use client";

import { Dispatch, FormEvent, SetStateAction, useState } from "react";
import { cn, handleAPIError } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { authService } from "@/app/service/auth.service";
import { useAuth } from "@/components/providers/AuthProvider"; // ✅ Add useAuth
import {
  LoginRequest,
  canAccessWorkspace,
  getRoleName,
  USER_ROLES,
} from "@/types/auth.type";

// ✅ Form state (what user types)
interface LOGIN_FORM_TYPE {
  email: string;
  password: string;
}

const LoginCpn = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) => {
  const router = useRouter();
  // ✅ Remove refreshAuth - we don't need it

  // ✅ Form state - what user types in the form
  const [loginForm, setLoginForm] = useState<LOGIN_FORM_TYPE>({
    email: "",
    password: "",
  });

  // ✅ Error state - stores validation error messages for each field
  const [loginFormError, setLoginFormError] = useState<LOGIN_FORM_TYPE>({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Validates form and shows error messages
  const handleLoginFormError = (
    loginForm: LOGIN_FORM_TYPE,
    setLoginFormError: Dispatch<SetStateAction<LOGIN_FORM_TYPE>>
  ) => {
    let isError: boolean = false;
    let loginFormErrObj: LOGIN_FORM_TYPE = {
      email: "",
      password: "",
    };

    // Check if email is empty
    if (loginForm.email === "") {
      loginFormErrObj = { ...loginFormErrObj, email: "Email can not be empty" };
      isError = true;
    }

    // Check if password is empty
    if (loginForm.password === "") {
      loginFormErrObj = {
        ...loginFormErrObj,
        password: "Password can not be empty",
      };
      isError = true;
    }

    setLoginFormError(loginFormErrObj);
    return isError;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      const isFormError: boolean = handleLoginFormError(
        loginForm,
        setLoginFormError
      );
      if (isFormError) return;

      setLoading(true);

      const loginRequest: LoginRequest = {
        Email: loginForm.email,
        Password: loginForm.password,
      };

      console.log("🔑 Starting login process...");

      // ✅ Step 1: Login and get tokens
      const response = await authService.login(loginRequest);
      console.log("✅ Login response:", response);

      // ✅ Step 2: Store tokens
      if (response.accessToken) {
        localStorage.setItem("accessToken", response.accessToken);
        if (response.reNewToken) {
          localStorage.setItem("refreshToken", response.reNewToken);
        }
        console.log("✅ Tokens stored successfully");
      } else {
        throw new Error("No access token received");
      }

      // ✅ Step 3: Get user information
      const userInfo = await authService.getCurrentUser();
      console.log("✅ User info received:", userInfo);

      // ✅ Step 4: Store user data
      localStorage.setItem("currentUser", JSON.stringify(userInfo));
      localStorage.setItem("lastUserVerified", Date.now().toString());
      console.log("✅ User info stored in localStorage");

      // ✅ Step 5: Determine redirection based on role
      let redirectPath = "/access-denied"; // Default redirection

      switch (userInfo.role) {
        case USER_ROLES.ADMIN:
          redirectPath = "/workspace/admin/dashboard";
          break;
        case USER_ROLES.HOT:
          redirectPath = "/workspace/hot";
          break;
        case USER_ROLES.STOCK_KEEPER:
          redirectPath = "/workspace/stock_keeper/dashboard";
          break;
        default:
          redirectPath = "/access-denied"; // No access for other roles
      }

      // ✅ Step 6: Trigger custom event to force AuthProvider refresh
      console.log("🔄 Triggering auth change event...");
      window.dispatchEvent(new Event("authChange"));

      // Small delay to let AuthProvider process
      await new Promise((resolve) => setTimeout(resolve, 100));

      // ✅ Step 7: Redirect to the determined path
      console.log(`✅ Redirecting to: ${redirectPath}`);
      router.refresh();
      router.push(redirectPath);

      // Show success toast
      if (redirectPath !== "/access-denied") {
        toast.success(
          `Welcome ${userInfo.fullName}! (${getRoleName(userInfo.role)})`
        );
      } else {
        const roleName = getRoleName(userInfo.role);
        toast.warning(
          `You are logged in as ${roleName}, but don't have workspace access. Only HOT and Admin can access workspace.`
        );
      }

      setLoginForm({ email: "", password: "" });
    } catch (error: any) {
      console.error("❌ Login failed:", error);
      const errorMessage = handleAPIError(error.message);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="w-full flex items-center justify-center gap-1">
        <Image src="/logosew.png" width={60} height={60} alt="app-logo" />
        <h1 className="font-bold text-[1.2rem] uppercase">
          {process.env.NEXT_PUBLIC_APP_NAME || "Jira Clone"}
        </h1>
      </div>
      <Card className="dark:bg-slate-900 rounded-md">
        <CardHeader>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={loginForm.email}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, email: e.target.value })
                }
              />
              {/* ✅ Show validation error if exists */}
              {loginFormError.email && (
                <p className="text-red-500 text-sm">{loginFormError.email}</p>
              )}
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
              </div>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
              />
              {/* ✅ Show validation error if exists */}
              {loginFormError.password && (
                <p className="text-red-500 text-sm">
                  {loginFormError.password}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loading..." : "Login"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="underline">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginCpn;
