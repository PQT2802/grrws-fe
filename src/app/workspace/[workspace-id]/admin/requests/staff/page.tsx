"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
  RefreshCw,
  Archive,
  Wrench,
  FileSignature,
  List,
  Calendar,
  User,
  MapPin,
  Clock
} from "lucide-react";

interface StaffRequest {
  id: string;
  title: string;
  description: string;
  type: 'replace_machine' | 'receive_warranty' | 'assemble_machine' | 'handover_sign' | 'other';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  machineName?: string;
  machineCode?: string;
  location: string;
  requestedBy: string;
  assignedTo?: string;
  requestedDate: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  notes?: string;
}

export default function StaffRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const mockStaffRequests: StaffRequest[] = [
    {
      id: "staff-001",
      title: "Replace Production Line Machine",
      description: "Replace faulty CNC machine with new unit to maintain production schedule",
      type: "replace_machine",
      status: "in-progress",
      priority: "high",
      machineName: "CNC Machining Center VMC-850",
      machineCode: "CNC-001",
      location: "Production Floor A",
      requestedBy: "Production Supervisor",
      assignedTo: "Installation Team Alpha",
      requestedDate: "2024-01-15T08:30:00Z",
      dueDate: "2024-01-20T17:00:00Z",
      estimatedHours: 16,
      notes: "Coordinate with production schedule"
    },
    {
      id: "staff-002",
      title: "Receive Warranty Return Equipment",
      description: "Process incoming warranty return for hydraulic pump system",
      type: "receive_warranty",
      status: "pending",
      priority: "medium",
      machineName: "Hydraulic Pump Unit HP-200",
      machineCode: "HYD-002",
      location: "Receiving Dock B",
      requestedBy: "Warranty Coordinator",
      requestedDate: "2024-01-14T14:20:00Z",
      dueDate: "2024-01-16T12:00:00Z",
      estimatedHours: 4,
      notes: "Warranty claim #WC-2024-001"
    },
    {
      id: "staff-003",
      title: "Assemble New Conveyor System",
      description: "Complete assembly of modular conveyor belt system for assembly line upgrade",
      type: "assemble_machine",
      status: "completed",
      priority: "medium",
      machineName: "Modular Conveyor Belt System",
      machineCode: "CONV-003",
      location: "Assembly Area C",
      requestedBy: "Assembly Line Manager",
      assignedTo: "Assembly Team Beta",
      requestedDate: "2024-01-10T09:15:00Z",
      dueDate: "2024-01-15T16:00:00Z",
      completedDate: "2024-01-14T15:30:00Z",
      estimatedHours: 24,
      actualHours: 22,
      notes: "Assembly completed ahead of schedule"
    },
    {
      id: "staff-004",
      title: "Machine Handover Documentation",
      description: "Complete handover documentation and sign-off for new robotic arm installation",
      type: "handover_sign",
      status: "assigned",
      priority: "medium",
      machineName: "6-Axis Industrial Robot",
      machineCode: "ROBOT-004",
      location: "Automation Cell D",
      requestedBy: "Project Manager",
      assignedTo: "Quality Assurance Team",
      requestedDate: "2024-01-13T11:30:00Z",
      dueDate: "2024-01-18T14:00:00Z",
      estimatedHours: 6,
      notes: "Require full safety certification"
    },
    {
      id: "staff-005",
      title: "Replace Damaged Sensor Array",
      description: "Replace temperature sensor array damaged during maintenance",
      type: "replace_machine",
      status: "pending",
      priority: "high",
      machineName: "Temperature Sensor Array",
      machineCode: "SENS-005",
      location: "Quality Control Lab",
      requestedBy: "Quality Inspector",
      requestedDate: "2024-01-12T16:45:00Z",
      dueDate: "2024-01-17T10:00:00Z",
      estimatedHours: 8,
      notes: "Critical for quality control processes"
    },
    {
      id: "staff-006",
      title: "Receive Motor Drive Components",
      description: "Process incoming warranty replacement motor drive components",
      type: "receive_warranty",
      status: "completed",
      priority: "low",
      machineName: "Variable Frequency Drive",
      machineCode: "VFD-006",
      location: "Receiving Dock A",
      requestedBy: "Maintenance Coordinator",
      assignedTo: "Receiving Team",
      requestedDate: "2024-01-09T13:20:00Z",
      completedDate: "2024-01-11T10:15:00Z",
      estimatedHours: 3,
      actualHours: 2,
      notes: "Components received and catalogued"
    },
    {
      id: "staff-007",
      title: "Assemble Pneumatic Control System",
      description: "Assemble and configure pneumatic control system for new production line",
      type: "assemble_machine",
      status: "in-progress",
      priority: "high",
      machineName: "Pneumatic Control System",
      machineCode: "PNEU-007",
      location: "Assembly Area B",
      requestedBy: "Engineering Manager",
      assignedTo: "Pneumatics Team",
      requestedDate: "2024-01-08T10:00:00Z",
      dueDate: "2024-01-19T17:00:00Z",
      estimatedHours: 32,
      notes: "Complex system requiring specialized expertise"
    },
    {
      id: "staff-008",
      title: "Safety System Sign-off",
      description: "Complete safety certification and handover for upgraded safety light curtains",
      type: "handover_sign",
      status: "pending",
      priority: "urgent",
      machineName: "Safety Light Curtain System",
      machineCode: "SAFE-008",
      location: "Multiple Production Areas",
      requestedBy: "Safety Manager",
      requestedDate: "2024-01-07T14:30:00Z",
      dueDate: "2024-01-15T16:00:00Z",
      estimatedHours: 12,
      notes: "Safety compliance critical"
    },
    {
      id: "staff-009",
      title: "General Maintenance Task",
      description: "Routine maintenance and inspection of electrical panel systems",
      type: "other",
      status: "assigned",
      priority: "low",
      location: "Electrical Room",
      requestedBy: "Electrical Supervisor",
      assignedTo: "Electrical Team",
      requestedDate: "2024-01-06T08:00:00Z",
      dueDate: "2024-01-12T17:00:00Z",
      estimatedHours: 8,
      notes: "Monthly routine maintenance"
    }
  ];

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'replace_machine': return { icon: RefreshCw, label: 'Replace Machine', color: 'text-orange-400' };
      case 'receive_warranty': return { icon: Archive, label: 'Receive Warranty', color: 'text-blue-400' };
      case 'assemble_machine': return { icon: Wrench, label: 'Assemble Machine', color: 'text-green-400' };
      case 'handover_sign': return { icon: FileSignature, label: 'Handover Sign', color: 'text-purple-400' };
      case 'other': return { icon: List, label: 'Other Task', color: 'text-gray-400' };
      default: return { icon: List, label: 'Unknown', color: 'text-gray-400' };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'in-progress': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'completed': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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

  const filteredRequests = mockStaffRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.machineName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || request.type === activeTab;
    return matchesSearch && matchesTab;
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

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage task assignments and requests from staff members
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
            <Download className="mr-2 h-4 w-4" />
            Export Requests
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, machine, location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-background/50 border-muted"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Tabs for Request Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">All ({mockStaffRequests.length})</TabsTrigger>
          <TabsTrigger value="replace_machine">
            <RefreshCw className="mr-2 h-4 w-4" />
            Replace ({mockStaffRequests.filter(r => r.type === 'replace_machine').length})
          </TabsTrigger>
          <TabsTrigger value="receive_warranty">
            <Archive className="mr-2 h-4 w-4" />
            Warranty ({mockStaffRequests.filter(r => r.type === 'receive_warranty').length})
          </TabsTrigger>
          <TabsTrigger value="assemble_machine">
            <Wrench className="mr-2 h-4 w-4" />
            Assemble ({mockStaffRequests.filter(r => r.type === 'assemble_machine').length})
          </TabsTrigger>
          <TabsTrigger value="handover_sign">
            <FileSignature className="mr-2 h-4 w-4" />
            Handover ({mockStaffRequests.filter(r => r.type === 'handover_sign').length})
          </TabsTrigger>
          <TabsTrigger value="other">
            <List className="mr-2 h-4 w-4" />
            Other ({mockStaffRequests.filter(r => r.type === 'other').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'all' ? 'All Staff Requests' : 
                 activeTab === 'replace_machine' ? 'Machine Replacement Requests' :
                 activeTab === 'receive_warranty' ? 'Warranty Receipt Requests' :
                 activeTab === 'assemble_machine' ? 'Machine Assembly Requests' :
                 activeTab === 'handover_sign' ? 'Handover Sign-off Requests' : 'Other Task Requests'}
                <Badge variant="secondary">{filteredRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Machine/Equipment</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => {
                    const typeInfo = getTypeInfo(request.type);
                    const TypeIcon = typeInfo.icon;
                    
                    return (
                      <TableRow key={request.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                              {request.description}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {request.location}
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
                          <Badge className={getStatusColor(request.status)}>
                            {request.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(request.priority)}>
                            {request.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {request.machineName ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{request.machineName}</div>
                              {request.machineCode && (
                                <div className="text-xs text-muted-foreground">{request.machineCode}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">No specific machine</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {request.requestedBy}
                            </div>
                            {request.assignedTo && (
                              <div className="text-xs text-blue-400">→ {request.assignedTo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(request.requestedDate)}
                            </div>
                            {request.dueDate && (
                              <div className="text-xs text-orange-400">
                                Due: {formatDate(request.dueDate)}
                              </div>
                            )}
                            {request.completedDate && (
                              <div className="text-xs text-green-400">
                                Done: {formatDate(request.completedDate)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {request.estimatedHours && (
                              <div className="flex items-center gap-1 text-sm">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                Est: {request.estimatedHours}h
                              </div>
                            )}
                            {request.actualHours && (
                              <div className="text-xs text-blue-400">
                                Actual: {request.actualHours}h
                              </div>
                            )}
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
                                View Details
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
        </TabsContent>
      </Tabs>
    </div>
  );
}