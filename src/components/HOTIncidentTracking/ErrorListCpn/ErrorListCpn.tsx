"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  Loader2,
  Bug,
  Code,
  TrendingUp,
  CheckCircle2,
  Clock,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { ErrorIncident } from "@/types/incident.type";
import { apiClient } from "@/lib/api-client";

interface ErrorListCpnProps {
  onEditError: (error: ErrorIncident) => void;
  onDeleteError: (error: ErrorIncident) => void;
  onViewError: (error: ErrorIncident) => void;
}

export interface ErrorListCpnRef {
  refetchErrors: () => Promise<void>;
}

const ErrorListCpn = forwardRef<ErrorListCpnRef, ErrorListCpnProps>(
  ({ onEditError, onDeleteError, onViewError }, ref) => {
    const [errors, setErrors] = useState<ErrorIncident[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const fetchErrors = useCallback(async () => {
      try {
        setLoading(true);
        console.log(`🔄 Fetching errors (page ${currentPage}, search: "${searchTerm}")`);
        
        const response = await apiClient.incident.getErrors(
          currentPage,
          itemsPerPage,
          searchTerm || undefined
        );

        console.log("📋 Errors API response:", response);

        // ✅ Enhanced response handling for multiple possible structures
        let errorsData: ErrorIncident[] = [];
        let totalCount = 0;

        if (response && typeof response === 'object') {
          // Structure 1: { extensions: { data: { data: [], totalCount: number } } }
          if (response.extensions?.data?.data && Array.isArray(response.extensions.data.data)) {
            errorsData = response.extensions.data.data;
            totalCount = response.extensions.data.totalCount || errorsData.length;
            console.log("✅ Using structure: extensions.data.data");
          }
          // Structure 2: { data: { data: [], totalCount: number } }
          else if (response.data?.data && Array.isArray(response.data.data)) {
            errorsData = response.data.data;
            totalCount = response.data.totalCount || errorsData.length;
            console.log("✅ Using structure: data.data");
          }
          // Structure 3: { data: [] } with totalCount at root
          else if (response.data && Array.isArray(response.data)) {
            errorsData = response.data;
            totalCount = response.totalCount || response.totalItems || errorsData.length;
            console.log("✅ Using structure: data (array)");
          }
          // Structure 4: Direct array response
          else if (Array.isArray(response)) {
            errorsData = response;
            totalCount = errorsData.length;
            console.log("✅ Using structure: direct array");
          }
          // Structure 5: { errors: [] } (alternative field name)
          else if ((response as any).errors && Array.isArray((response as any).errors)) {
            errorsData = (response as any).errors;
            totalCount = (response as any).totalCount || (response as any).totalItems || errorsData.length;
            console.log("✅ Using structure: errors field");
          }
          // Structure 6: { items: [] } (pagination wrapper)
          else if (response.items && Array.isArray(response.items)) {
            errorsData = response.items;
            totalCount = response.totalCount || response.totalItems || errorsData.length;
            console.log("✅ Using structure: items field");
          }
          else {
            console.warn("⚠️ Unrecognized response structure, attempting to find array data...");
            console.log("🔍 Response keys:", Object.keys(response));
            
            // Try to find any array in the response object
            const possibleArrays = Object.values(response).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              errorsData = possibleArrays[0] as ErrorIncident[];
              totalCount = errorsData.length;
              console.log("✅ Found array data in response:", errorsData.length, "items");
            } else {
              console.error("❌ No array data found in response");
              errorsData = [];
              totalCount = 0;
            }
          }
        } else {
          console.error("❌ Invalid response type:", typeof response);
          errorsData = [];
          totalCount = 0;
        }

        // Set the extracted data
        setErrors(errorsData);
        setTotalItems(totalCount);
        setTotalPages(Math.ceil(totalCount / itemsPerPage));
        
        console.log(`✅ Successfully loaded ${errorsData.length} errors (total: ${totalCount})`);
        
      } catch (error) {
        console.error("❌ Failed to fetch errors:", error);
        toast.error("Failed to load errors");
        setErrors([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    }, [currentPage, searchTerm]);

    useEffect(() => {
      fetchErrors();
    }, [fetchErrors]);

    useImperativeHandle(ref, () => ({
      refetchErrors: fetchErrors,
    }));

    const handleSearch = (value: string) => {
      setSearchTerm(value);
      setCurrentPage(1);
    };

    const getSeverityColor = (severity: string) => {
      switch (severity?.toLowerCase()) {
        case "critical":
          return "bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/20 dark:text-red-300";
        case "high":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "medium":
          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300";
        case "low":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    const getCommonBadgeVariant = (isCommon: boolean) => {
      return isCommon
        ? "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300"
        : "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Loading errors...</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Error Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and manage system errors across all environments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Errors
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Import Errors
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search errors by code, name or description..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background/50 border-muted"
            />
          </div>
          <Badge variant="secondary" className="px-3 py-2">
            {totalItems} errors found
          </Badge>
        </div>

        {/* Error Logs Table */}
        <div className="border rounded-lg bg-background/50 dark:bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold">Error Details</TableHead>
                <TableHead className="font-semibold">Severity</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Repair Time</TableHead>
                <TableHead className="font-semibold">Occurrences</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Bug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        No errors found
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((error) => (
                  <TableRow
                    key={error.errorCode}
                    className="hover:bg-muted/30 border-border/50"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium text-foreground">
                            {error.errorCode}
                          </span>
                        </div>
                        <div className="font-medium text-foreground">
                          {error.name}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {error.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCommonBadgeVariant(error.isCommon)}>
                        {error.isCommon ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Common
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 mr-1" />
                            Unique
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-blue-400" />
                        <span className="text-sm text-foreground">
                          {error.estimatedRepairTime}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-foreground">
                          {error.occurrenceCount}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-muted/50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onViewError(error)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditError(error)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteError(error)}
                            className="gap-2 text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 bg-background/50 dark:bg-muted/20 rounded-lg border">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              errors
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

ErrorListCpn.displayName = "ErrorListCpn";

export default ErrorListCpn;