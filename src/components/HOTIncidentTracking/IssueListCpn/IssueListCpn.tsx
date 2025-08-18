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
  AlertCircle,
  Calendar,
  User,
  MapPin,
  Clock,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { ISSUE_WEB } from "@/types/error.type";

interface IssueListCpnProps {
  onEditIssue: (issue: ISSUE_WEB) => void;
  onDeleteIssue: (issue: ISSUE_WEB) => void;
  onViewIssue: (issue: ISSUE_WEB) => void;
}

export interface IssueListCpnRef {
  refetchIssues: () => Promise<void>;
}

const IssueListCpn = forwardRef<IssueListCpnRef, IssueListCpnProps>(
  ({ onEditIssue, onDeleteIssue, onViewIssue }, ref) => {
    const [issues, setIssues] = useState<ISSUE_WEB[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    const mockIssues: ISSUE_WEB[] = useMemo(
      () => [
        {
          id: "1",
          title: "Production Line A Malfunction",
          description:
            "Machine stopped working unexpectedly during shift, causing production delays",
          severity: "Critical" as const,
          status: "Open" as const,
          reportedBy: "John Smith",
          reportedByEmail: "john.smith@company.com",
          assignedTo: "Jane Doe",
          assignedToEmail: "jane.doe@company.com",
          reportedDate: "2024-01-15T08:30:00Z",
          category: "Equipment",
          location: "Factory Floor A",
          estimatedResolutionTime: "4 hours",
          tags: ["production", "urgent", "machinery"],
        },
        {
          id: "2",
          title: "Quality Control Issue",
          description:
            "Defective products found in batch #1234, quality standards not met",
          severity: "High" as const,
          status: "InProgress" as const,
          reportedBy: "Mike Johnson",
          reportedByEmail: "mike.johnson@company.com",
          assignedTo: "Sarah Wilson",
          assignedToEmail: "sarah.wilson@company.com",
          reportedDate: "2024-01-14T14:20:00Z",
          category: "Quality",
          location: "Quality Control Lab",
          estimatedResolutionTime: "2 hours",
          tags: ["quality", "batch", "inspection"],
        },
        {
          id: "3",
          title: "Safety Concern in Workshop",
          description:
            "Unsafe working conditions reported, potential hazard for workers",
          severity: "Medium" as const,
          status: "Resolved" as const,
          reportedBy: "Emily Davis",
          reportedByEmail: "emily.davis@company.com",
          resolvedDate: "2024-01-13T16:45:00Z",
          reportedDate: "2024-01-12T09:15:00Z",
          category: "Safety",
          location: "Workshop B",
          actualResolutionTime: "6 hours",
          tags: ["safety", "workplace", "hazard"],
        },
        {
          id: "4",
          title: "Network Connectivity Issues",
          description:
            "Intermittent network failures affecting multiple departments",
          severity: "High" as const,
          status: "InProgress" as const,
          reportedBy: "David Brown",
          reportedByEmail: "david.brown@company.com",
          assignedTo: "IT Support Team",
          reportedDate: "2024-01-13T10:00:00Z",
          category: "IT Infrastructure",
          location: "Building C",
          estimatedResolutionTime: "3 hours",
          tags: ["network", "connectivity", "infrastructure"],
        },
        {
          id: "5",
          title: "HVAC System Malfunction",
          description:
            "Air conditioning system not working properly, temperature control issues",
          severity: "Medium" as const,
          status: "Open" as const,
          reportedBy: "Lisa Anderson",
          reportedByEmail: "lisa.anderson@company.com",
          reportedDate: "2024-01-12T15:30:00Z",
          category: "Facilities",
          location: "Office Building",
          estimatedResolutionTime: "5 hours",
          tags: ["hvac", "climate", "facilities"],
        },
        {
          id: "6",
          title: "Chemical Spill in Storage Area",
          description:
            "Minor chemical spill requiring immediate cleanup and safety assessment",
          severity: "Critical" as const,
          status: "Resolved" as const,
          reportedBy: "Mark Thompson",
          reportedByEmail: "mark.thompson@company.com",
          assignedTo: "Emergency Response Team",
          reportedDate: "2024-01-11T11:45:00Z",
          resolvedDate: "2024-01-11T14:30:00Z",
          category: "Environmental",
          location: "Chemical Storage",
          actualResolutionTime: "2 hours 45 minutes",
          tags: ["chemical", "spill", "emergency", "safety"],
        },
        {
          id: "7",
          title: "Elevator Service Interruption",
          description:
            "Main elevator out of service, affecting multi-floor access",
          severity: "Medium" as const,
          status: "InProgress" as const,
          reportedBy: "Robert Wilson",
          reportedByEmail: "robert.wilson@company.com",
          assignedTo: "Maintenance Team",
          reportedDate: "2024-01-10T09:20:00Z",
          category: "Facilities",
          location: "Main Building",
          estimatedResolutionTime: "1 day",
          tags: ["elevator", "access", "maintenance"],
        },
        {
          id: "8",
          title: "Fire Alarm System False Triggers",
          description:
            "Fire alarm system triggering false alarms, disrupting operations",
          severity: "High" as const,
          status: "Open" as const,
          reportedBy: "Jennifer Lee",
          reportedByEmail: "jennifer.lee@company.com",
          reportedDate: "2024-01-09T13:15:00Z",
          category: "Safety",
          location: "Multiple Buildings",
          estimatedResolutionTime: "4 hours",
          tags: ["fire-alarm", "safety", "false-trigger"],
        },
      ],
      []
    ); // ✅ Empty dependency array

    const fetchIssues = useCallback(async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API call
        // const response = await apiClient.issue.getIssues(currentPage, itemsPerPage);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800)); // ✅ Reduced delay

        // Filter by search term
        const filteredIssues = mockIssues.filter(
          (issue) =>
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            issue.reportedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.location?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // ✅ Apply pagination to filtered results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

        setIssues(paginatedIssues);
        setTotalItems(filteredIssues.length);
        setTotalPages(Math.ceil(filteredIssues.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch issues:", error);
        toast.error("Failed to load issues");
      } finally {
        setLoading(false);
      }
    }, [mockIssues, searchTerm, currentPage]); // ✅ Added currentPage dependency

    useEffect(() => {
      fetchIssues();
    }, [fetchIssues]);

    useImperativeHandle(ref, () => ({
      refetchIssues: fetchIssues,
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
        case "Critical":
          return "bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/20 dark:text-red-300";
        case "High":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "Medium":
          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300";
        case "Low":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "Open":
          return "bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300";
        case "InProgress":
          return "bg-purple-500/10 text-purple-400 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300";
        case "Resolved":
          return "bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/20 dark:text-green-300";
        case "Closed":
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
        default:
          return "bg-gray-500/10 text-gray-400 border-gray-500/20 dark:bg-gray-500/20 dark:text-gray-300";
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-sm text-muted-foreground">Loading issues...</p>
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
              Issue Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and manage all reported issues across your organization
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Issues
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Import Issue
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issues by title, description, location..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background/50 border-muted"
            />
          </div>
          <Badge variant="secondary" className="px-3 py-2">
            {totalItems} issues found
          </Badge>
        </div>

        {/* Issues Table */}
        <div className="border rounded-lg bg-background/50 dark:bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold">Issue Details</TableHead>
                <TableHead className="font-semibold">Severity</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Assignment</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Reported</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        No issues found
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Try adjusting your search criteria or create a new issue
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow
                    key={issue.id}
                    className="hover:bg-muted/30 border-border/50"
                  >
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="font-medium text-foreground">
                          {issue.title}
                        </div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-md">
                          {issue.description}
                        </div>
                        {issue.tags && issue.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag className="h-3 w-3 text-muted-foreground" />
                            {issue.tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="outline"
                                className="text-xs px-1.5 py-0.5 h-5"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {issue.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{issue.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status === "InProgress"
                          ? "In Progress"
                          : issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-muted-foreground">
                        {issue.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {issue.reportedBy}
                          </span>
                        </div>
                        {issue.assignedTo && (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-blue-400" />
                            <span className="text-sm text-blue-400">
                              → {issue.assignedTo}
                            </span>
                          </div>
                        )}
                        {!issue.assignedTo && (
                          <div className="text-xs text-muted-foreground/70">
                            Unassigned
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {issue.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {issue.location}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(issue.reportedDate)}
                          </span>
                        </div>
                        {(issue.estimatedResolutionTime ||
                          issue.actualResolutionTime) && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">
                              {issue.actualResolutionTime ||
                                issue.estimatedResolutionTime}
                            </span>
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
                            onClick={() => onViewIssue(issue)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditIssue(issue)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Issue
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteIssue(issue)}
                            className="gap-2 text-red-400 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete Issue
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
              issues
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

IssueListCpn.displayName = "IssueListCpn";

export default IssueListCpn;
