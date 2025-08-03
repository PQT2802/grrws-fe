import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Shield,
  User,
  ArrowUpDown,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination"
import { USER_LIST_ITEM } from "@/types/user.type"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"

interface UserListCpnProps {
  users: USER_LIST_ITEM[]
  totalCount: number
  isLoading: boolean
  page: number
  pageSize: number
  searchTerm: string
  filterRole: string
  debouncedSearchTerm: string
  sortBy?: string
  sortDirection?: string
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setSearchTerm: (term: string) => void
  setFilterRole: (role: string) => void
  setSortBy?: (sortBy: string) => void
  setSortDirection?: (direction: string) => void
  onView: (user: USER_LIST_ITEM) => void
  onEdit: (user: USER_LIST_ITEM) => void
  onDelete: (user: USER_LIST_ITEM) => void
  formatDate: (date: string) => string
  getRoleNameFromNumber: (role: number) => string
}

export const UserListCpn = ({
  users,
  totalCount,
  isLoading,
  page,
  pageSize,
  searchTerm,
  filterRole,
  debouncedSearchTerm,
  sortBy = "name",
  sortDirection = "asc",
  setPage,
  setPageSize,
  setSearchTerm,
  setFilterRole,
  setSortBy,
  setSortDirection,
  onView,
  onEdit,
  onDelete,
  formatDate,
  getRoleNameFromNumber
}: UserListCpnProps) => {
  
  const totalPages = Math.ceil(totalCount / pageSize)

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

  const handleSortChange = (value: string) => {
    if (setSortBy && setSortDirection) {
      const [field, direction] = value.split('-')
      setSortBy(field)
      setSortDirection(direction)
    }
  }

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
            {searchTerm && searchTerm !== debouncedSearchTerm && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-blue-600">Searching...</span>
            )}
          </div>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="Head Department">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Head Department</span>
                </div>
              </SelectItem>
              <SelectItem value="Head of Technical">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Head of Technical</span>
                </div>
              </SelectItem>
              <SelectItem value="Mechanic">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Mechanic</span>
                </div>
              </SelectItem>
              <SelectItem value="Stock Keeper">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Stock Keeper</span>
                </div>
              </SelectItem>
              <SelectItem value="Admin">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Admin</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <Select 
              value={`${sortBy}-${sortDirection}`} 
              onValueChange={handleSortChange}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name</SelectItem>
                <SelectItem value="createdDate-desc">Date</SelectItem>
              </SelectContent>
            </Select>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSortDirection && setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                    }}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {sortDirection === "asc" ? "Sort Descending" : "Sort Ascending"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Created</th>
                <th className="w-[80px] px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="border-b animate-pulse">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    {searchTerm ? `No users found matching "${searchTerm}"` : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.userName?.charAt(0) || "U"}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.userName || "Unnamed User"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email || "N/A"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={`${getRoleBadgeVariant(user.role)} border-0`}>
                        {getRoleNameFromNumber(user.role)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(user.createdDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onView(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(user)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDelete(user)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Disable User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination using existing component */}
        <div className="flex items-center justify-between px-4 py-4 border-t">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value))
              setPage(1)
            }}>
              <SelectTrigger className="w-[70px] h-8">
                <SelectValue>{pageSize}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500">
              Showing {totalCount > 0 ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, totalCount)} of {totalCount}
            </span>
          </div>

          <Pagination className="justify-end">
            <PaginationContent className="ml-auto">
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => page > 1 && setPage(page - 1)}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {/* First page if not visible */}
              {page > 2 && (
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(1)}>1</PaginationLink>
                </PaginationItem>
              )}
              
              {/* Ellipsis if needed */}
              {page > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Previous page if not first */}
              {page > 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(page - 1)}>{page - 1}</PaginationLink>
                </PaginationItem>
              )}
              
              {/* Current page */}
              <PaginationItem>
                <PaginationLink isActive>{page}</PaginationLink>
              </PaginationItem>
              
              {/* Next page if not last */}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(page + 1)}>{page + 1}</PaginationLink>
                </PaginationItem>
              )}
              
              {/* Ellipsis if needed */}
              {page < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              {/* Last page if not visible */}
              {page < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink onClick={() => setPage(totalPages)}>{totalPages}</PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => page < totalPages && setPage(page + 1)}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </div>
    </>
  )
}