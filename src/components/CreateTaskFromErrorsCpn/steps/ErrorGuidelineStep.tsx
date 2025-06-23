import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, Clock, Wrench, Package } from "lucide-react";
import { SkeletonCard } from "@/components/SkeletonCard/SkeletonCard";
import ButtonCpn from "@/components/ButtonCpn/ButtonCpn";
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { ErrorGuideline } from "@/types/error.type";

interface ErrorGuidelineStepProps {
  availableErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  errorGuidelines: { [errorId: string]: ErrorGuideline };
  selectedErrorGuidelines: string[];
  onSelectionChange: (guidelines: string[]) => void;
  loading: boolean;
  hasUninstallTask: boolean;
}

const ErrorGuidelineStep = ({
  availableErrors,
  errorGuidelines,
  selectedErrorGuidelines,
  onSelectionChange,
  loading,
  hasUninstallTask,
}: ErrorGuidelineStepProps) => {
  const handleErrorGuidelineSelection = (
    guidelineId: string,
    checked: boolean
  ) => {
    if (checked) {
      onSelectionChange([...selectedErrorGuidelines, guidelineId]);
    } else {
      onSelectionChange(
        selectedErrorGuidelines.filter((id) => id !== guidelineId)
      );
    }
  };

  const totalEstimatedTime = useMemo(() => {
    let totalMinutes = 0;
    selectedErrorGuidelines.forEach((guidelineId) => {
      const guideline = Object.values(errorGuidelines).find(
        (g) => g.id === guidelineId
      );
      if (guideline?.estimatedRepairTime) {
        const timeMatch =
          guideline.estimatedRepairTime.match(/(\d+):(\d+):(\d+)/);
        if (timeMatch) {
          const hours = parseInt(timeMatch[1] || "0");
          const minutes = parseInt(timeMatch[2] || "0");
          totalMinutes += hours * 60 + minutes;
        }
      }
    });
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }, [selectedErrorGuidelines, errorGuidelines]);

  return (
    <div className="space-y-6">
      {/* Uninstall Task Warning */}
      {!hasUninstallTask && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="flex-1">
                <h3 className="font-medium text-orange-800">
                  Uninstall Task Required
                </h3>
                <p className="text-sm text-orange-700 mt-1">
                  You should create an uninstall task before creating repair
                  tasks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Errors & Guidelines</h3>
        <ButtonCpn
          type="button"
          title="Add New Error"
          icon={<Package />}
          onClick={() => {
            /* TODO: Implement */
          }}
        />
      </div>

      {/* Error Guidelines */}
      {loading ? (
        <SkeletonCard />
      ) : (
        <div className="space-y-4">
          {availableErrors.map((error) => {
            const guideline = errorGuidelines[error.errorId];
            return (
              <Card key={error.errorId} className="border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive">{error.errorCode}</Badge>
                      <span className="font-medium">{error.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          error.severity === "Critical"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {error.severity}
                      </Badge>
                      <Badge variant="outline">{error.status}</Badge>
                    </div>
                  </div>
                </CardHeader>

                {guideline && (
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {/* Guideline Selection */}
                      <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                        <Checkbox
                          checked={selectedErrorGuidelines.includes(
                            guideline.id
                          )}
                          onCheckedChange={(checked) =>
                            handleErrorGuidelineSelection(
                              guideline.id,
                              !!checked
                            )
                          }
                        />
                        <div className="flex-1">
                          <div className="font-medium">{guideline.title}</div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              Est. Time: {guideline.estimatedRepairTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4" />
                              Priority: {guideline.priority}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Fix Steps */}
                      {guideline.errorFixSteps?.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Wrench className="h-4 w-4" />
                            Fix Steps ({guideline.errorFixSteps.length})
                          </div>
                          <div className="space-y-2 ml-6">
                            {guideline.errorFixSteps
                              .sort((a, b) => a.stepOrder - b.stepOrder)
                              .map((step) => (
                                <div
                                  key={step.id}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
                                    {step.stepOrder}
                                  </span>
                                  <span className="text-gray-700">
                                    {step.stepDescription}
                                  </span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Required Spare Parts */}
                      {guideline.errorSpareparts?.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Package className="h-4 w-4" />
                            Required Spare Parts (
                            {guideline.errorSpareparts.length})
                          </div>
                          <div className="grid gap-2 ml-6">
                            {guideline.errorSpareparts.map((sparepart) => (
                              <div
                                key={sparepart.sparepartId}
                                className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded"
                              >
                                <span>Part ID: {sparepart.sparepartId}</span>
                                <span className="font-medium">
                                  Qty: {sparepart.quantityNeeded}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Selection Summary */}
      {selectedErrorGuidelines.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-800">
                {selectedErrorGuidelines.length} guideline(s) selected
              </span>
              <span className="text-blue-600">
                Total Est. Time: {totalEstimatedTime}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ErrorGuidelineStep;
