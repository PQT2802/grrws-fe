"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
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
  Calendar,
  User,
  Code,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export interface ERROR_LOG_WEB {
  id: string;
  errorCode: string;
  errorMessage: string;
  stackTrace?: string;
  severity: "Info" | "Warning" | "Error" | "Critical" | "Fatal";
  source: string; // Application, Database, Network, etc.
  userId?: string;
  userName?: string;
  occurredAt: string;
  resolvedAt?: string;
  status: "New" | "Investigating" | "Resolved" | "Ignored";
  category: string;
  environment: "Development" | "Testing" | "Staging" | "Production";
  affectedFeature?: string;
  frequency: number; // How many times this error occurred
}

interface ErrorListCpnProps {
  onEditError: (error: ERROR_LOG_WEB) => void;
  onDeleteError: (error: ERROR_LOG_WEB) => void;
  onViewError: (error: ERROR_LOG_WEB) => void;
}

export interface ErrorListCpnRef {
  refetchErrors: () => Promise<void>;
}

const ErrorListCpn = forwardRef<ErrorListCpnRef, ErrorListCpnProps>(
  ({ onEditError, onDeleteError, onViewError }, ref) => {
    const [errors, setErrors] = useState<ERROR_LOG_WEB[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // ✅ FIX: Move mock data outside component or use useMemo
    const mockErrors = useMemo(
      () => [
        {
          id: "1",
          errorCode: "ERR_DB_001",
          errorMessage: "Database connection timeout after 30 seconds",
          stackTrace:
            "at DatabaseManager.connect(DatabaseManager.java:45)\nat ServiceLayer.initialize(ServiceLayer.java:23)",
          severity: "Critical" as const,
          source: "Database",
          userId: "usr-001",
          userName: "System Service",
          occurredAt: "2024-01-15T14:30:25Z",
          status: "Investigating" as const,
          category: "Database",
          environment: "Production" as const,
          affectedFeature: "User Authentication",
          frequency: 15,
        },
        {
          id: "2",
          errorCode: "ERR_API_002",
          errorMessage: "API rate limit exceeded for endpoint /api/devices",
          severity: "Warning" as const,
          source: "API Gateway",
          userId: "usr-002",
          userName: "John Smith",
          occurredAt: "2024-01-15T13:20:10Z",
          resolvedAt: "2024-01-15T13:25:00Z",
          status: "Resolved" as const,
          category: "API",
          environment: "Production" as const,
          affectedFeature: "Device Management",
          frequency: 3,
        },
        {
          id: "3",
          errorCode: "ERR_VALIDATION_003",
          errorMessage: "Invalid input format for device serial number",
          severity: "Error" as const,
          source: "Validation Service",
          occurredAt: "2024-01-15T12:15:30Z",
          status: "New" as const,
          category: "Validation",
          environment: "Production" as const,
          affectedFeature: "Device Registration",
          frequency: 8,
        },
        {
          id: "4",
          errorCode: "ERR_FILE_004",
          errorMessage: "Failed to upload file: insufficient disk space",
          severity: "Error" as const,
          source: "File System",
          userId: "usr-003",
          userName: "Jane Doe",
          occurredAt: "2024-01-15T11:45:00Z",
          status: "Resolved" as const,
          category: "Storage",
          environment: "Production" as const,
          frequency: 1,
          resolvedAt: "2024-01-15T12:00:00Z",
        },
        {
          id: "5",
          errorCode: "ERR_NETWORK_005",
          errorMessage: "Connection refused to external API service",
          stackTrace:
            "at NetworkClient.connect(NetworkClient.java:82)\nat ExternalAPIService.call(ExternalAPIService.java:34)",
          severity: "Critical" as const,
          source: "Network",
          userId: "usr-004",
          userName: "Mike Johnson",
          occurredAt: "2024-01-14T16:45:30Z",
          status: "Investigating" as const,
          category: "Network",
          environment: "Production" as const,
          affectedFeature: "External Integration",
          frequency: 22,
        },
        {
          id: "6",
          errorCode: "ERR_AUTH_006",
          errorMessage: "JWT token expired during active session",
          severity: "Warning" as const,
          source: "Authentication Service",
          userId: "usr-005",
          userName: "Sarah Wilson",
          occurredAt: "2024-01-14T14:20:15Z",
          resolvedAt: "2024-01-14T14:22:00Z",
          status: "Resolved" as const,
          category: "Authentication",
          environment: "Production" as const,
          affectedFeature: "User Session",
          frequency: 12,
        },
        {
          id: "7",
          errorCode: "ERR_MEMORY_007",
          errorMessage: "OutOfMemoryError: Java heap space exceeded",
          stackTrace:
            "at MemoryIntensiveOperation.process(MemoryIntensiveOperation.java:156)\nat DataProcessor.handleLargeFile(DataProcessor.java:89)",
          severity: "Fatal" as const,
          source: "Application",
          occurredAt: "2024-01-14T10:30:45Z",
          status: "New" as const,
          category: "Memory",
          environment: "Production" as const,
          affectedFeature: "Data Processing",
          frequency: 5,
        },
        {
          id: "8",
          errorCode: "ERR_CONFIG_008",
          errorMessage: "Missing required configuration parameter: API_KEY",
          severity: "Error" as const,
          source: "Configuration Service",
          userId: "usr-006",
          userName: "David Brown",
          occurredAt: "2024-01-13T09:15:20Z",
          status: "Investigating" as const,
          category: "Configuration",
          environment: "Staging" as const,
          affectedFeature: "Service Initialization",
          frequency: 7,
        },
        {
          id: "9",
          errorCode: "ERR_SECURITY_009",
          errorMessage: "Suspicious login attempt from unknown IP address",
          severity: "Warning" as const,
          source: "Security Service",
          userId: "usr-007",
          userName: "Emily Davis",
          occurredAt: "2024-01-13T08:45:10Z",
          status: "Resolved" as const,
          category: "Security",
          environment: "Production" as const,
          affectedFeature: "Login System",
          frequency: 18,
          resolvedAt: "2024-01-13T09:00:00Z",
        },
        {
          id: "10",
          errorCode: "ERR_CACHE_010",
          errorMessage: "Redis cache server connection lost",
          stackTrace:
            "at CacheManager.connect(CacheManager.java:67)\nat CacheService.get(CacheService.java:45)",
          severity: "Critical" as const,
          source: "Cache Service",
          occurredAt: "2024-01-12T17:30:25Z",
          status: "New" as const,
          category: "Cache",
          environment: "Production" as const,
          affectedFeature: "Data Caching",
          frequency: 9,
        },
        {
          id: "11",
          errorCode: "ERR_PAYMENT_011",
          errorMessage: "Payment gateway timeout during transaction processing",
          severity: "Critical" as const,
          source: "Payment Service",
          userId: "usr-008",
          userName: "Robert Wilson",
          occurredAt: "2024-01-12T15:20:40Z",
          status: "Investigating" as const,
          category: "Payment",
          environment: "Production" as const,
          affectedFeature: "Payment Processing",
          frequency: 4,
        },
        {
          id: "12",
          errorCode: "ERR_EMAIL_012",
          errorMessage: "SMTP server connection refused for notification emails",
          severity: "Error" as const,
          source: "Email Service",
          occurredAt: "2024-01-12T13:10:15Z",
          resolvedAt: "2024-01-12T13:45:00Z",
          status: "Resolved" as const,
          category: "Email",
          environment: "Production" as const,
          affectedFeature: "Email Notifications",
          frequency: 6,
        },
      ],
      []
    ); // ✅ Empty dependency array

    const fetchErrors = useCallback(async () => {
      try {
        setLoading(true);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800)); // ✅ Reduced delay

        // Filter by search term
        const filteredErrors = mockErrors.filter(
          (error) =>
            error.errorCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            error.errorMessage
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            error.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
            error.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // ✅ Apply pagination to filtered results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedErrors = filteredErrors.slice(startIndex, endIndex);

        setErrors(paginatedErrors);
        setTotalItems(filteredErrors.length);
        setTotalPages(Math.ceil(filteredErrors.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch errors:", error);
        toast.error("Failed to load errors");
      } finally {
        setLoading(false);
      }
    }, [mockErrors, searchTerm, currentPage]); // ✅ Add currentPage dependency

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

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // ✅ Update the UI to match IssueListCpn design
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case "Fatal":
          return "bg-black/10 text-black border-black/20 dark:bg-black/20 dark:text-white";
        case "Critical":
          return "bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/20 dark:text-red-300";
        case "Error":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "Warning":
          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300";
        case "Info":
          return "bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "New":
          return "bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300";
        case "Investigating":
          return "bg-purple-500/10 text-purple-400 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300";
        case "Resolved":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        case "Ignored":
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    const getEnvironmentColor = (environment: string) => {
      switch (environment) {
        case "Production":
          return "bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/20 dark:text-red-300";
        case "Staging":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "Testing":
          return "bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300";
        case "Development":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
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
              placeholder="Search errors by code, message, source..."
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
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Source</TableHead>
                <TableHead className="font-semibold">Environment</TableHead>
                <TableHead className="font-semibold">Frequency</TableHead>
                <TableHead className="font-semibold">Occurred At</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
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
                    key={error.id}
                    className="hover:bg-muted/30 border-border/50"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <Code className="h-4 w-4 text-muted-foreground" />
                          <span className="font-mono text-sm font-medium text-foreground">
                            {error.errorCode}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {error.errorMessage}
                        </div>
                        {error.affectedFeature && (
                          <div className="text-xs text-blue-400">
                            Feature: {error.affectedFeature}
                          </div>
                        )}
                        {error.userName && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {error.userName}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(error.status)}>
                        {error.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-foreground">
                          {error.source}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {error.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getEnvironmentColor(error.environment)}>
                        {error.environment}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        <span className="text-sm font-medium text-foreground">
                          {error.frequency}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(error.occurredAt)}
                          </span>
                        </div>
                        {error.resolvedAt && (
                          <div className="text-xs text-green-400">
                            Resolved: {formatDate(error.resolvedAt)}
                          </div>
                        )}
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

        {/* ✅ Updated Pagination to match IssueListCpn */}
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
