"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { toast } from "react-toastify";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { USER_LIST_ITEM } from "@/types/user.type";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { UserListCpn } from "@/components/UserListCpn/UserListCpn";
import { CreateUserModal } from "@/components/UserModalCpn/CreateUserModal";
import { UpdateUserModal } from "@/components/UserModalCpn/UpdateUserModal";
import { UserDetailModal } from "@/components/UserModalCpn/UserDetailModal";

// Get role name from role ID
const getRoleNameFromNumber = (role: number): string => {
  switch (role) {
    case 1:
      return "Head Department";
    case 2:
      return "Head of Technical";
    case 3:
      return "Mechanic";
    case 4:
      return "Stock Keeper";
    case 5:
      return "Admin";
    default:
      return "Unknown";
  }
};

export default function UserList() {
  const { isAdmin } = useAuth();
  const router = useRouter();

  // State for users data
  const [users, setUsers] = useState<USER_LIST_ITEM[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // State for searching and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");

  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 1000);

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal state
  const [selectedUser, setSelectedUser] = useState<USER_LIST_ITEM | null>(null);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showUpdateUserModal, setShowUpdateUserModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Chart data state
  const [chartKey, setChartKey] = useState<string>(Date.now().toString());
  const [chartData, setChartData] = useState([
    { name: "Head Department", value: 0, color: "#f97316" },
    { name: "Head of Technical", value: 0, color: "#22c55e" },
    { name: "Mechanic", value: 0, color: "#3b82f6" },
    { name: "Stock Keeper", value: 0, color: "#eab308" },
    { name: "Admin", value: 0, color: "#ef4444" },
  ]);

  // Add sorting state
  const [sortBy, setSortBy] = useState<string>("name"); // Default sort by name
  const [sortDirection, setSortDirection] = useState<string>("asc"); // A → Z by default

  // Admin authentication check
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied: Admin permission required");
      router.push("/workspace");
    }
  }, [isAdmin, router]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  // Direct API call from API client layer without service or router
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;

    setIsLoading(true);
    try {
      console.log(`🔍 Fetching users - Page: ${page}, PageSize: ${pageSize}`);

      // Direct call to API client method
      const response = await apiClient.user.getUsersList(page, pageSize);
      console.log("📊 API Response:", response);

      // Check the actual response structure based on the received data
      if (response?.data || Array.isArray(response)) {
        // Handle both possible response formats
        const userList = Array.isArray(response)
          ? response
          : response.data || [];
        const total = response.totalCount || userList.length || 0;

        console.log(
          `✅ Retrieved ${userList.length} users out of ${total} total`
        );

        setUsers(userList);
        setTotalCount(total);

        // Update chart data based on real user data
        if (userList.length > 0) {
          const roleStats = userList.reduce(
            (acc: { [key: string]: number }, user: USER_LIST_ITEM) => {
              const roleName = getRoleNameFromNumber(user.role);
              acc[roleName] = (acc[roleName] || 0) + 1;
              return acc;
            },
            {}
          );

          setChartData([
            {
              name: "Head Department",
              value: roleStats["Head Department"] || 0,
              color: "#f97316",
            },
            {
              name: "Head of Technical",
              value: roleStats["Head of Technical"] || 0,
              color: "#22c55e",
            },
            {
              name: "Mechanic",
              value: roleStats["Mechanic"] || 0,
              color: "#3b82f6",
            },
            {
              name: "Stock Keeper",
              value: roleStats["Stock Keeper"] || 0,
              color: "#eab308",
            },
            { name: "Admin", value: roleStats["Admin"] || 0, color: "#ef4444" },
          ]);
          setChartKey(Date.now().toString());
        }
      } else if (response?.extensions?.data?.data) {
        // This was our original expected structure, keep as a fallback
        const userList = response.extensions.data.data || [];
        const total = response.extensions.data.totalCount || 0;

        console.log(
          `✅ Retrieved ${userList.length} users out of ${total} total`
        );

        setUsers(userList);
        setTotalCount(total);

        if (userList.length > 0) {
          const roleStats = userList.reduce(
            (acc: { [key: string]: number }, user: USER_LIST_ITEM) => {
              const roleName = getRoleNameFromNumber(user.role);
              acc[roleName] = (acc[roleName] || 0) + 1;
              return acc;
            },
            {}
          );

          setChartData([
            {
              name: "Head Department",
              value: roleStats["Head Department"] || 0,
              color: "#f97316",
            },
            {
              name: "Head of Technical",
              value: roleStats["Head of Technical"] || 0,
              color: "#22c55e",
            },
            {
              name: "Mechanic",
              value: roleStats["Mechanic"] || 0,
              color: "#3b82f6",
            },
            {
              name: "Stock Keeper",
              value: roleStats["Stock Keeper"] || 0,
              color: "#eab308",
            },
            { name: "Admin", value: roleStats["Admin"] || 0, color: "#ef4444" },
          ]);
          setChartKey(Date.now().toString());
        }
      } else {
        console.error("❌ Invalid API response structure:", response);
        setUsers([]);
        setTotalCount(0);
        toast.error("Failed to load users: Invalid response format");
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      setUsers([]);
      setTotalCount(0);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, isAdmin]);

  // Fetch users when page or page size changes
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Filtered users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;

    return users.filter((user) => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        user.fullName?.toLowerCase().includes(searchTermLower) ||
        false ||
        user.email?.toLowerCase().includes(searchTermLower) ||
        false ||
        user.userName?.toLowerCase().includes(searchTermLower) ||
        false
      );
    });
  }, [users, searchTerm]);

  // Also add role filtering
  const filteredAndRoleFilteredUsers = useMemo(() => {
    if (filterRole === "all") return filteredUsers;

    return filteredUsers.filter((user) => {
      const roleName = getRoleNameFromNumber(user.role);
      return roleName === filterRole;
    });
  }, [filteredUsers, filterRole]);

  // Add sorting to filtered users
  const sortedAndFilteredUsers = useMemo(() => {
    const sortedUsers = [...filteredAndRoleFilteredUsers].sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      if (sortBy === "name") {
        aValue = (a.fullName || a.userName || "").toLowerCase();
        bValue = (b.fullName || b.userName || "").toLowerCase();

        if (sortDirection === "asc") {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
        }
      } else if (sortBy === "createdDate") {
        aValue = new Date(a.createdDate || "");
        bValue = new Date(b.createdDate || "");

        if (sortDirection === "asc") {
          return aValue.getTime() - bValue.getTime();
        } else {
          return bValue.getTime() - aValue.getTime();
        }
      }

      return 0;
    });

    return sortedUsers;
  }, [filteredAndRoleFilteredUsers, sortBy, sortDirection]);

  const openDeleteDialog = useCallback((user: USER_LIST_ITEM) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
      document.body.style.pointerEvents = "auto";
    }, 300);
  }, []);

  const confirmDeleteUser = useCallback(async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      console.log(
        `🗑️ Disabling user: ${
          selectedUser.fullName || selectedUser.userName
        } (ID: ${selectedUser.id})`
      );

      await apiClient.user.deleteUser(selectedUser.id);

      toast.success(
        `${
          selectedUser.fullName || selectedUser.userName || "User"
        } has been disabled successfully`
      );
      closeDeleteDialog();

      // Refresh the user list
      await fetchUsers();

      console.log("✅ User disabled and list refreshed");
    } catch (error: any) {
      console.error("❌ Error disabling user:", error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        toast.error("User not found");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to disable this user");
      } else {
        toast.error("Failed to disable user. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  }, [selectedUser, closeDeleteDialog, fetchUsers]);

  const handleViewUser = useCallback((user: USER_LIST_ITEM) => {
    // Ensure any previous modal state is cleared
    setSelectedUser(null);

    // Small delay to ensure clean state
    setTimeout(() => {
      setSelectedUser(user);
      setShowUserDetailModal(true);
    }, 50);
  }, []);

  const handleEditUser = useCallback((user: USER_LIST_ITEM) => {
    setSelectedUserId(user.id);
    setShowUpdateUserModal(true);
  }, []);

  const handleCreateUser = useCallback(() => {
    setShowCreateUserModal(true);
  }, []);

  const handleDeleteUser = useCallback(
    (user: USER_LIST_ITEM) => {
      openDeleteDialog(user);
    },
    [openDeleteDialog]
  );

  const getRoleBadgeVariant = (role: number) => {
    const roleName = getRoleNameFromNumber(role);
    switch (roleName) {
      case "Head Department":
        return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400";
      case "Head of Technical":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400";
      case "Mechanic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400";
      case "Stock Keeper":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400";
      case "Admin":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400";
    }
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <Button
          onClick={handleCreateUser}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {/* User List Component */}
      <UserListCpn
        users={sortedAndFilteredUsers}
        totalCount={totalCount}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        searchTerm={searchTerm}
        filterRole={filterRole}
        debouncedSearchTerm={debouncedSearchTerm}
        sortBy={sortBy}
        sortDirection={sortDirection}
        setPage={setPage}
        setPageSize={setPageSize}
        setSearchTerm={setSearchTerm}
        setFilterRole={setFilterRole}
        setSortBy={setSortBy}
        setSortDirection={setSortDirection}
        onView={handleViewUser}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        formatDate={formatDate}
        getRoleNameFromNumber={getRoleNameFromNumber}
      />

      {/* Create User Modal */}
      <CreateUserModal
        open={showCreateUserModal}
        onOpenChange={setShowCreateUserModal}
        onSuccess={fetchUsers}
      />

      {/* Update User Modal */}
      <UpdateUserModal
        open={showUpdateUserModal}
        onOpenChange={setShowUpdateUserModal}
        onSuccess={fetchUsers}
        userId={selectedUserId}
      />

      {/* User Detail Modal */}
      <UserDetailModal
        open={showUserDetailModal}
        onOpenChange={(open) => {
          setShowUserDetailModal(open);
          if (!open) {
            // Clear selected user after modal closes
            setTimeout(() => {
              setSelectedUser(null);
            }, 150);
          }
        }}
        user={selectedUser}
        formatDate={formatDate}
        getRoleNameFromNumber={getRoleNameFromNumber}
        getRoleBadgeVariant={getRoleBadgeVariant}
      />

      {/* Disable confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
          setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disable User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable the user
              {selectedUser &&
                ` "${selectedUser.fullName || selectedUser.userName}"`}
              ? This action will remove the user&apos;s access to the system and
              cannot be undone easily.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? "Disabling..." : "Disable User"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
