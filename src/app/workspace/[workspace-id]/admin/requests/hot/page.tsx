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
  Wrench,
  Shield,
  RefreshCw,
  Calendar,
  User,
  MapPin
} from "lucide-react";

interface HOTReport {
  id: string;
  title: string;
  description: string;
  type: 'warranty' | 'repair' | 'replacement';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deviceName: string;
  machineName?: string;
  location: string;
  reportedBy: string;
  assignedTo?: string;
  reportedDate: string;
  estimatedCompletion?: string;
  cost?: number;
}

export default function HOTReportsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const mockHOTReports: HOTReport[] = [
    {
      id: "hot-001",
      title: "CNC Machine Warranty Claim",
      description: "Machine experiencing calibration issues within warranty period",
      type: "warranty",
      status: "in-progress",
      priority: "high",
      deviceName: "CNC Controller Unit",
      machineName: "CNC Machine #1",
      location: "Production Floor A",
      reportedBy: "John Smith",
      assignedTo: "Warranty Team Alpha",
      reportedDate: "2024-01-15T09:30:00Z",
      estimatedCompletion: "2024-01-20T17:00:00Z"
    },
    {
      id: "hot-002",
      title: "Hydraulic Pump Repair",
      description: "Pump losing pressure, requires immediate repair to avoid production delays",
      type: "repair",
      status: "pending",
      priority: "urgent",
      deviceName: "Hydraulic Pump HP-200",
      machineName: "Press Machine #2",
      location: "Production Floor B",
      reportedBy: "Mike Johnson",
      reportedDate: "2024-01-14T14:20:00Z",
      cost: 1500
    },
    {
      id: "hot-003",
      title: "Motor Drive Replacement",
      description: "Drive unit failed beyond repair, requires complete replacement",
      type: "replacement",
      status: "completed",
      priority: "medium",
      deviceName: "AC Drive Motor 15kW",
      machineName: "Conveyor System A",
      location: "Assembly Line 1",
      reportedBy: "Sarah Wilson",
      assignedTo: "Installation Team Beta",
      reportedDate: "2024-01-12T11:15:00Z",
      estimatedCompletion: "2024-01-18T16:30:00Z",
      cost: 3200
    },
    {
      id: "hot-004",
      title: "Sensor Array Warranty Service",
      description: "Temperature sensors showing inconsistent readings, covered under warranty",
      type: "warranty",
      status: "pending",
      priority: "medium",
      deviceName: "Temperature Sensor Array",
      location: "Quality Control Lab",
      reportedBy: "Emily Davis",
      reportedDate: "2024-01-13T16:45:00Z"
    },
    {
      id: "hot-005",
      title: "PLC Module Repair",
      description: "Communication module failure affecting system performance",
      type: "repair",
      status: "in-progress",
      priority: "high",
      deviceName: "Siemens PLC S7-1500",
      machineName: "Assembly Line B",
      location: "Control Room",
      reportedBy: "David Brown",
      assignedTo: "Control Systems Team",
      reportedDate: "2024-01-11T08:20:00Z",
      cost: 800
    },
    {
      id: "hot-006",
      title: "Safety System Replacement",
      description: "Light curtain system end of life, requires modern replacement",
      type: "replacement",
      status: "pending",
      priority: "urgent",
      deviceName: "Safety Light Curtain SLC-4",
      machineName: "Robotic Welding Cell",
      location: "Welding Department",
      reportedBy: "Jennifer Lee",
      reportedDate: "2024-01-10T13:30:00Z",
      cost: 2800
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warranty': return Shield;
      case 'repair': return Wrench;
      case 'replacement': return RefreshCw;
      default: return Wrench;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
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

  const filteredReports = mockHOTReports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || report.type === activeTab;
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
          <h1 className="text-2xl font-semibold tracking-tight">HOT Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage warranty claims, repairs, and replacement requests from Head of Technical
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 p-4 bg-background/50 dark:bg-muted/20 rounded-lg border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search reports by title, device, location..."
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

      {/* Tabs for Report Types */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Reports ({mockHOTReports.length})</TabsTrigger>
          <TabsTrigger value="warranty">
            <Shield className="mr-2 h-4 w-4" />
            Warranty ({mockHOTReports.filter(r => r.type === 'warranty').length})
          </TabsTrigger>
          <TabsTrigger value="repair">
            <Wrench className="mr-2 h-4 w-4" />
            Repair ({mockHOTReports.filter(r => r.type === 'repair').length})
          </TabsTrigger>
          <TabsTrigger value="replacement">
            <RefreshCw className="mr-2 h-4 w-4" />
            Replacement ({mockHOTReports.filter(r => r.type === 'replacement').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'all' ? 'All HOT Reports' : 
                 activeTab === 'warranty' ? 'Warranty Claims' :
                 activeTab === 'repair' ? 'Repair Requests' : 'Replacement Requests'}
                <Badge variant="secondary">{filteredReports.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Details</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Device/Machine</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.map((report) => {
                    const TypeIcon = getTypeIcon(report.type);
                    return (
                      <TableRow key={report.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{report.title}</div>
                            <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                              {report.description}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {report.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <TypeIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{report.type}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(report.status)}>
                            {report.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(report.priority)}>
                            {report.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium text-sm">{report.deviceName}</div>
                            {report.machineName && (
                              <div className="text-xs text-muted-foreground">{report.machineName}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              {report.reportedBy}
                            </div>
                            {report.assignedTo && (
                              <div className="text-xs text-blue-400">→ {report.assignedTo}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              {formatDate(report.reportedDate)}
                            </div>
                            {report.estimatedCompletion && (
                              <div className="text-xs text-muted-foreground">
                                Est: {formatDate(report.estimatedCompletion)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {report.cost ? (
                            <span className="font-medium">${report.cost.toLocaleString()}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
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