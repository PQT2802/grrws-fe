"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Clock,
  Bug,
  Wrench,
  Package,
  X,
  Search,
  Minus,
  Plus,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/api-client";
import { ErrorIncident, Issue, TechnicalIssue } from "@/types/incident.type";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";

interface ApproveErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: ErrorIncident | null;
  onSuccess: () => void;
}

interface SparepartMapping {
  SparepartId: string;
  QuantityNeeded: number;
  sparepartName?: string;
  sparepartCode?: string;
}

export default function ApproveErrorModal({
  open,
  onOpenChange,
  error,
  onSuccess,
}: ApproveErrorModalProps) {
  // ✅ Form state with existing error data
  const [formData, setFormData] = useState({
    Name: "",
    Description: "",
    EstimatedRepairTime: "",
    IsCommon: false,
    OccurrenceCount: 0,
  });

  // Mapping states
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedTechnicalIssues, setSelectedTechnicalIssues] = useState<string[]>([]);
  const [selectedSpareparts, setSelectedSpareparts] = useState<SparepartMapping[]>([]);

  // Data states
  const [issues, setIssues] = useState<Issue[]>([]);
  const [technicalIssues, setTechnicalIssues] = useState<TechnicalIssue[]>([]);
  const [spareparts, setSpareparts] = useState<SPAREPART_INVENTORY_ITEM[]>([]);

  // Search states
  const [issueSearchTerm, setIssueSearchTerm] = useState("");
  const [technicalIssueSearchTerm, setTechnicalIssueSearchTerm] = useState("");
  const [sparepartSearchTerm, setSparepartSearchTerm] = useState("");

  // Filtered data states
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [filteredTechnicalIssues, setFilteredTechnicalIssues] = useState<TechnicalIssue[]>([]);
  const [filteredSpareparts, setFilteredSpareparts] = useState<SPAREPART_INVENTORY_ITEM[]>([]);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  // Time input helper state
  const [timeHours, setTimeHours] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("0");

  // ✅ Initialize form data when error prop changes
  useEffect(() => {
    if (error && open) {
      setFormData({
        Name: error.name || "",
        Description: error.description || "",
        EstimatedRepairTime: error.estimatedRepairTime || "",
        IsCommon: error.isCommon || false,
        OccurrenceCount: error.occurrenceCount || 0,
      });

      // ✅ Parse existing time for display
      if (error.estimatedRepairTime) {
        const timeParts = error.estimatedRepairTime.split(':');
        if (timeParts.length >= 2) {
          setTimeHours(parseInt(timeParts[0]).toString());
          setTimeMinutes(parseInt(timeParts[1]).toString());
        }
      } else {
        setTimeHours("");
        setTimeMinutes("0");
      }
    }
  }, [error, open]);

  // Filter effects
  useEffect(() => {
    if (!issueSearchTerm.trim()) {
      setFilteredIssues(issues);
    } else {
      const filtered = issues.filter(issue =>
        issue.displayName.toLowerCase().includes(issueSearchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(issueSearchTerm.toLowerCase()) ||
        issue.issueKey.toLowerCase().includes(issueSearchTerm.toLowerCase())
      );
      setFilteredIssues(filtered);
    }
  }, [issues, issueSearchTerm]);

  useEffect(() => {
    if (!technicalIssueSearchTerm.trim()) {
      setFilteredTechnicalIssues(technicalIssues);
    } else {
      const filtered = technicalIssues.filter(tech =>
        tech.name.toLowerCase().includes(technicalIssueSearchTerm.toLowerCase()) ||
        tech.description.toLowerCase().includes(technicalIssueSearchTerm.toLowerCase()) ||
        tech.symptomCode.toLowerCase().includes(technicalIssueSearchTerm.toLowerCase())
      );
      setFilteredTechnicalIssues(filtered);
    }
  }, [technicalIssues, technicalIssueSearchTerm]);

  useEffect(() => {
    if (!sparepartSearchTerm.trim()) {
      setFilteredSpareparts(spareparts);
    } else {
      const filtered = spareparts.filter(part =>
        part.sparepartName.toLowerCase().includes(sparepartSearchTerm.toLowerCase()) ||
        part.sparepartCode.toLowerCase().includes(sparepartSearchTerm.toLowerCase()) ||
        (part.description && part.description.toLowerCase().includes(sparepartSearchTerm.toLowerCase()))
      );
      setFilteredSpareparts(filtered);
    }
  }, [spareparts, sparepartSearchTerm]);

  // Fetch data when modal opens
  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      // ✅ FIX: Reset form when modal closes (same as AddErrorModal)
      resetForm();
    }
  }, [open]);

  // Update EstimatedRepairTime when time inputs change
  useEffect(() => {
    if (timeHours) {
      const hours = parseInt(timeHours) || 0;
      const minutes = parseInt(timeMinutes) || 0;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      setFormData(prev => ({ ...prev, EstimatedRepairTime: formattedTime }));
    }
  }, [timeHours, timeMinutes]);

  const fetchData = async () => {
    try {
      setDataLoading(true);

      const [issuesResponse, technicalIssuesResponse, sparepartsResponse] = await Promise.all([
        apiClient.incident.getIssues(1, 1000),
        apiClient.incident.getTechnicalIssues(1, 1000),
        apiClient.sparePart.getInventory(1, 1000),
      ]);

      // Extract data (same logic as AddErrorModal)
      let issuesData: Issue[] = [];
      if (issuesResponse) {
        if (issuesResponse.extensions?.data?.data && Array.isArray(issuesResponse.extensions.data.data)) {
          issuesData = issuesResponse.extensions.data.data;
        } else if ((issuesResponse as any).data?.data && Array.isArray((issuesResponse as any).data.data)) {
          issuesData = (issuesResponse as any).data.data;
        } else if ((issuesResponse as any).data && Array.isArray((issuesResponse as any).data)) {
          issuesData = (issuesResponse as any).data;
        } else if (Array.isArray(issuesResponse)) {
          issuesData = issuesResponse;
        }
      }
      setIssues(issuesData);

      let technicalIssuesData: TechnicalIssue[] = [];
      if (technicalIssuesResponse) {
        if (technicalIssuesResponse.extensions?.data?.data && Array.isArray(technicalIssuesResponse.extensions.data.data)) {
          technicalIssuesData = technicalIssuesResponse.extensions.data.data;
        } else if ((technicalIssuesResponse as any).data?.data && Array.isArray((technicalIssuesResponse as any).data.data)) {
          technicalIssuesData = (technicalIssuesResponse as any).data.data;
        } else if ((technicalIssuesResponse as any).data && Array.isArray((technicalIssuesResponse as any).data)) {
          technicalIssuesData = (technicalIssuesResponse as any).data;
        } else if (Array.isArray(technicalIssuesResponse)) {
          technicalIssuesData = technicalIssuesResponse;
        }
      }
      setTechnicalIssues(technicalIssuesData);

      let sparepartsData: SPAREPART_INVENTORY_ITEM[] = [];
      if (sparepartsResponse) {
        if (Array.isArray(sparepartsResponse)) {
          sparepartsData = sparepartsResponse;
        } else if ((sparepartsResponse as any).data?.data && Array.isArray((sparepartsResponse as any).data.data)) {
          sparepartsData = (sparepartsResponse as any).data.data;
        } else if ((sparepartsResponse as any).data && Array.isArray((sparepartsResponse as any).data)) {
          sparepartsData = (sparepartsResponse as any).data;
        } else if ((sparepartsResponse as any).extensions?.data?.data && Array.isArray((sparepartsResponse as any).extensions.data.data)) {
          sparepartsData = (sparepartsResponse as any).extensions.data.data;
        }
      }
      setSpareparts(sparepartsData);

    } catch (error) {
      console.error("❌ Failed to fetch data:", error);
      toast.error("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setDataLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      Name: "",
      Description: "",
      EstimatedRepairTime: "",
      IsCommon: false,
      OccurrenceCount: 0,
    });
    setSelectedIssues([]);
    setSelectedTechnicalIssues([]);
    setSelectedSpareparts([]);
    setTimeHours("");
    setTimeMinutes("0");
    setIssueSearchTerm("");
    setTechnicalIssueSearchTerm("");
    setSparepartSearchTerm("");
  };

  const toggleIssueSelection = (issueId: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue) return;
    
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const toggleTechnicalIssueSelection = (technicalIssueId: string) => {
    const techIssue = technicalIssues.find(t => t.id === technicalIssueId);
    if (!techIssue) return;
    
    setSelectedTechnicalIssues(prev =>
      prev.includes(technicalIssueId)
        ? prev.filter(id => id !== technicalIssueId)
        : [...prev, technicalIssueId]
    );
  };

  const toggleSparepartSelection = (sparepartId: string) => {
    const sparepart = spareparts.find(sp => sp.id === sparepartId);
    if (!sparepart) return;

    setSelectedSpareparts(prev => {
      const existingIndex = prev.findIndex(sp => sp.SparepartId === sparepartId);
      
      if (existingIndex >= 0) {
        return prev.filter(sp => sp.SparepartId !== sparepartId);
      } else {
        return [...prev, {
          SparepartId: sparepartId,
          QuantityNeeded: 1,
          sparepartName: sparepart.sparepartName,
          sparepartCode: sparepart.sparepartCode,
        }];
      }
    });
  };

  const updateSparepartQuantity = (sparepartId: string, quantity: number) => {
    if (quantity < 1) return;
    
    setSelectedSpareparts(prev =>
      prev.map(sp =>
        sp.SparepartId === sparepartId
          ? { ...sp, QuantityNeeded: quantity }
          : sp
      )
    );
  };

  const handleSubmit = async () => {
    try {
      if (!error) {
        toast.error("Không tìm thấy thông tin lỗi");
        return;
      }

      // ✅ Enhanced validation
      if (!formData.Name?.trim()) {
        toast.error("Vui lòng nhập tên lỗi");
        return;
      }
      if (!formData.Description?.trim()) {
        toast.error("Vui lòng nhập mô tả lỗi");
        return;
      }
      if (!formData.EstimatedRepairTime) {
        toast.error("Vui lòng nhập thời gian sửa chữa dự kiến");
        return;
      }

      // ✅ More robust validation
      const validIssueIds = selectedIssues.filter(issueId => {
        const exists = issues.some(issue => issue.id === issueId);
        const isValidUUID = issueId && typeof issueId === 'string' && issueId.length > 0;
        console.log(`Issue ${issueId}: exists=${exists}, valid=${isValidUUID}`);
        return exists && isValidUUID;
      });

      const validTechnicalIssueIds = selectedTechnicalIssues.filter(techId => {
        const exists = technicalIssues.some(tech => tech.id === techId);
        const isValidUUID = techId && typeof techId === 'string' && techId.length > 0;
        console.log(`Tech issue ${techId}: exists=${exists}, valid=${isValidUUID}`);
        return exists && isValidUUID;
      });

      const validSparepartMappings = selectedSpareparts.filter(mapping => {
        const exists = spareparts.some(sp => sp.id === mapping.SparepartId);
        const validQuantity = mapping.QuantityNeeded > 0;
        console.log(`Sparepart ${mapping.SparepartId}: exists=${exists}, validQty=${validQuantity}`);
        return exists && validQuantity;
      });

      // ✅ Validate time format more strictly
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
      if (!timeRegex.test(formData.EstimatedRepairTime)) {
        toast.error("Định dạng thời gian không hợp lệ (HH:mm:ss)");
        return;
      }

      // ✅ Validate occurrence count
      const occurrenceCount = Number(formData.OccurrenceCount);
      if (isNaN(occurrenceCount) || occurrenceCount < 0) {
        toast.error("Số lần xuất hiện phải là số không âm");
        return;
      }

      setLoading(true);

      // ✅ SIMPLIFIED request data - Remove potentially problematic fields
      const requestData = {
        Name: String(formData.Name).trim(),
        Description: String(formData.Description).trim(),
        EstimatedRepairTime: String(formData.EstimatedRepairTime),
        IsCommon: Boolean(formData.IsCommon),
        OccurrenceCount: Number(formData.OccurrenceCount),
        Severity: "Low",
        IsPendingConfirmation: false,
        IssueIds: validIssueIds,
        TechnicalSymptomIds: validTechnicalIssueIds,
        SparepartMappings: validSparepartMappings.map(mapping => ({
          SparepartId: String(mapping.SparepartId),
          QuantityNeeded: Number(mapping.QuantityNeeded),
        })),
      };

      console.log("🚀 APPROVE ERROR - Final request payload:");
      console.log(JSON.stringify(requestData, null, 2));
      console.log("🎯 API Endpoint: /api/Error/create");
      console.log("🔍 Original error info:", {
        id: error.id,
        errorCode: error.errorCode,
        name: error.name
      });

      // ✅ FIX: Call API with better error handling
      let response;
      try {
        response = await apiClient.error.createError(requestData);
        console.log("✅ API call successful, response:", response);
      } catch (apiError: any) {
        console.error("❌ API call failed:", apiError);
        
        // ✅ Check if it's a network error vs API error
        if (!apiError.response) {
          throw new Error(`Network error: ${apiError.message || 'Unknown network error'}`);
        }
        
        // ✅ Check if response has data
        if (apiError.response.data) {
          console.error("❌ API error response data:", apiError.response.data);
          throw apiError; // Re-throw with API error details
        }
        
        // ✅ Unknown API error
        throw new Error(`API error: Status ${apiError.response.status} - ${apiError.response.statusText || 'Unknown error'}`);
      }

      toast.success(`Đã duyệt lỗi "${formData.Name}" thành công!`);

      onOpenChange(false);
      onSuccess();

    } catch (error: any) {
      console.error("❌ APPROVE ERROR - Complete error details:");
      console.error("- Error object:", error);
      console.error("- Error message:", error.message);
      console.error("- Error stack:", error.stack);
      
      if (error.response) {
        console.error("- Response status:", error.response.status);
        console.error("- Response statusText:", error.response.statusText);
        console.error("- Response data:", error.response.data);
        console.error("- Response headers:", error.response.headers);
      } else {
        console.error("- No response object available");
      }
      
      let errorMessage = "Không thể duyệt lỗi. Vui lòng thử lại.";
      
      if (error.response?.status === 400) {
        console.error("❌ 400 Bad Request Details:", {
          data: error.response.data,
          status: error.response.status,
          statusText: error.response.statusText
        });
        
        if (error.response.data) {
          const errorData = error.response.data;
          
          if (typeof errorData === 'string') {
            errorMessage = `Lỗi 400: ${errorData}`;
          } else if (errorData.message) {
            errorMessage = `Lỗi 400: ${errorData.message}`;
          } else if (errorData.title) {
            errorMessage = `Lỗi 400: ${errorData.title}`;
          } else if (errorData.errors) {
            const validationErrors = Object.entries(errorData.errors).map(([field, messages]) => {
              return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            });
            errorMessage = `Lỗi validation: ${validationErrors.join('; ')}`;
          } else if (errorData.detail) {
            errorMessage = `Lỗi 400: ${errorData.detail}`;
          } else {
            errorMessage = `Lỗi 400: ${JSON.stringify(errorData)}`;
          }
        } else {
          errorMessage = `Lỗi 400: ${error.response.statusText || 'Bad Request'}`;
        }
      } else if (error.message.includes('Network error')) {
        errorMessage = `Lỗi kết nối: ${error.message}`;
      } else if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.title) {
          errorMessage = errorData.title;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đang tải dữ liệu</DialogTitle> 
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Duyệt lỗi: {error?.errorCode}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Hoàn thiện thông tin và mapping để duyệt lỗi này
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* ✅ Show existing error info */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Thông tin lỗi hiện tại:</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Mã lỗi:</span> {error?.errorCode}
              </div>
              <div>
                <span className="font-medium">Trạng thái:</span> 
                <Badge className="ml-2 bg-yellow-500/10 text-yellow-600">Chờ duyệt</Badge>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên lỗi *</Label>
                <Input
                  id="name"
                  value={formData.Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))
                  }
                  placeholder="Nhập tên lỗi..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={formData.Description || ""} 
                onChange={(e) => setFormData(prev => ({ ...prev, Description: e.target.value }))}
                placeholder="Nhập mô tả chi tiết về lỗi..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Thời gian sửa chữa dự kiến *</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      value={timeHours}
                      onChange={(e) => setTimeHours(e.target.value)}
                      placeholder="Giờ"
                      min="0"
                      max="23"
                    />
                  </div>
                  <span className="text-muted-foreground">:</span>
                  <div className="flex-1">
                    <Select
                      value={timeMinutes}
                      onValueChange={setTimeMinutes}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">00</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="30">30</SelectItem>
                        <SelectItem value="45">45</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                {formData.EstimatedRepairTime && (
                  <p className="text-xs text-muted-foreground">
                    Thời gian: {formData.EstimatedRepairTime}
                  </p>
                )}
              </div>

              <div className="space-y-2 ml-4">
                <Label htmlFor="occurrenceCount">Số lần xuất hiện</Label>
                <Input
                  id="occurrenceCount"
                  type="number"
                  value={formData.OccurrenceCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, OccurrenceCount: parseInt(e.target.value) || 0 }))
                  }
                  min="0"
                />
              </div>

              <div className="space-y-2 ml-4">
                <div className="flex items-center space-x-2 mt-10">
                  <Checkbox
                    id="isCommon"
                    checked={formData.IsCommon}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, IsCommon: !!checked }))
                    }
                  />
                  <Label htmlFor="isCommon">Lỗi phổ biến</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Issues Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bug className="h-5 w-5 text-blue-500" />
              Triệu chứng ({selectedIssues.length} đã chọn)
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm triệu chứng theo tên, mô tả hoặc mã..."
                value={issueSearchTerm}
                onChange={(e) => setIssueSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {issues.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Không tìm thấy triệu chứng nào.
              </div>
            )}
            
            {filteredIssues.length === 0 && issues.length > 0 && issueSearchTerm && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                Không tìm thấy triệu chứng nào phù hợp với từ khóa `{issueSearchTerm}`.
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {filteredIssues.map((issue) => {
                const issueId = issue.id;
                
                return (
                  <div
                    key={issueId}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedIssues.includes(issueId)
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleIssueSelection(issueId)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedIssues.includes(issueId)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{issue.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedIssues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedIssues.map((issueId) => {
                  const issue = issues.find(i => i.id === issueId);
                  return (
                    <Badge key={issueId} variant="secondary" className="flex items-center gap-1">
                      {issue?.displayName}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleIssueSelection(issueId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Technical Issues Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Triệu chứng kỹ thuật ({selectedTechnicalIssues.length} đã chọn)
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm triệu chứng kỹ thuật theo tên, mô tả hoặc mã..."
                value={technicalIssueSearchTerm}
                onChange={(e) => setTechnicalIssueSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {technicalIssues.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Không tìm thấy triệu chứng kỹ thuật nào.
              </div>
            )}
            
            {filteredTechnicalIssues.length === 0 && technicalIssues.length > 0 && technicalIssueSearchTerm && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                Không tìm thấy triệu chứng kỹ thuật nào phù hợp với từ khóa `{technicalIssueSearchTerm}`.
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {filteredTechnicalIssues.map((issue) => {
                const technicalIssueId = issue.id;
                
                return (
                  <div
                    key={technicalIssueId}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      selectedTechnicalIssues.includes(technicalIssueId)
                        ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleTechnicalIssueSelection(technicalIssueId)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={selectedTechnicalIssues.includes(technicalIssueId)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{issue.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedTechnicalIssues.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTechnicalIssues.map((technicalIssueId) => {
                  const issue = technicalIssues.find(i => i.id === technicalIssueId);
                  return (
                    <Badge key={technicalIssueId} variant="secondary" className="flex items-center gap-1">
                      {issue?.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => toggleTechnicalIssueSelection(technicalIssueId)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Spareparts Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              Linh kiện cần thiết ({selectedSpareparts.length} đã chọn)
            </h3>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm linh kiện theo tên, mã hoặc mô tả..."
                value={sparepartSearchTerm}
                onChange={(e) => setSparepartSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {spareparts.length === 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                Không tìm thấy linh kiện nào.
              </div>
            )}
            
            {filteredSpareparts.length === 0 && spareparts.length > 0 && sparepartSearchTerm && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                Không tìm thấy linh kiện nào phù hợp với từ khóa `{sparepartSearchTerm}`.
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {filteredSpareparts.map((sparepart) => {
                const sparepartId = sparepart.id;
                const isSelected = selectedSpareparts.some(sp => sp.SparepartId === sparepartId);
                
                return (
                  <div
                    key={sparepartId}
                    className={`p-2 rounded cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-100 dark:bg-green-900/30 border-green-300'
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleSparepartSelection(sparepartId)}
                  >
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={isSelected}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{sparepart.sparepartName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {sparepart.sparepartCode} - Còn: {sparepart.stockQuantity}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedSpareparts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Linh kiện đã chọn:</h4>
                <div className="space-y-2">
                  {selectedSpareparts.map((mapping) => {
                    const sparepart = spareparts.find(sp => sp.id === mapping.SparepartId);
                    return (
                      <div key={mapping.SparepartId} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {mapping.sparepartName}
                              <X
                                className="h-3 w-3 cursor-pointer"
                                onClick={() => toggleSparepartSelection(mapping.SparepartId)}
                              />
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {mapping.sparepartCode} - Còn: {sparepart?.stockQuantity || 0}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSparepartQuantity(mapping.SparepartId, mapping.QuantityNeeded - 1)}
                            disabled={mapping.QuantityNeeded <= 1}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          
                          <Input
                            type="number"
                            value={mapping.QuantityNeeded}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              updateSparepartQuantity(mapping.SparepartId, Math.max(1, newQuantity));
                            }}
                            className="w-16 text-center"
                            min="1"
                          />
                          
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSparepartQuantity(mapping.SparepartId, mapping.QuantityNeeded + 1)}
                            disabled={mapping.QuantityNeeded >= (sparepart?.stockQuantity || 0)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)} // ✅ FIX: Consistent close behavior
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !formData.Name || !formData.Description || !formData.EstimatedRepairTime}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Shield className="h-4 w-4" />
            Duyệt lỗi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}