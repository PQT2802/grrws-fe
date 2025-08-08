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
  Wrench,
  Calendar,
  User,
  Settings,
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

    // ✅ Enhanced mock data with more entries
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const mockTechnicalIssues: TECHNICAL_ISSUE_WEB[] = [
      {
        id: "1",
        title: "CNC Machine Controller Malfunction",
        description:
          "Controller not responding to commands, possible firmware issue",
        priority: "Urgent",
        status: "InvestigationStarted",
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
        priority: "High",
        status: "FixInProgress",
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
        priority: "Medium",
        status: "Resolved",
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
        priority: "High",
        status: "Reported",
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
        priority: "Urgent",
        status: "FixInProgress",
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
        priority: "Medium",
        status: "Testing",
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
        priority: "High",
        status: "InvestigationStarted",
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
        priority: "Medium",
        status: "Resolved",
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
        priority: "Urgent",
        status: "FixInProgress",
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
        priority: "Medium",
        status: "Reported",
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
        priority: "Urgent",
        status: "InvestigationStarted",
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
        priority: "High",
        status: "Testing",
        deviceId: "dev-012",
        deviceName: "VFD-50HP ABB Drive",
        machineId: "mac-007",
        machineName: "Centrifugal Pump Station",
        reportedBy: "Electrical Tech Kevin",
        assignedTo: "Electrical Engineer Susan",
        reportedDate: "2024-01-12T14:10:00Z",
        systemComponent: "Electrical System",
      },
    ];

    const fetchTechnicalIssues = useCallback(async () => {
      try {
        setLoading(true);

        // TODO: Replace with actual API call
        // const response = await apiClient.technicalIssue.getTechnicalIssues(currentPage, itemsPerPage);

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

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

        setTechnicalIssues(filteredIssues);
        setTotalItems(filteredIssues.length);
        setTotalPages(Math.ceil(filteredIssues.length / itemsPerPage));
      } catch (error) {
        console.error("Failed to fetch technical issues:", error);
        toast.error("Failed to load technical issues");
      } finally {
        setLoading(false);
      }
    }, [searchTerm, mockTechnicalIssues]);

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
          return "bg-red-100 text-red-800 border-red-200";
        case "High":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "Medium":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "Low":
          return "bg-green-100 text-green-800 border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "Reported":
          return "bg-blue-100 text-blue-800 border-blue-200";
        case "InvestigationStarted":
          return "bg-purple-100 text-purple-800 border-purple-200";
        case "FixInProgress":
          return "bg-orange-100 text-orange-800 border-orange-200";
        case "Testing":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case "Resolved":
          return "bg-green-100 text-green-800 border-green-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading technical issues...</span>
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
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue Details</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>System Component</TableHead>
                <TableHead>Device/Machine</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {technicalIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Wrench className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No technical issues found</p>
                  </TableCell>
                </TableRow>
              ) : (
                technicalIssues.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div>
                        <div className="font-medium">{issue.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {issue.description}
                        </div>
                        {issue.errorCode && (
                          <div className="text-xs text-red-600 font-mono mt-1">
                            Error: {issue.errorCode}
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
                        <Settings className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{issue.systemComponent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {issue.deviceName || issue.machineName ? (
                        <div>
                          {issue.deviceName && (
                            <div className="text-sm">{issue.deviceName}</div>
                          )}
                          {issue.machineName && (
                            <div className="text-xs text-gray-500">
                              {issue.machineName}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          System Level
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {issue.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{issue.assignedTo}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">
                          Unassigned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <div className="text-sm">
                            {formatDate(issue.reportedDate)}
                          </div>
                          {issue.resolvedDate && (
                            <div className="text-xs text-green-600">
                              Resolved: {formatDate(issue.resolvedDate)}
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
                          <DropdownMenuItem
                            onClick={() => onViewTechnicalIssue(issue)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEditTechnicalIssue(issue)}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteTechnicalIssue(issue)}
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
              technical issues
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

TechnicalIssueListCpn.displayName = "TechnicalIssueListCpn";

export default TechnicalIssueListCpn;
