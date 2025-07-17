"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Loader2, FileText, Eye } from "lucide-react";
import { formatAPIDateToHoChiMinh } from "@/lib/utils";
import { WARRANTY_TASK_DETAIL, TASK_IN_GROUP } from "@/types/task.type";
import {
  translateTaskClaimStatus,
  translateTaskStatus,
} from "@/utils/textTypeTask";

interface WarrantyTabProps {
  warrantySubmissionTask: TASK_IN_GROUP | null;
  warrantyTaskDetailForFooter: WARRANTY_TASK_DETAIL | null;
}

const WarrantyTab = ({
  warrantySubmissionTask,
  warrantyTaskDetailForFooter,
}: WarrantyTabProps) => {
  if (!warrantySubmissionTask) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Thông tin Bảo hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-center">
            <div className="flex flex-col items-center max-w-md">
              <Shield className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Không có thông tin bảo hành
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhóm nhiệm vụ này không chứa nhiệm vụ bảo hành nào.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!warrantyTaskDetailForFooter) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Thông tin Bảo hành
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">
              Đang tải thông tin bảo hành...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Thông tin Bảo hành
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top Section - Basic Info + Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Basic Warranty Information */}
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-100 dark:border-blue-800 p-3 h-full flex flex-col justify-center">
              <div className="text-sm font-medium text-blue-800 dark:text-blue-300">
                {warrantyTaskDetailForFooter.warrantyProvider}
              </div>
              <div className="font-bold text-lg text-blue-900 dark:text-blue-100">
                {warrantyTaskDetailForFooter.claimNumber}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-400">
                Mã bảo hành: {warrantyTaskDetailForFooter.warrantyCode}
              </div>
            </div>

            {/* Status & Contract */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">
                Trạng thái & Liên hệ
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Trạng thái:</span>
                  <Badge variant="outline" className="text-xs">
                    {translateTaskClaimStatus(
                      warrantyTaskDetailForFooter.claimStatus
                    )}
                  </Badge>
                </div>

                {warrantyTaskDetailForFooter.hotNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-xs">Hotline:</span>
                    <a
                      href={`tel:${warrantyTaskDetailForFooter.hotNumber}`}
                      className="font-semibold text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {warrantyTaskDetailForFooter.hotNumber}
                    </a>
                  </div>
                )}

                {warrantyTaskDetailForFooter.claimAmount && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Số tiền claim:
                    </span>
                    <span className="text-xs font-medium">
                      {warrantyTaskDetailForFooter.claimAmount.toLocaleString(
                        "vi-VN"
                      )}{" "}
                      <span className="text-xs text-gray-500">VND</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact and Location */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">
                Liên lạc & Vị trí bảo hành
              </div>
              <div className="space-y-2 text-xs">
                {warrantyTaskDetailForFooter.contractNumber && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Số liên lạc:</span>
                    <span className="text-xs font-medium">
                      {warrantyTaskDetailForFooter.contractNumber}
                    </span>
                  </div>
                )}

                {warrantyTaskDetailForFooter.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Vị trí:</span>
                    <span className="font-medium">
                      {warrantyTaskDetailForFooter.location}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nested Tabs for detailed information */}
          <Tabs defaultValue="issue" className="mt-2">
            <TabsList className="w-full grid grid-cols-3 mb-3">
              <TabsTrigger value="issue">Mô tả sự cố</TabsTrigger>
              <TabsTrigger value="resolution">Giải pháp & Ghi chú</TabsTrigger>
              <TabsTrigger value="documents">
                Tài liệu ({warrantyTaskDetailForFooter.documents?.length || 0})
              </TabsTrigger>
            </TabsList>

            {/* Issue Description Tab */}
            <TabsContent value="issue">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                {warrantyTaskDetailForFooter.issueDescription ? (
                  <p className="text-sm">
                    {warrantyTaskDetailForFooter.issueDescription}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Không có mô tả sự cố
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Resolution & Notes Tab */}
            <TabsContent value="resolution">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                  <h4 className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Giải pháp:
                  </h4>
                  {warrantyTaskDetailForFooter.resolution ? (
                    <p className="text-sm">
                      {warrantyTaskDetailForFooter.resolution}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Chưa có giải pháp
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                  <h4 className="text-xs font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ghi chú:
                  </h4>
                  {warrantyTaskDetailForFooter.warrantyNotes ? (
                    <p className="text-sm">
                      {warrantyTaskDetailForFooter.warrantyNotes}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Không có ghi chú
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              {warrantyTaskDetailForFooter.documents &&
              warrantyTaskDetailForFooter.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {warrantyTaskDetailForFooter.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-blue-500 flex-shrink-0" />
                        <div className="truncate">
                          <div className="text-xs font-medium truncate">
                            {doc.docymentType || "Document"}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(doc.documentUrl, "_blank")}
                        disabled={!doc.documentUrl}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  Không có tài liệu đính kèm
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default WarrantyTab;
