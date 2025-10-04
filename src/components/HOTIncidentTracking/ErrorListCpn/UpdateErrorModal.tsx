"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  Plus,
  Trash2,
  Loader2,
  Clock,
  Bug,
  Wrench,
  Package,
  X,
  Search,
  Minus,
  Edit,
} from "lucide-react";
// ✅ Fix: Use correct toast import
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Issue, TechnicalIssue, ErrorIncident } from "@/types/incident.type";
import { SPAREPART_INVENTORY_ITEM } from "@/types/sparePart.type";
import { UpdateErrorPayload } from "@/types/error.type";

interface UpdateErrorModalProps {
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

export default function UpdateErrorModal({
  open,
  onOpenChange,
  error,
  onSuccess,
}: UpdateErrorModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    Name: "",
    Description: "",
    EstimatedRepairTime: "",
    IsCommon: false,
    OccurrenceCount: 0,
    Severity: "Low",
    IsPendingConfirmation: false,
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

  // ✅ FIXED: Close modal handler (same pattern as AddErrorModal)
  const handleModalClose = useCallback((openState: boolean) => {
    if (!openState) {
      // Reset form when closing
      resetForm();
    }
    onOpenChange(openState);
  }, [onOpenChange]);

  // Initialize form data when error changes
  useEffect(() => {
    if (error && open) {
      // Only allow updating errors that are pending confirmation
      if (!error.isPendingConfirmation) {
        toast.error("Chỉ có thể cập nhật các lỗi đang chờ duyệt");
        handleModalClose(false); // ✅ Use handleModalClose instead of onOpenChange
        return;
      }

      // Parse time from EstimatedRepairTime (format: "HH:MM:SS")
      const timeMatch = error.estimatedRepairTime?.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
      if (timeMatch) {
        setTimeHours(timeMatch[1]);
        setTimeMinutes(timeMatch[2]);
      }

      setFormData({
        Name: error.name || "",
        Description: error.description || "",
        EstimatedRepairTime: error.estimatedRepairTime || "",
        IsCommon: error.isCommon || false,
        OccurrenceCount: error.occurrenceCount || 0,
        Severity: error.severity || "Low",
        IsPendingConfirmation: error.isPendingConfirmation,
      });

      // ✅ Fix: Use optional chaining and provide defaults for missing properties
      setSelectedIssues((error as any).issueIds || []);
      setSelectedTechnicalIssues((error as any).technicalSymptomIds || []);
      
      // ✅ Fix: Handle sparepart mappings with proper typing
      if ((error as any).sparepartMappings && Array.isArray((error as any).sparepartMappings)) {
        setSelectedSpareparts((error as any).sparepartMappings.map((mapping: any) => ({
          SparepartId: mapping.sparepartId || mapping.SparepartId,
          QuantityNeeded: mapping.quantityNeeded || mapping.QuantityNeeded || 1,
          sparepartName: mapping.sparepartName,
          sparepartCode: mapping.sparepartCode,
        })));
      } else {
        setSelectedSpareparts([]);
      }

      fetchData();
    } else if (!open) {
      resetForm();
    }
  }, [error, open]); // ✅ FIXED: Remove onOpenChange from dependencies (causes the warning)

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
      Severity: "Low",
      IsPendingConfirmation: false,
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
    if (!issue) {
      return;
    }
    
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const toggleTechnicalIssueSelection = (technicalIssueId: string) => {
    const techIssue = technicalIssues.find(t => t.id === technicalIssueId);
    if (!techIssue) {
      return;
    }
    
    setSelectedTechnicalIssues(prev =>
      prev.includes(technicalIssueId)
        ? prev.filter(id => id !== technicalIssueId)
        : [...prev, technicalIssueId]
    );
  };

  const toggleSparepartSelection = (sparepartId: string) => {
    const sparepart = spareparts.find(sp => sp.id === sparepartId);
    if (!sparepart) {
      return;
    }

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
    if (!error) {
      toast.error("Không tìm thấy thông tin lỗi");
      return;
    }

    try {
      // Validation
      if (!formData.Name.trim()) {
        toast.error("Vui lòng nhập tên lỗi");
        return;
      }
      if (!formData.Description.trim()) {
        toast.error("Vui lòng nhập mô tả lỗi");
        return;
      }
      if (!formData.EstimatedRepairTime) {
        toast.error("Vui lòng nhập thời gian sửa chữa dự kiến");
        return;
      }

      const validIssueIds = selectedIssues.filter(issueId => {
        const exists = issues.some(issue => issue.id === issueId);
        const isValidUUID = issueId && typeof issueId === 'string' && issueId.length > 0;
        return exists && isValidUUID;
      });

      const validTechnicalIssueIds = selectedTechnicalIssues.filter(techId => {
        const exists = technicalIssues.some(tech => tech.id === techId);
        const isValidUUID = techId && typeof techId === 'string' && techId.length > 0;
        return exists && isValidUUID;
      });

      const validSparepartMappings = selectedSpareparts.filter(mapping => {
        const exists = spareparts.some(sp => sp.id === mapping.SparepartId);
        const validQuantity = mapping.QuantityNeeded > 0;
        return exists && validQuantity;
      });

      setLoading(true);

      // Get current user ID (you may need to adjust this based on your auth system)
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const confirmedById = currentUser.id || '';

      // ✅ Fix: Prepare request data using exact UpdateErrorPayload structure
      const requestData: UpdateErrorPayload = {
        Id: error.id,
        Name: formData.Name.trim(),
        Description: formData.Description.trim(),
        EstimatedRepairTime: formData.EstimatedRepairTime,
        IsCommon: formData.IsCommon,
        OccurrenceCount: formData.OccurrenceCount,
        Severity: formData.Severity,
        IsPendingConfirmation: false,
        ConfirmedById: confirmedById,
        ConfirmedDate: new Date().toISOString(),
        IssueIds: validIssueIds,
        TechnicalSymptomIds: validTechnicalIssueIds,
        // ✅ Fix: Match exact structure from UpdateErrorPayload
        SparepartMappings: validSparepartMappings.map(mapping => ({
          SparepartId: mapping.SparepartId,
          QuantityNeeded: mapping.QuantityNeeded,
        })),
      };

      console.log("✅ Updating error with data:", requestData);

      await apiClient.error.updateErrorNew(requestData);

      toast.success(`Cập nhật lỗi "${formData.Name}" thành công!`);

      handleModalClose(false); // ✅ Use handleModalClose instead of onOpenChange
      onSuccess();

    } catch (error: any) {
      console.error("❌ Failed to update error:", error);
      
      let errorMessage = "Không thể cập nhật lỗi. Vui lòng thử lại.";
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.title) {
          errorMessage = errorData.title;
        } else if (errorData.errors) {
          const validationErrors = Object.entries(errorData.errors).map(([field, messages]) => {
            return `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
          });
          errorMessage = validationErrors.join('; ');
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

  // Don't render if error is not pending confirmation
  if (error && !error.isPendingConfirmation) {
    return null;
  }

  if (dataLoading) {
    return (
      <Dialog open={open} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {/* ✅ FIX: Add DialogHeader and DialogTitle for accessibility */}
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
    <Dialog open={open} onOpenChange={handleModalClose}> {/* ✅ Use handleModalClose */
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            Cập nhật lỗi: {error?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Thông tin cơ bản</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tên lỗi *</Label>
                <Input
                  id="name"
                  value={formData.Name}
                  onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))}
                  placeholder="Nhập tên lỗi..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả *</Label>
              <Textarea
                id="description"
                value={formData.Description}
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

              <div className="space-y-2">
                <Label htmlFor="occurrenceCount">Số lần xuất hiện</Label>
                <Input
                  id="occurrenceCount"
                  type="number"
                  value={formData.OccurrenceCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, OccurrenceCount: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 mt-8">
                  <Checkbox
                    id="isCommon"
                    checked={formData.IsCommon}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, IsCommon: !!checked }))}
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
            onClick={() => handleModalClose(false)} // ✅ Use handleModalClose
            disabled={loading}
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !formData.Name || !formData.Description || !formData.EstimatedRepairTime}
            className="flex items-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Cập nhật lỗi
          </Button>
        </DialogFooter>
      </DialogContent>}
    </Dialog>
  );
}