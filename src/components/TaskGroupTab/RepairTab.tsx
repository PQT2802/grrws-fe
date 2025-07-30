"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wrench, Loader2, Package } from "lucide-react";
import { REPAIR_TASK_DETAIL, TASK_IN_GROUP } from "@/types/task.type";

interface RepairTabProps {
  repairTask: TASK_IN_GROUP | null;
  repairTaskDetail: REPAIR_TASK_DETAIL | null;
}

const RepairTab = ({ repairTask, repairTaskDetail }: RepairTabProps) => {
  if (!repairTask) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-center">
            <div className="flex flex-col items-center max-w-md">
              <Wrench className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                Không có thông tin sửa chữa
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Nhóm nhiệm vụ này không chứa nhiệm vụ sửa chữa nào.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  // At the beginning of your component
  console.log("repairTaskDetail:", repairTaskDetail);
  console.log("errorDetails:", repairTaskDetail?.errorDetails);
  console.log(
    "spareParts example:",
    repairTaskDetail?.errorDetails?.[0]?.spareParts
  );
  if (!repairTaskDetail) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-orange-600" />
            Thông tin Sửa chữa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500 mr-2" />
            <span className="text-sm text-gray-600">
              Đang tải thông tin sửa chữa...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Define colors for timelines and spare parts borders based on error index
  const groupColors = [
    "border-green-500 bg-green-50 dark:bg-green-950/30",
    "border-blue-500 bg-blue-50 dark:bg-blue-950/30",
  ];
  const iconColors = ["text-green-500", "text-blue-500"];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-orange-600" />
          Thông tin Sửa chữa
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top Section - Basic Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-100 dark:border-orange-800 p-3">
              <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                {repairTaskDetail.taskName}
              </div>
              <div className="font-bold text-lg text-orange-900 dark:text-orange-100">
                Nhiệm vụ sửa chữa
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-400">
                ID: {repairTaskDetail.taskId}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">Trạng thái</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Đã ký xác nhận:</span>
                  <Badge
                    variant={
                      repairTaskDetail.isSigned ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {repairTaskDetail.isSigned ? "Đã ký" : "Chưa ký"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Đã lắp đặt:</span>
                  <Badge
                    variant={
                      repairTaskDetail.isInstall ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {repairTaskDetail.isInstall ? "Đã lắp" : "Chưa lắp"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
              <div className="text-sm font-medium mb-1">Tổng quan</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Số lỗi:</span>
                  <span className="font-medium">
                    {repairTaskDetail.errorDetails?.length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Linh kiện:</span>
                  <span className="font-medium">
                    {repairTaskDetail.errorDetails?.reduce(
                      (acc, error) => acc + (error.spareParts?.length || 0),
                      0
                    ) || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nested Tabs for detailed information */}
          <Tabs defaultValue="errors" className="mt-2">
            <TabsList className="w-full grid grid-cols-2 mb-3">
              <TabsTrigger value="errors">
                Sự cố ({repairTaskDetail.errorDetails?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="spareparts">Linh kiện</TabsTrigger>
            </TabsList>

            {/* Errors Tab */}
            <TabsContent value="errors">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                {repairTaskDetail.errorDetails &&
                repairTaskDetail.errorDetails.length > 0 ? (
                  <div className="space-y-3">
                    {repairTaskDetail.errorDetails.map((error, index) => (
                      <div
                        key={error.errorId}
                        className="border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {error.errorName}
                            </h4>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Không có thông tin lỗi
                  </p>
                )}
              </div>
            </TabsContent>

            {/* Spare Parts Tab */}
            <TabsContent value="spareparts">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700 p-3 max-h-[200px] overflow-auto">
                {repairTaskDetail.errorDetails?.some(
                  (error) => error.spareParts && error.spareParts.length > 0
                ) ? (
                  <div className="flex flex-col gap-4">
                    {repairTaskDetail.errorDetails.map((error, errorIndex) => {
                      if (!error.spareParts || error.spareParts.length === 0) {
                        return null;
                      }

                      return (
                        <div key={error.errorId} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {error.errorName}
                          </h4>
                          <div
                            className={`border-l-4 ${
                              groupColors[errorIndex % groupColors.length]
                            } rounded-md p-3`}
                          >
                            {error.spareParts.map((sparePart) => (
                              <div
                                key={sparePart.sparepartId}
                                className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                              >
                                <div className="flex items-center gap-2">
                                  <Package
                                    className={`h-4 w-4 ${
                                      iconColors[errorIndex % iconColors.length]
                                    }`}
                                  />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {sparePart.sparepartName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Số lượng: {sparePart.quantityNeeded}
                                    </div>
                                  </div>
                                </div>
                                {/* Remove stock quantity badge as it's not in the interface */}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Không có thông tin linh kiện cho các lỗi này
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepairTab;
