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
  Wrench,
  Calendar,
  User,
  Settings,
  Code, // ✅ Add this import
} from "lucide-react";
import { toast } from "sonner";

export interface TECHNICAL_ISSUE_WEB {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High" | "Urgent";
  status:
    | "Reported"
    | "InvestigationStarted"
    | "FixInProgress"
    | "Testing"
    | "Resolved";
  deviceId?: string;
  deviceName?: string;
  machineId?: string;
  machineName?: string;
  reportedBy: string;
  assignedTo?: string;
  reportedDate: string;
  resolvedDate?: string;
  systemComponent: string;
  errorCode?: string;
}

interface TechnicalIssueListCpnProps {
  onEditTechnicalIssue: (issue: TECHNICAL_ISSUE_WEB) => void;
  onDeleteTechnicalIssue: (issue: TECHNICAL_ISSUE_WEB) => void;
  onViewTechnicalIssue: (issue: TECHNICAL_ISSUE_WEB) => void;
}

export interface TechnicalIssueListCpnRef {
  refetchTechnicalIssues: () => Promise<void>;
}

const TechnicalIssueListCpn = forwardRef<
  TechnicalIssueListCpnRef,
  TechnicalIssueListCpnProps
>(
  (
    { onEditTechnicalIssue, onDeleteTechnicalIssue, onViewTechnicalIssue },
    ref
  ) => {
    const [technicalIssues, setTechnicalIssues] = useState<
      TECHNICAL_ISSUE_WEB[]
    >([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // ✅ FIX: Move mock data to useMemo to prevent re-creation
    const mockTechnicalIssues = useMemo(
      () => [
        {
          id: "1",
          title: "CNC Machine Controller Malfunction",
          description:
            "Controller not responding to commands, possible firmware issue",
          priority: "Urgent" as const,
          status: "InvestigationStarted" as const,
          deviceId: "dev-001",
          deviceName: "CNC Controller Unit",
          machineId: "mac-001",
          machineName: "CNC Machine #1",
          reportedBy: "Tech Lead John",
          assignedTo: "Senior Engineer Mary",
          reportedDate: "2024-01-15T10:30:00Z",
          systemComponent: "Control System",
          errorCode: "ERR_CTRL_001",
        },
        {
          id: "2",
          title: "Database Connection Timeout",
          description:
            "Production database experiencing intermittent connection failures",
          priority: "High" as const,
          status: "FixInProgress" as const,
          reportedBy: "System Admin Bob",
          assignedTo: "Database Expert Lisa",
          reportedDate: "2024-01-14T16:20:00Z",
          systemComponent: "Database",
          errorCode: "DB_TIMEOUT_002",
        },
        {
          id: "3",
          title: "Sensor Calibration Drift",
          description: "Temperature sensors showing inconsistent readings",
          priority: "Medium" as const,
          status: "Resolved" as const,
          deviceId: "dev-003",
          deviceName: "Temperature Sensor Array",
          reportedBy: "Quality Inspector Kate",
          assignedTo: "Maintenance Tech Tom",
          reportedDate: "2024-01-13T09:15:00Z",
          resolvedDate: "2024-01-14T14:30:00Z",
          systemComponent: "Sensor Network",
        },
        {
          id: "4",
          title: "Hydraulic Pump Pressure Drop",
          description:
            "Hydraulic system losing pressure during operation, affecting production line efficiency",
          priority: "High" as const,
          status: "Reported" as const,
          deviceId: "dev-004",
          deviceName: "Hydraulic Pump Unit HP-200",
          machineId: "mac-002",
          machineName: "Press Machine #2",
          reportedBy: "Operator Mike",
          reportedDate: "2024-01-15T14:45:00Z",
          systemComponent: "Hydraulic System",
          errorCode: "HYD_PRESS_004",
        },
        {
          id: "5",
          title: "Network Switch Configuration Error",
          description:
            "Switch not properly routing traffic between production networks",
          priority: "Urgent" as const,
          status: "FixInProgress" as const,
          deviceId: "dev-005",
          deviceName: "Cisco Network Switch SW-48",
          reportedBy: "Network Admin Sarah",
          assignedTo: "Network Engineer Paul",
          reportedDate: "2024-01-15T11:20:00Z",
          systemComponent: "Network Infrastructure",
          errorCode: "NET_SW_005",
        },
        {
          id: "6",
          title: "Motor Vibration Analysis Abnormal",
          description:
            "Excessive vibration detected in main drive motor, possible bearing wear",
          priority: "Medium" as const,
          status: "Testing" as const,
          deviceId: "dev-006",
          deviceName: "AC Drive Motor 15kW",
          machineId: "mac-003",
          machineName: "Conveyor System A",
          reportedBy: "Maintenance Lead Anna",
          assignedTo: "Vibration Specialist James",
          reportedDate: "2024-01-14T08:30:00Z",
          systemComponent: "Drive System",
        },
        {
          id: "7",
          title: "PLC Communication Failure",
          description:
            "Programmable Logic Controller lost communication with HMI interface",
          priority: "High" as const,
          status: "InvestigationStarted" as const,
          deviceId: "dev-007",
          deviceName: "Siemens PLC S7-1500",
          machineId: "mac-004",
          machineName: "Assembly Line B",
          reportedBy: "Control Engineer Rick",
          assignedTo: "PLC Specialist Carol",
          reportedDate: "2024-01-14T13:15:00Z",
          systemComponent: "Control System",
          errorCode: "PLC_COMM_007",
        },
        {
          id: "8",
          title: "Cooling System Thermostat Malfunction",
          description:
            "Industrial cooling system not maintaining proper temperature ranges",
          priority: "Medium" as const,
          status: "Resolved" as const,
          deviceId: "dev-008",
          deviceName: "Industrial Chiller CH-500",
          reportedBy: "Facility Manager Dave",
          assignedTo: "HVAC Technician Lisa",
          reportedDate: "2024-01-13T15:45:00Z",
          resolvedDate: "2024-01-14T10:20:00Z",
          systemComponent: "Cooling System",
        },
        {
          id: "9",
          title: "Servo Motor Encoder Failure",
          description:
            "Position feedback encoder providing incorrect readings, affecting precision",
          priority: "Urgent" as const,
          status: "FixInProgress" as const,
          deviceId: "dev-009",
          deviceName: "Servo Motor SM-3000",
          machineId: "mac-005",
          machineName: "Precision Machining Center",
          reportedBy: "Machine Operator Tom",
          assignedTo: "Motion Control Expert Ben",
          reportedDate: "2024-01-13T12:00:00Z",
          systemComponent: "Motion Control",
          errorCode: "SERVO_ENC_009",
        },
        {
          id: "10",
          title: "Air Compressor Pressure Regulator Issue",
          description:
            "Compressed air system unable to maintain consistent pressure levels",
          priority: "Medium" as const,
          status: "Reported" as const,
          deviceId: "dev-010",
          deviceName: "Rotary Air Compressor AC-75",
          reportedBy: "Maintenance Tech Robert",
          reportedDate: "2024-01-13T10:30:00Z",
          systemComponent: "Pneumatic System",
        },
        {
          id: "11",
          title: "Safety Light Curtain Malfunction",
          description:
            "Safety system not properly detecting personnel in dangerous zones",
          priority: "Urgent" as const,
          status: "InvestigationStarted" as const,
          deviceId: "dev-011",
          deviceName: "Safety Light Curtain SLC-4",
          machineId: "mac-006",
          machineName: "Robotic Welding Cell",
          reportedBy: "Safety Engineer Jennifer",
          assignedTo: "Safety Systems Specialist Mark",
          reportedDate: "2024-01-12T16:20:00Z",
          systemComponent: "Safety System",
          errorCode: "SAFETY_LC_011",
        },
        {
          id: "12",
          title: "Variable Frequency Drive Overheating",
          description:
            "VFD running at excessive temperatures, thermal protection activating",
          priority: "High" as const,
          status: "Testing" as const,
          deviceId: "dev-012",
          deviceName: "VFD-50HP ABB Drive",
          machineId: "mac-007",
          machineName: "Centrifugal Pump Station",
          reportedBy: "Electrical Tech Kevin",
          assignedTo: "Electrical Engineer Susan",
          reportedDate: "2024-01-12T14:10:00Z",
          systemComponent: "Electrical System",
        },
      ],
      [] // ✅ Empty dependency array
    );

    const fetchTechnicalIssues = useCallback(async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API call
        // const response = await apiClient.technicalIssue.getTechnicalIssues(currentPage, itemsPerPage);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800)); // ✅ Reduced delay

        // Filter by search term
        const filteredIssues = mockTechnicalIssues.filter(
          (issue) =>
            issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            issue.systemComponent
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            issue.errorCode?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // ✅ Apply pagination to filtered results
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedIssues = filteredIssues.slice(startIndex, endIndex);

        setTechnicalIssues(paginatedIssues);
        setTotalItems(filteredIssues.length);
        setTotalPages(Math.ceil(filteredIssues.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch technical issues:", error);
        toast.error("Failed to load technical issues");
      } finally {
        setLoading(false);
      }
    }, [mockTechnicalIssues, searchTerm, currentPage]); // ✅ Added currentPage dependency

    useEffect(() => {
      fetchTechnicalIssues();
    }, [fetchTechnicalIssues]);

    useImperativeHandle(ref, () => ({
      refetchTechnicalIssues: fetchTechnicalIssues,
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

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case "Urgent":
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
        case "Reported":
          return "bg-blue-500/10 text-blue-400 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300";
        case "InvestigationStarted":
          return "bg-purple-500/10 text-purple-400 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300";
        case "FixInProgress":
          return "bg-orange-500/10 text-orange-400 border-orange-500/20 dark:bg-orange-500/20 dark:text-orange-300";
        case "Testing":
          return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-300";
        case "Resolved":
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
            <p className="text-sm text-muted-foreground">
              Loading technical issues...
            </p>
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
              Technical Issue Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track and resolve technical issues across devices and systems
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Technical Issues
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Upload className="mr-2 h-4 w-4" />
              Import Technical Issue
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search technical issues by title, component, error code..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-background/50 border-muted"
            />
          </div>
          <Badge variant="secondary" className="px-3 py-2">
            {totalItems} technical issues found
          </Badge>
        </div>

        {/* Technical Issues Table */}
        <div className="border rounded-lg bg-background/50 dark:bg-card/50">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50">
                <TableHead className="font-semibold">Issue Details</TableHead>
                <TableHead className="font-semibold">Priority</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">System Component</TableHead>
                <TableHead className="font-semibold">Device/Machine</TableHead>
                <TableHead className="font-semibold">Assignment</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="w-[100px] text-center font-semibold">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicalIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <Wrench className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-lg font-medium text-muted-foreground">
                        No technical issues found
                      </p>
                      <p className="text-sm text-muted-foreground/80 mt-1">
                        Try adjusting your search criteria
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                technicalIssues.map((issue) => (
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
                        {issue.errorCode && (
                          <div className="flex items-center gap-1">
                            <Code className="h-3 w-3 text-red-400" />
                            <span className="text-xs text-red-400 font-mono">
                              {issue.errorCode}
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(issue.status)}>
                        {issue.status.replace(/([A-Z])/g, " $1").trim()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">
                          {issue.systemComponent}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {issue.deviceName || issue.machineName ? (
                        <div className="space-y-1">
                          {issue.deviceName && (
                            <div className="text-sm font-medium text-foreground">
                              {issue.deviceName}
                            </div>
                          )}
                          {issue.machineName && (
                            <div className="text-xs text-muted-foreground">
                              {issue.machineName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          System Level
                        </span>
                      )}
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDate(issue.reportedDate)}
                          </span>
                        </div>
                        {issue.resolvedDate && (
                          <div className="text-xs text-green-400">
                            Resolved: {formatDate(issue.resolvedDate)}
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
                            onClick={() => onViewTechnicalIssue(issue)}
                            className="gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditTechnicalIssue(issue)}
                            className="gap-2"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit Issue
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteTechnicalIssue(issue)}
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
              technical issues
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

TechnicalIssueListCpn.displayName = "TechnicalIssueListCpn";

export default TechnicalIssueListCpn;
