import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, Calendar } from "lucide-react";
import TaskSummaryCard from "@/components/TaskSummaryCard/TaskSummaryCard";
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { ErrorGuideline } from "@/types/error.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { formatTimeStampDate } from "@/lib/utils";

interface OverviewStepProps {
  selectedErrorGuidelines: string[];
  errorGuidelines: { [errorId: string]: ErrorGuideline };
  availableErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  selectedMechanic: GET_MECHANIC_USER | null;
  startDate: Date;
}

const OverviewStep = ({
  selectedErrorGuidelines,
  errorGuidelines,
  availableErrors,
  selectedMechanic,
  startDate,
}: OverviewStepProps) => {
  const getSelectedGuidelines = () => {
    return selectedErrorGuidelines
      .map((guidelineId) => {
        const guideline = Object.values(errorGuidelines).find(
          (g) => g.id === guidelineId
        );
        const error = availableErrors.find(
          (e) => errorGuidelines[e.errorId]?.id === guidelineId
        );
        return { guideline, error };
      })
      .filter((item) => item.guideline && item.error);
  };

  const selectedGuidelines = getSelectedGuidelines();

  const taskSummaryItems = [
    {
      label: "Task Type",
      value: "Repair Task",
    },
    {
      label: "Assigned Mechanic",
      value: selectedMechanic?.fullName || "Not selected",
    },
    {
      label: "Start Date",
      value: formatTimeStampDate(startDate.toISOString(), "datetime"),
    },
    {
      label: "Total Errors",
      value: `${selectedGuidelines.length} error(s)`,
    },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Task Overview</h3>

      <TaskSummaryCard title="Task Information" items={taskSummaryItems} />

      {/* Selected Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selected Error Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedGuidelines.map(({ guideline, error }, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">{error!.errorCode}</Badge>
                  <span className="font-medium">{error!.name}</span>
                </div>
                <Badge
                  variant={
                    error!.severity === "Critical" ? "destructive" : "secondary"
                  }
                >
                  {error!.severity}
                </Badge>
              </div>

              <div className="bg-gray-50 p-3 rounded">
                <div className="font-medium text-sm">{guideline!.title}</div>
                <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {guideline!.estimatedRepairTime}
                  </div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    Priority: {guideline!.priority}
                  </div>
                </div>
              </div>

              {/* Fix Steps Preview */}
              {guideline!.errorFixSteps?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Fix Steps:</div>
                  <div className="text-sm text-gray-600">
                    {guideline!.errorFixSteps.length} step(s) included
                  </div>
                </div>
              )}

              {/* Spare Parts Preview */}
              {guideline!.errorSpareparts?.length > 0 && (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Required Parts:</div>
                  <div className="text-sm text-gray-600">
                    {guideline!.errorSpareparts.length} part(s) required
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewStep;
