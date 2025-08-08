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

    // ✅ Enhanced mock data with more entries
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const mockErrors: ERROR_LOG_WEB[] = [
      {
        id: "1",
        errorCode: "ERR_DB_001",
        errorMessage: "Database connection timeout after 30 seconds",
        stackTrace:
          "at DatabaseManager.connect(DatabaseManager.java:45)\nat ServiceLayer.initialize(ServiceLayer.java:23)",
        severity: "Critical",
        source: "Database",
        userId: "usr-001",
        userName: "System Service",
        occurredAt: "2024-01-15T14:30:25Z",
        status: "Investigating",
        category: "Database",
        environment: "Production",
        affectedFeature: "User Authentication",
        frequency: 15,
      },
      {
        id: "2",
        errorCode: "ERR_API_002",
        errorMessage: "API rate limit exceeded for endpoint /api/devices",
        severity: "Warning",
        source: "API Gateway",
        userId: "usr-002",
        userName: "John Smith",
        occurredAt: "2024-01-15T13:20:10Z",
        resolvedAt: "2024-01-15T13:25:00Z",
        status: "Resolved",
        category: "API",
        environment: "Production",
        affectedFeature: "Device Management",
        frequency: 3,
      },
      {
        id: "3",
        errorCode: "ERR_VALIDATION_003",
        errorMessage: "Invalid input format for device serial number",
        severity: "Error",
        source: "Validation Service",
        occurredAt: "2024-01-15T12:15:30Z",
        status: "New",
        category: "Validation",
        environment: "Production",
        affectedFeature: "Device Registration",
        frequency: 8,
      },
      {
        id: "4",
        errorCode: "ERR_FILE_004",
        errorMessage: "Failed to upload file: insufficient disk space",
        severity: "Error",
        source: "File System",
        userId: "usr-003",
        userName: "Jane Doe",
        occurredAt: "2024-01-15T11:45:00Z",
        status: "Resolved",
        category: "Storage",
        environment: "Production",
        frequency: 1,
        resolvedAt: "2024-01-15T12:00:00Z",
      },
      {
        id: "5",
        errorCode: "ERR_NETWORK_005",
        errorMessage: "Connection refused to external API service",
        stackTrace:
          "at NetworkClient.connect(NetworkClient.java:82)\nat ExternalAPIService.call(ExternalAPIService.java:34)",
        severity: "Critical",
        source: "Network",
        userId: "usr-004",
        userName: "Mike Johnson",
        occurredAt: "2024-01-14T16:45:30Z",
        status: "Investigating",
        category: "Network",
        environment: "Production",
        affectedFeature: "External Integration",
        frequency: 22,
      },
      {
        id: "6",
        errorCode: "ERR_AUTH_006",
        errorMessage: "JWT token expired during active session",
        severity: "Warning",
        source: "Authentication Service",
        userId: "usr-005",
        userName: "Sarah Wilson",
        occurredAt: "2024-01-14T14:20:15Z",
        resolvedAt: "2024-01-14T14:22:00Z",
        status: "Resolved",
        category: "Authentication",
        environment: "Production",
        affectedFeature: "User Session",
        frequency: 12,
      },
      {
        id: "7",
        errorCode: "ERR_MEMORY_007",
        errorMessage: "OutOfMemoryError: Java heap space exceeded",
        stackTrace:
          "at MemoryIntensiveOperation.process(MemoryIntensiveOperation.java:156)\nat DataProcessor.handleLargeFile(DataProcessor.java:89)",
        severity: "Fatal",
        source: "Application",
        occurredAt: "2024-01-14T10:30:45Z",
        status: "New",
        category: "Memory",
        environment: "Production",
        affectedFeature: "Data Processing",
        frequency: 5,
      },
      {
        id: "8",
        errorCode: "ERR_CONFIG_008",
        errorMessage: "Missing required configuration parameter: API_KEY",
        severity: "Error",
        source: "Configuration Service",
        userId: "usr-006",
        userName: "David Brown",
        occurredAt: "2024-01-13T09:15:20Z",
        status: "Investigating",
        category: "Configuration",
        environment: "Staging",
        affectedFeature: "Service Initialization",
        frequency: 7,
      },
      {
        id: "9",
        errorCode: "ERR_SECURITY_009",
        errorMessage: "Suspicious login attempt from unknown IP address",
        severity: "Warning",
        source: "Security Service",
        userId: "usr-007",
        userName: "Emily Davis",
        occurredAt: "2024-01-13T08:45:10Z",
        status: "Resolved",
        category: "Security",
        environment: "Production",
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
        severity: "Critical",
        source: "Cache Service",
        occurredAt: "2024-01-12T17:30:25Z",
        status: "New",
        category: "Cache",
        environment: "Production",
        affectedFeature: "Data Caching",
        frequency: 9,
      },
      {
        id: "11",
        errorCode: "ERR_PAYMENT_011",
        errorMessage: "Payment gateway timeout during transaction processing",
        severity: "Critical",
        source: "Payment Service",
        userId: "usr-008",
        userName: "Robert Wilson",
        occurredAt: "2024-01-12T15:20:40Z",
        status: "Investigating",
        category: "Payment",
        environment: "Production",
        affectedFeature: "Payment Processing",
        frequency: 4,
      },
      {
        id: "12",
        errorCode: "ERR_EMAIL_012",
        errorMessage: "SMTP server connection refused for notification emails",
        severity: "Error",
        source: "Email Service",
        occurredAt: "2024-01-12T13:10:15Z",
        resolvedAt: "2024-01-12T13:45:00Z",
        status: "Resolved",
        category: "Email",
        environment: "Production",
        affectedFeature: "Email Notifications",
        frequency: 6,
      },
    ];

    const fetchErrors = useCallback(async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API call
        // const response = await apiClient.error.getErrors(currentPage, itemsPerPage);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

        setErrors(filteredErrors);
        setTotalItems(filteredErrors.length);
        setTotalPages(Math.ceil(filteredErrors.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch errors:", error);
        toast.error("Failed to load errors");
      } finally {
        setLoading(false);
      }
    }, [mockErrors, searchTerm]);

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

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case "Fatal":
          return "bg-black text-white border-black";
        case "Critical":
          return "bg-red-100 text-red-800 border-red-200";
        case "Error":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "Warning":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "Info":
          return "bg-blue-100 text-blue-800 border-blue-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "New":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "Investigating":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "Resolved":
          return "bg-green-100 text-green-800 border-green-200";
        case "Ignored":
          return "bg-gray-100 text-gray-800 border-gray-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getEnvironmentColor = (environment: string) => {
      switch (environment) {
        case "Production":
          return "bg-red-100 text-red-800 border-red-200";
        case "Staging":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "Testing":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "Development":
          return "bg-green-100 text-green-800 border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading errors ...</span>
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Error Details</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Occurred At</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Bug className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No errors found</p>
                  </TableCell>
                </TableRow>
              ) : (
                errors.map((error) => (
                  <TableRow key={error.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Code className="h-4 w-4 text-gray-400" />
                          <span className="font-mono text-sm font-medium">
                            {error.errorCode}
                          </span>
                        </div>
                        <div className="text-sm text-gray-900 mb-1">
                          {error.errorMessage}
                        </div>
                        {error.affectedFeature && (
                          <div className="text-xs text-blue-600">
                            Feature: {error.affectedFeature}
                          </div>
                        )}
                        {error.userName && (
                          <div className="text-xs text-gray-500 mt-1">
                            User: {error.userName}
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
                      <div>
                        <div className="text-sm font-medium">
                          {error.source}
                        </div>
                        <div className="text-xs text-gray-500">
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
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">
                          {error.frequency}x
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {formatDate(error.occurredAt)}
                          </div>
                          {error.resolvedAt && (
                            <div className="text-xs text-green-600">
                              Resolved: {formatDate(error.resolvedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onViewError(error)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditError(error)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteError(error)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
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
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
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
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
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
