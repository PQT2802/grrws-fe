"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { WORKSPACE_TYPE } from "@/types";
import { LogOut, Search } from "lucide-react";
import WorkspaceBtn from "@/components/WorkspaceBtn/WorkspaceBtn";
import CreateWorkspaceForm from "@/components/CreateWorkspaceForm/CreateWorkspaceForm";
import Divider from "@/components/Divider/Divider";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import { Input } from "@/components/ui/input";
import JoinWorkspaceForm from "@/components/JoinWorkspaceForm/JoinWorkspaceForm";
import { Button } from "@/components/ui/button";
import { getRoleName } from "@/types/auth.type";
import AccessDenied from "@/components/AccessDenied/AccessDenied";
import { toast } from "sonner"; // ✅ Add toast for better UX

// ✅ Sample workspace data for demonstration
const SAMPLE_WORKSPACES: WORKSPACE_TYPE[] = [
  {
    id: "sample-1",
    name: "Production Management",
    ownerId: "current-user",
    avatarUrl: "/workspace-sample.png",
    joinUrl: "sample-join-url",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-2",
    name: "Quality Control",
    ownerId: "current-user",
    avatarUrl: "/workspace-demo.png",
    joinUrl: "demo-join-url",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const WorkspacePage = () => {
  const router = useRouter();

  // ✅ Get logout function from AuthProvider
  const { user, canAccessWorkspace, loading: authLoading, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false); // ✅ Add loading state
  const debouncedQuery = useDebounce(query, 500);
  const [workspaceList, setWorkspaceList] = useState<WORKSPACE_TYPE[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ Redirect if user can't access workspace
  useEffect(() => {
    if (!authLoading && !canAccessWorkspace) {
      router.push("/access-denied");
    }
  }, [authLoading, canAccessWorkspace, router]);

  // ✅ Set sample workspaces when user is loaded
  useEffect(() => {
    if (user?.id && canAccessWorkspace) {
      setWorkspaceList(SAMPLE_WORKSPACES);
    }
  }, [user?.id, canAccessWorkspace]);

  const handleAccessWorkSpace = (workspace: WORKSPACE_TYPE) => {
    router.push(`/workspace/${workspace.id}`);
  };

  const handleSearchWorkspace = (searchStr: string) => {
    const filterWorkspace = SAMPLE_WORKSPACES?.filter(
      (workspace: WORKSPACE_TYPE) => {
        return workspace?.name?.toLowerCase().includes(searchStr.toLowerCase());
      }
    );

    setWorkspaceList(filterWorkspace);
  };

  // ✅ Updated logout function using AuthProvider
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      console.log("🚪 Workspace logout initiated");
      await logout(); // ✅ Uses the logout function from AuthProvider
      toast.success("Logged out successfully");
      // No need to manually clear localStorage or navigate - AuthProvider handles it
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

  useEffect(() => {
    if (debouncedQuery === "") {
      setWorkspaceList(SAMPLE_WORKSPACES);
    } else {
      handleSearchWorkspace(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  // Show loading while checking auth
  if (authLoading) {
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
        title="Workspace Access Denied"
        description="You need special permissions to access the workspace."
        allowedRoles={["Head of Technical (HOT)", "Admin"]}
        showUserRole={true}
      />
    );
  }

  return (
    <div className="w-full h-screen p-10">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-[1.8rem] font-bold">
            Welcome, {user?.fullName}!
          </h1>
          <p className="text-gray-600">
            Role: {user?.role ? getRoleName(user.role) : "Unknown"}
          </p>
        </div>
      </div>

      <h2 className="text-center text-[1.5rem] font-bold">All Workspaces</h2>
      <p className="my-5 text-[0.9rem] text-gray-500 text-center">
        A workspace is a place where you keep all of your project, tasks & teams
        in one single place. So, create a different workspace for each project
        or client you have
      </p>

      <nav className="mt-10 mb-8">
        <div className="w-full flex items-center justify-between gap-5">
          <div className="relative">
            <div className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input
              id="search"
              type="search"
              placeholder="Search a workspace..."
              className="w-full rounded-lg bg-background pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <JoinWorkspaceForm />
            {/* ✅ Updated logout button with loading state */}
            <Button
              className="text-gray-600 bg-zinc-200 hover:bg-zinc-300 dark:text-white hover:dark:bg-slate-800 dark:bg-slate-900"
              onClick={handleLogout}
              disabled={isLoggingOut} // ✅ Disable during logout
            >
              <LogOut />
              {isLoggingOut ? "Logging out..." : "Log out"}
            </Button>
          </div>
        </div>
      </nav>

      <Divider />

      {loading ? (
        <div className="my-8 w-full">
          <SkeletonCard />
        </div>
      ) : (
        <div className="my-8 w-full flex items-center gap-5 flex-wrap">
          <CreateWorkspaceForm />

          {workspaceList?.map((workspace: WORKSPACE_TYPE) => {
            return (
              <WorkspaceBtn
                key={workspace?.id}
                workspace={workspace}
                isCreated={false}
                onClick={() => {
                  handleAccessWorkSpace(workspace);
                }}
              />
            );
          })}
        </div>
      )}

      {workspaceList.length === 0 && !loading && (
        <div className="text-center mt-8">
          <p>No workspaces found</p>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
