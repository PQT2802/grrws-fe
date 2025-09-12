"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ButtonCpn from "../ButtonCpn/ButtonCpn";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import {
  AlertTriangle,
  Search,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { ErrorIncident } from "@/types/incident.type";
import { SUGGEST_OBJECT_REQUEST } from "@/types/comon.type";
import { apiClient } from "@/lib/api-client";

interface ErrorSelectionCpnProps {
  deviceId: string;
  selectedErrors: ErrorIncident[];
  onErrorsChange: (errors: ErrorIncident[]) => void;
}

const ErrorSelectionCpn = ({
  deviceId,
  selectedErrors,
  onErrorsChange,
}: ErrorSelectionCpnProps) => {
  const [suggestedErrors, setSuggestedErrors] = useState<ErrorIncident[]>([]);
  const [searchResults, setSearchResults] = useState<ErrorIncident[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Fetch suggested errors based on device
  const fetchSuggestedErrors = async () => {
    try {
      setLoading(true);
      const errors = await apiClient.error.getErrorsByDeviceId(deviceId);
      setSuggestedErrors(errors);
      
      // Auto-select suggested errors
      const newSelectedErrors = [...selectedErrors];
      errors.forEach(error => {
        if (!newSelectedErrors.find(e => e.id === error.id)) {
          newSelectedErrors.push(error);
        }
      });
      onErrorsChange(newSelectedErrors);
    } catch (error) {
      console.error("Failed to fetch suggested errors:", error);
      toast.error("Không thể tải lỗi gợi ý");
    } finally {
      setLoading(false);
    }
  };

  // Search for additional errors
  const searchErrors = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const request: SUGGEST_OBJECT_REQUEST = {
        query: query.trim(),
        maxResults: 10,
      };
      
      const results = await apiClient.error.getSuggestedErrors(request);
      
      // Convert the response to ErrorIncident format if needed
      const formattedResults: ErrorIncident[] = results.map(result => ({
        id: result.id,
        errorCode: '',
        name: result.name,
        description: '',
        estimatedRepairTime: '00:00:00', // Default value
        isCommon: false,
        occurrenceCount: 0,
        severity: 'Medium', // Default value
      }));
      
      setSearchResults(formattedResults);
    } catch (error) {
      console.error("Failed to search errors:", error);
      toast.error("Không thể tìm kiếm lỗi");
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchSuggestedErrors();
    }
  }, [deviceId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchErrors(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isErrorSelected = (error: ErrorIncident) => {
    return selectedErrors.some(e => e.id === error.id);
  };

  const toggleError = (error: ErrorIncident) => {
    const isSelected = isErrorSelected(error);
    let newSelectedErrors: ErrorIncident[];

    if (isSelected) {
      newSelectedErrors = selectedErrors.filter(e => e.id !== error.id);
    } else {
      newSelectedErrors = [...selectedErrors, error];
    }

    onErrorsChange(newSelectedErrors);
  };

  const removeError = (errorId: string) => {
    const newSelectedErrors = selectedErrors.filter(e => e.id !== errorId);
    onErrorsChange(newSelectedErrors);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'high':
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Selected Errors Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Lỗi đã chọn ({selectedErrors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedErrors.length === 0 ? (
            <p className="text-gray-500 text-sm">Chưa chọn lỗi nào</p>
          ) : (
            <div className="space-y-2">
              {selectedErrors.map((error) => (
                <div
                  key={error.id}
                  className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getSeverityColor(error.severity)}>
                        {error.severity}
                      </Badge>
                      <span className="font-medium">{error.errorCode}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{error.name}</p>
                  </div>
                  <ButtonCpn
                    type="button"
                    title="Xóa lỗi"
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => removeError(error.id)}

                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suggested Errors */}
      {loading ? (
        <SkeletonCard />
      ) : (
        suggestedErrors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Lỗi gợi ý cho thiết bị
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  Các lỗi này được gợi ý dựa trên lịch sử thiết bị. Bạn có thể bỏ chọn hoặc thêm lỗi khác.
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Chọn</TableHead>
                    <TableHead>Mã lỗi</TableHead>
                    <TableHead>Tên lỗi</TableHead>
                    <TableHead>Mức độ</TableHead>
                    <TableHead>Thời gian sửa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {suggestedErrors.map((error) => (
                    <TableRow
                      key={error.id}
                      className={`cursor-pointer hover:bg-gray-50 ${
                        isErrorSelected(error) ? "bg-blue-50" : ""
                      }`}
                      onClick={() => toggleError(error)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isErrorSelected(error)}
                          onCheckedChange={() => toggleError(error)}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{error.errorCode}</Badge>
                      </TableCell>
                      <TableCell>{error.name}</TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {error.estimatedRepairTime}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )
      )}

      {/* Search Additional Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-blue-600" />
            Tìm kiếm thêm lỗi
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="errorSearch">Tìm kiếm theo tên hoặc mã lỗi</Label>
            <Input
              id="errorSearch"
              type="text"
              placeholder="Nhập tên hoặc mã lỗi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-1"
            />
          </div>

          {searching && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Đang tìm kiếm...
            </div>
          )}

          {searchResults.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Thêm</TableHead>
                  <TableHead>Mã lỗi</TableHead>
                  <TableHead>Tên lỗi</TableHead>
                  <TableHead>Mô tả</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((error) => (
                  <TableRow
                    key={error.id}
                    className={`cursor-pointer hover:bg-gray-50 ${
                      isErrorSelected(error) ? "bg-blue-50" : ""
                    }`}
                    onClick={() => toggleError(error)}
                  >
                    <TableCell>
                      {isErrorSelected(error) ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Plus className="h-4 w-4 text-blue-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{error.errorCode}</Badge>
                    </TableCell>
                    <TableCell>{error.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {error.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {searchQuery && !searching && searchResults.length === 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <XCircle className="h-4 w-4" />
              Không tìm thấy lỗi nào phù hợp
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorSelectionCpn;