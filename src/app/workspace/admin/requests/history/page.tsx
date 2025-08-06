"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Download,
  Filter,
  Calendar,
  User,
  Clock,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Pause,
  UserCheck,
  Wrench,
  Package,
  Clipboard
} from "lucide-react";

interface RequestHistoryItem {
  id: string;
  title: string;
  type: 'hod' | 'hot' | 'stock_keeper' | 'staff';
  category: string;
  status: 'completed' | 'cancelled' | 'rejected' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  assignedTo?: string;
  approvedBy?: string;
  requestedDate: string;
  completedDate?: string;
  duration?: string; // How long it took to complete
  cost?: number;
  description: string;
  outcome: string; // Brief description of the result
  notes?: string;
}

export default function RequestHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  const mockHistoryData: RequestHistoryItem[] = [
    {
      id: "hist-001",
      title: "CNC Machine Calibration Request",
      type: "hod",
      category: "Equipment Maintenance",
      status: "completed",
      priority: "high",
      requestedBy: "Production Manager John",
      assignedTo: "Maintenance Team Alpha",
      approvedBy: "HOD Operations",
      requestedDate: "2024-01-01T08:30:00Z",
      completedDate: "2024-01-05T16:45:00Z",
      duration: "4 days 8 hours",
      cost: 2500,
      description: "Calibration and precision adjustment for CNC machining center",
      outcome: "Successfully calibrated machine, precision improved by 15%",
      notes: "Required specialized tools and external consultant"
    },
    {
      id: "hist-002",
      title: "Hydraulic Pump Warranty Claim",
      type: "hot",
      category: "Warranty Service",
      status: "completed",
      priority: "medium",
      requestedBy: "Technical Lead Sarah",
      assignedTo: "Warranty Processing Team",
      approvedBy: "HOT Manager",
      requestedDate: "2023-12-15T14:20:00Z",
      completedDate: "2023-12-22T10:30:00Z",
      duration: "7 days",
      description: "Warranty claim processing for faulty hydraulic pump",
      outcome: "Pump replaced under warranty, production restored",
      notes: "Manufacturer acknowledged defect, provided replacement"
    },
    {
      id: "hist-003",
      title: "Spare Parts Inventory Replenishment",
      type: "stock_keeper",
      category: "Inventory Management",
      status: "completed",
      priority: "medium",
      requestedBy: "Inventory Specialist Mike",
      assignedTo: "Procurement Team",
      approvedBy: "Stock Manager",
      requestedDate: "2023-12-10T11:15:00Z",
      completedDate: "2023-12-18T14:00:00Z",
      duration: "8 days",
      cost: 15000,
      description: "Quarterly replenishment of critical spare parts inventory",
      outcome: "All 150 spare part types successfully restocked",
      notes: "Bulk order achieved 12% cost savings"
    },
    {
      id: "hist-004",
      title: "Assembly Line Robot Installation",
      type: "staff",
      category: "Machine Installation",
      status: "completed",
      priority: "high",
      requestedBy: "Assembly Supervisor Kate",
      assignedTo: "Installation Team Beta",
      approvedBy: "Operations Director",
      requestedDate: "2023-11-20T09:00:00Z",
      completedDate: "2023-12-05T17:30:00Z",
      duration: "15 days",
      cost: 45000,
      description: "Installation and configuration of 6-axis industrial robot",
      outcome: "Robot successfully installed, productivity increased 25%",
      notes: "Required additional safety certifications and training"
    },
    {
      id: "hist-005",
      title: "Temperature Sensor Network Upgrade",
      type: "hot",
      category: "Equipment Replacement",
      status: "completed",
      priority: "medium",
      requestedBy: "Quality Manager Dave",
      assignedTo: "Electronics Team",
      approvedBy: "HOT Manager",
      requestedDate: "2023-11-01T13:45:00Z",
      completedDate: "2023-11-15T12:20:00Z",
      duration: "14 days",
      cost: 8500,
      description: "Upgrade of temperature monitoring sensor network",
      outcome: "New sensors provide 40% better accuracy and remote monitoring",
      notes: "Integrated with existing SCADA system successfully"
    },
    {
      id: "hist-006",
      title: "Emergency Generator Maintenance",
      type: "hod",
      category: "Preventive Maintenance",
      status: "cancelled",
      priority: "medium",
      requestedBy: "Facility Manager Tom",
      requestedDate: "2023-10-15T10:30:00Z",
      description: "Scheduled preventive maintenance for backup generators",
      outcome: "Cancelled due to budget constraints, rescheduled to Q2",
      notes: "External service provider costs exceeded budget allocation"
    },
    {
      id: "hist-007",
      title: "Conveyor Belt Replacement Parts",
      type: "stock_keeper",
      category: "Spare Parts Order",
      status: "rejected",
      priority: "low",
      requestedBy: "Maintenance Coordinator Lisa",
      requestedDate: "2023-10-05T16:20:00Z",
      description: "Request for non-standard conveyor belt components",
      outcome: "Rejected - standard parts available in inventory",
      notes: "Alternative solution provided using existing stock"
    },
    {
      id: "hist-008",
      title: "Safety System Certification",
      type: "staff",
      category: "Safety Compliance",
      status: "completed",
      priority: "urgent",
      requestedBy: "Safety Manager Jennifer",
      assignedTo: "Safety Compliance Team",
      approvedBy: "Plant Manager",
      requestedDate: "2023-09-20T08:00:00Z",
      completedDate: "2023-09-28T15:45:00Z",
      duration: "8 days",
      cost: 3200,
      description: "Annual safety system certification and compliance check",
      outcome: "All systems certified, compliance maintained",
      notes: "Minor adjustments required for light curtain systems"
    }
  ];

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'hod': return { icon: UserCheck, label: 'HOD Request', color: 'text-blue-400' };
      case 'hot': return { icon: Wrench, label: 'HOT Report', color: 'text-orange-400' };
      case 'stock_keeper': return { icon: Package, label: 'Stock Keeper', color: 'text-green-400' };
      case 'staff': return { icon: Clipboard, label: 'Staff Request', color: 'text-purple-400' };
      default: return { icon: Activity, label: 'Unknown', color: 'text-gray-400' };
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle, color: 'bg-green-500/10 text-green-400 border-green-500/20' };
      case 'cancelled': return { icon: Pause, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
      case 'rejected': return { icon: XCircle, color: 'bg-red-500/10 text-red-400 border-red-500/20' };
      case 'archived': return { icon: AlertTriangle, color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' };
      default: return { icon: Activity, color: 'bg-gray-500/10 text-gray-400 border-gray-500/20' };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const filteredHistory = mockHistoryData.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.outcome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate summary statistics
  const totalRequests = filteredHistory.length;
  const completedRequests = filteredHistory.filter(item => item.status === 'completed').length;
  const totalCost = filteredHistory.reduce((sum, item) => sum + (item.cost || 0), 0);
  const completionRate = totalRequests > 0 ? Math.round((completedRequests / totalRequests) * 100) : 0;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Request History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Complete archive of all processed requests across all departments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
            <Download className="mr-2 h-4 w-4" />
            Export History
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{completionRate}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{completedRequests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">${totalCost.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, description, outcome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-muted"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="hod">HOD Requests</SelectItem>
            <SelectItem value="hot">HOT Reports</SelectItem>
            <SelectItem value="stock_keeper">Stock Keeper</SelectItem>
            <SelectItem value="staff">Staff Requests</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Request History Timeline
            <Badge variant="secondary">{filteredHistory.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Requestor</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Outcome</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHistory.map((item) => {
                const typeInfo = getTypeInfo(item.type);
                const statusInfo = getStatusInfo(item.status);
                const TypeIcon = typeInfo.icon;
                const StatusIcon = statusInfo.icon;
                
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-muted-foreground line-clamp-2 max-w-sm">
                          {item.description}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Category: {item.category}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={`flex items-center gap-2 ${typeInfo.color}`}>
                        <TypeIcon className="h-4 w-4" />
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusInfo.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(item.priority)}>
                        {item.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {item.requestedBy}
                        </div>
                        {item.assignedTo && (
                          <div className="text-xs text-blue-400">→ {item.assignedTo}</div>
                        )}
                        {item.approvedBy && (
                          <div className="text-xs text-green-400">✓ {item.approvedBy}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          {formatDate(item.requestedDate)}
                        </div>
                        {item.completedDate && (
                          <div className="text-xs text-green-400">
                            Done: {formatDate(item.completedDate)}
                          </div>
                        )}
                        {item.duration && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {item.duration}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.cost ? (
                        <span className="font-medium">${item.cost.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                        {item.outcome}
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
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}