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
  Package,
  Settings,
  Calendar,
  User,
  Hash,
  DollarSign
} from "lucide-react";

interface StockKeeperRequest {
  id: string;
  title: string;
  description: string;
  type: 'machine' | 'sparepart';
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  itemName: string;
  itemCode?: string;
  quantity: number;
  unitPrice?: number;
  totalCost?: number;
  requestedBy: string;
  approvedBy?: string;
  requestedDate: string;
  approvedDate?: string;
  expectedDelivery?: string;
  vendor?: string;
  category?: string;
}

export default function StockKeeperRequestsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const mockStockRequests: StockKeeperRequest[] = [
    {
      id: "sk-001",
      title: "CNC Machine Purchase Request",
      description: "New CNC machine required for expanding production capacity",
      type: "machine",
      status: "pending",
      priority: "high",
      itemName: "CNC Machining Center VMC-850",
      itemCode: "CNC-VMC-850",
      quantity: 1,
      unitPrice: 85000,
      totalCost: 85000,
      requestedBy: "Production Manager",
      requestedDate: "2024-01-15T10:30:00Z",
      expectedDelivery: "2024-03-15T00:00:00Z",
      vendor: "Haas Automation",
      category: "Machining Equipment"
    },
    {
      id: "sk-002",
      title: "Hydraulic Pump Spare Parts",
      description: "Replacement seals and gaskets for hydraulic pump maintenance",
      type: "sparepart",
      status: "approved",
      priority: "medium",
      itemName: "Hydraulic Pump Seal Kit",
      itemCode: "HP-SEAL-200",
      quantity: 5,
      unitPrice: 150,
      totalCost: 750,
      requestedBy: "Maintenance Team",
      approvedBy: "Warehouse Manager",
      requestedDate: "2024-01-14T14:20:00Z",
      approvedDate: "2024-01-15T09:00:00Z",
      expectedDelivery: "2024-01-20T00:00:00Z",
      vendor: "Industrial Supply Co.",
      category: "Hydraulic Parts"
    },
    {
      id: "sk-003",
      title: "Conveyor Belt System",
      description: "Replacement conveyor system for assembly line modernization",
      type: "machine",
      status: "fulfilled",
      priority: "medium",
      itemName: "Modular Conveyor Belt System",
      itemCode: "CONV-MOD-500",
      quantity: 1,
      unitPrice: 12000,
      totalCost: 12000,
      requestedBy: "Assembly Line Supervisor",
      approvedBy: "Operations Director",
      requestedDate: "2024-01-10T11:15:00Z",
      approvedDate: "2024-01-12T10:30:00Z",
      expectedDelivery: "2024-01-25T00:00:00Z",
      vendor: "FlexLink Systems",
      category: "Conveyor Systems"
    },
    {
      id: "sk-004",
      title: "Motor Bearings Bulk Order",
      description: "Quarterly stock replenishment for motor bearing inventory",
      type: "sparepart",
      status: "pending",
      priority: "low",
      itemName: "Deep Groove Ball Bearings",
      itemCode: "BRG-6205-2RS",
      quantity: 50,
      unitPrice: 25,
      totalCost: 1250,
      requestedBy: "Inventory Specialist",
      requestedDate: "2024-01-13T16:45:00Z",
      expectedDelivery: "2024-02-01T00:00:00Z",
      vendor: "SKF Bearings",
      category: "Bearings"
    },
    {
      id: "sk-005",
      title: "Industrial Robot Arm",
      description: "6-axis robot arm for automated welding operations",
      type: "machine",
      status: "approved",
      priority: "high",
      itemName: "6-Axis Industrial Robot",
      itemCode: "ROBOT-6AX-WLD",
      quantity: 1,
      unitPrice: 45000,
      totalCost: 45000,
      requestedBy: "Automation Engineer",
      approvedBy: "Plant Manager",
      requestedDate: "2024-01-11T08:20:00Z",
      approvedDate: "2024-01-14T15:30:00Z",
      expectedDelivery: "2024-02-28T00:00:00Z",
      vendor: "KUKA Robotics",
      category: "Automation Equipment"
    },
    {
      id: "sk-006",
      title: "Electrical Components Bundle",
      description: "Contactors, relays, and fuses for electrical panel maintenance",
      type: "sparepart",
      status: "rejected",
      priority: "medium",
      itemName: "Electrical Components Kit",
      itemCode: "ELEC-KIT-STD",
      quantity: 3,
      unitPrice: 200,
      totalCost: 600,
      requestedBy: "Electrical Technician",
      requestedDate: "2024-01-09T13:30:00Z",
      vendor: "Schneider Electric",
      category: "Electrical Components"
    },
    {
      id: "sk-007",
      title: "Pneumatic Cylinders",
      description: "Double-acting pneumatic cylinders for assembly line automation",
      type: "sparepart",
      status: "fulfilled",
      priority: "medium",
      itemName: "Pneumatic Cylinder 63mm Bore",
      itemCode: "PNEU-CYL-63",
      quantity: 8,
      unitPrice: 180,
      totalCost: 1440,
      requestedBy: "Assembly Technician",
      approvedBy: "Maintenance Supervisor",
      requestedDate: "2024-01-08T12:00:00Z",
      approvedDate: "2024-01-10T14:15:00Z",
      expectedDelivery: "2024-01-18T00:00:00Z",
      vendor: "Festo Pneumatics",
      category: "Pneumatic Components"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'fulfilled': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'cancelled': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
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

  const filteredRequests = mockStockRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.vendor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'all' || request.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stock Keeper Requests</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage machine and spare part requests from inventory team
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
            placeholder="Search requests by title, item, vendor..."
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Requests ({mockStockRequests.length})</TabsTrigger>
          <TabsTrigger value="machine">
            <Settings className="mr-2 h-4 w-4" />
            Machine Requests ({mockStockRequests.filter(r => r.type === 'machine').length})
          </TabsTrigger>
          <TabsTrigger value="sparepart">
            <Package className="mr-2 h-4 w-4" />
            Spare Part Requests ({mockStockRequests.filter(r => r.type === 'sparepart').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'all' ? 'All Stock Requests' : 
                 activeTab === 'machine' ? 'Machine Requests' : 'Spare Part Requests'}
                <Badge variant="secondary">{filteredRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request Details</TableHead>
                    <TableHead>Item Information</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Quantity & Cost</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2 max-w-xs">
                            {request.description}
                          </div>
                          <div className="flex items-center gap-1">
                            {request.type === 'machine' ? (
                              <Settings className="h-3 w-3 text-blue-400" />
                            ) : (
                              <Package className="h-3 w-3 text-green-400" />
                            )}
                            <span className="text-xs text-muted-foreground capitalize">
                              {request.type}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-sm">{request.itemName}</div>
                          {request.itemCode && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Hash className="h-3 w-3" />
                              {request.itemCode}
                            </div>
                          )}
                          {request.category && (
                            <div className="text-xs text-muted-foreground">{request.category}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">Qty: {request.quantity}</div>
                          {request.unitPrice && (
                            <div className="text-xs text-muted-foreground">
                              Unit: ${request.unitPrice.toLocaleString()}
                            </div>
                          )}
                          {request.totalCost && (
                            <div className="flex items-center gap-1 text-sm font-medium text-green-400">
                              <DollarSign className="h-3 w-3" />
                              {request.totalCost.toLocaleString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {request.requestedBy}
                          </div>
                          {request.approvedBy && (
                            <div className="text-xs text-blue-400">Approved by: {request.approvedBy}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {formatDate(request.requestedDate)}
                          </div>
                          {request.expectedDelivery && (
                            <div className="text-xs text-muted-foreground">
                              Delivery: {formatDate(request.expectedDelivery)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.vendor || <span className="text-muted-foreground">-</span>}
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}