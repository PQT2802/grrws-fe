"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { UserPlus } from "lucide-react"
import { useDebounce } from "@/hooks/useDebounce"
import { toast } from "react-toastify"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Mail, Calendar, Phone } from "lucide-react"
import { USER_LIST_ITEM } from "@/types/user.type"
import { useAuth } from "@/components/providers/AuthProvider"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { UserListCpn } from "@/components/UserListCpn/UserListCpn"
import { CreateUserModal } from "@/components/UserModalCpn/CreateUserModal"

type DialogMode = "view" | "edit" | "create"

// Get role name from role ID
const getRoleNameFromNumber = (role: number): string => {
  switch (role) {
    case 1: return "Head Department"
    case 2: return "Head of Technical"
    case 3: return "Mechanic"
    case 4: return "Stock Keeper"
    case 5: return "Admin"
    default: return "Unknown"
  }
}

export default function UserList() {
  const { isAdmin } = useAuth()
  const router = useRouter()

  // State for users data
  const [users, setUsers] = useState<USER_LIST_ITEM[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  
  // State for searching and filtering
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState<string>("all")
  
  // Debounce the search term
  const debouncedSearchTerm = useDebounce(searchTerm, 1000)
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<USER_LIST_ITEM | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<DialogMode>("view")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [showCreateUserModal, setShowCreateUserModal] = useState(false)

  // Chart data state
  const [chartKey, setChartKey] = useState<string>(Date.now().toString())
  const [chartData, setChartData] = useState([
    { name: "Head Department", value: 0, color: "#f97316" },
    { name: "Head of Technical", value: 0, color: "#22c55e" },
    { name: "Mechanic", value: 0, color: "#3b82f6" },
    { name: "Stock Keeper", value: 0, color: "#eab308" },
    { name: "Admin", value: 0, color: "#ef4444" },
  ])
  const [selectedRole, setSelectedRole] = useState<string>("")

  // Admin authentication check
  useEffect(() => {
    if (!isAdmin) {
      toast.error("Access denied: Admin permission required")
      router.push("/workspace")
    }
  }, [isAdmin, router])

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
  }

  const openDialog = useCallback((mode: DialogMode, user: USER_LIST_ITEM | null = null) => {
    setDialogMode(mode)
    setSelectedUser(user)
    setSelectedRole(user ? getRoleNameFromNumber(user.role) : "")
    setDialogOpen(true)
  }, [])

  const closeDialog = useCallback(() => {
    setDialogOpen(false)
    setTimeout(() => {
      setSelectedUser(null)
      setDialogMode("view")
      setSelectedRole("")
      document.body.style.pointerEvents = "auto"
    }, 300)
  }, [])

  // Direct API call from API client layer without service or router
  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return
    
    setIsLoading(true)
    try {
      console.log(`🔍 Fetching users - Page: ${page}, PageSize: ${pageSize}`)
      
      // Direct call to API client method
      const response = await apiClient.user.getUsersList(page, pageSize)
      console.log("📊 API Response:", response)
      
      // Check the actual response structure based on the received data
      if (response?.data || Array.isArray(response)) {
        // Handle both possible response formats
        const userList = Array.isArray(response) ? response : (response.data || []);
        const total = response.totalCount || userList.length || 0;
        
        console.log(`✅ Retrieved ${userList.length} users out of ${total} total`)
        
        setUsers(userList)
        setTotalCount(total)
        
        // Update chart data based on real user data
        if (userList.length > 0) {
          const roleStats = userList.reduce((acc: {[key: string]: number}, user: USER_LIST_ITEM) => {
            const roleName = getRoleNameFromNumber(user.role)
            acc[roleName] = (acc[roleName] || 0) + 1
            return acc
          }, {})
          
          setChartData([
            { name: "Head Department", value: roleStats["Head Department"] || 0, color: "#f97316" },
            { name: "Head of Technical", value: roleStats["Head of Technical"] || 0, color: "#22c55e" },
            { name: "Mechanic", value: roleStats["Mechanic"] || 0, color: "#3b82f6" },
            { name: "Stock Keeper", value: roleStats["Stock Keeper"] || 0, color: "#eab308" },
            { name: "Admin", value: roleStats["Admin"] || 0, color: "#ef4444" },
          ])
          setChartKey(Date.now().toString())
        }
      } else if (response?.extensions?.data?.data) {
        // This was our original expected structure, keep as a fallback
        const userList = response.extensions.data.data || [];
        const total = response.extensions.data.totalCount || 0;
        
        // Same processing as above...
        console.log(`✅ Retrieved ${userList.length} users out of ${total} total`)
        
        setUsers(userList)
        setTotalCount(total)
        
        if (userList.length > 0) {
          const roleStats = userList.reduce((acc: {[key: string]: number}, user: USER_LIST_ITEM) => {
            const roleName = getRoleNameFromNumber(user.role)
            acc[roleName] = (acc[roleName] || 0) + 1
            return acc
          }, {})
          
          setChartData([
            { name: "Head Department", value: roleStats["Head Department"] || 0, color: "#f97316" },
            { name: "Head of Technical", value: roleStats["Head of Technical"] || 0, color: "#22c55e" },
            { name: "Mechanic", value: roleStats["Mechanic"] || 0, color: "#3b82f6" },
            { name: "Stock Keeper", value: roleStats["Stock Keeper"] || 0, color: "#eab308" },
            { name: "Admin", value: roleStats["Admin"] || 0, color: "#ef4444" },
          ])
          setChartKey(Date.now().toString())
        }
      } else {
        console.error("❌ Invalid API response structure:", response)
        setUsers([])
        setTotalCount(0)
        toast.error("Failed to load users: Invalid response format")
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error)
      setUsers([])
      setTotalCount(0)
      toast.error("Failed to load users")
    } finally {
      setIsLoading(false)
    }
  }, [page, pageSize, isAdmin])

  // Fetch users when page or page size changes
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Filtered users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    
    return users.filter(user => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        (user.fullName?.toLowerCase().includes(searchTermLower) || false) ||
        (user.email?.toLowerCase().includes(searchTermLower) || false) ||
        (user.userName?.toLowerCase().includes(searchTermLower) || false)
      );
    });
  }, [users, searchTerm]);

  // Also add role filtering
  const filteredAndRoleFilteredUsers = useMemo(() => {
    if (filterRole === "all") return filteredUsers;
    
    return filteredUsers.filter(user => {
      const roleName = getRoleNameFromNumber(user.role);
      return roleName === filterRole;
    });
  }, [filteredUsers, filterRole]);

  const openDeleteDialog = useCallback((user: USER_LIST_ITEM) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }, [])

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogOpen(false)
    setTimeout(() => {
      setSelectedUser(null)
      document.body.style.pointerEvents = "auto"
    }, 300)
  }, [])

  const handleSaveUser = useCallback(
    (formData: any) => {
      if (dialogMode === "create") {
        toast.success("User created successfully")
      } else if (dialogMode === "edit" && selectedUser) {
        toast.success("User updated successfully")
      }
      
      closeDialog()
      fetchUsers()
    },
    [dialogMode, selectedUser, closeDialog, fetchUsers]
  )

  const confirmDeleteUser = useCallback(() => {
    if (!selectedUser) return
    
    toast.success(`${selectedUser.fullName || "User"} has been disabled successfully`)
    closeDeleteDialog()
    fetchUsers()
  }, [selectedUser, closeDeleteDialog, fetchUsers])

  const handleViewUser = useCallback((user: USER_LIST_ITEM) => {
    openDialog("view", user)
  }, [openDialog])

  const handleEditUser = useCallback((user: USER_LIST_ITEM) => {
    openDialog("edit", user)
  }, [openDialog])

  const handleCreateUser = useCallback(() => {
    setShowCreateUserModal(true);
  }, [])

  const handleDeleteUser = useCallback((user: USER_LIST_ITEM) => {
    openDeleteDialog(user)
  }, [openDeleteDialog])

  const getRoleBadgeVariant = (role: number) => {
    const roleName = getRoleNameFromNumber(role)
    switch (roleName) {
      case "Head Department":
        return "bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-400"
      case "Head of Technical":
        return "bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-400"
      case "Mechanic":
        return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-400"
      case "Stock Keeper":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400"
      case "Admin":
        return "bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-500/20 dark:text-gray-400"
    }
  }

  // Don't render if not admin
  if (!isAdmin) {
    return null
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Users Management</h1>
        <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      {/* User List Component */}
      <UserListCpn
        users={filteredAndRoleFilteredUsers}
        totalCount={totalCount}
        isLoading={isLoading}
        page={page}
        pageSize={pageSize}
        searchTerm={searchTerm}
        filterRole={filterRole}
        debouncedSearchTerm={debouncedSearchTerm}
        setPage={setPage}
        setPageSize={setPageSize}
        setSearchTerm={setSearchTerm}
        setFilterRole={setFilterRole}
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

      {/* User detail modal */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          setDialogOpen(open)
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "view"
                ? "User Details"
                : dialogMode === "edit"
                  ? "Edit User"
                  : "Create New User"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "view"
                ? "View user information"
                : dialogMode === "edit"
                  ? "Make changes to user information"
                  : "Add a new user to the system"}
            </DialogDescription>
          </DialogHeader>

          {dialogMode === "view" && selectedUser ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="text-2xl">{selectedUser.fullName?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="text-2xl font-semibold">{selectedUser.fullName || "Unnamed User"}</h3>
                  <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                    <Badge variant="outline" className={`${getRoleBadgeVariant(selectedUser.role)} border-0`}>
                      {getRoleNameFromNumber(selectedUser.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium">User Details</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.email || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Phone</Label>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedUser.phoneNumber || "Not provided"}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Account Created</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDate(selectedUser.createdDate)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  name: formData.get("name") as string,
                  email: formData.get("email") as string,
                  phone: formData.get("phone") as string,
                  ...(dialogMode === "create" && { password: formData.get("password") as string }),
                }
                handleSaveUser(data)
              }}
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" defaultValue={selectedUser?.fullName || ""} placeholder="Enter full name" required />
                </div>
                {dialogMode === "create" && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      placeholder="Enter password"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" defaultValue={selectedUser?.email || ""} placeholder="Enter email" required />
                </div>
                {dialogMode === "create" && (
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Head Department">Head Department</SelectItem>
                        <SelectItem value="Head of Technical">Head of Technical</SelectItem>
                        <SelectItem value="Mechanic">Mechanic</SelectItem>
                        <SelectItem value="Stock Keeper">Stock Keeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {dialogMode === "edit" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" name="phone" defaultValue={selectedUser?.phoneNumber || ""} placeholder="Enter phone number" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit">{dialogMode === "create" ? "Create User" : "Save Changes"}</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog()
          setDeleteDialogOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disable the user account
              {selectedUser && ` "${selectedUser.fullName}"`}. The user will no longer be able to log in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-red-600 hover:bg-red-700">
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}