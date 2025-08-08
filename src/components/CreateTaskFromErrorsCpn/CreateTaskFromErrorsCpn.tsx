"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "../providers/AuthProvider";
import { ERROR_FOR_REQUEST_DETAIL_WEB } from "@/types/request.type";
import { CREATE_REPAIR_TASK } from "@/types/task.type";
import { ErrorGuideline } from "@/types/error.type";
import { GET_MECHANIC_USER } from "@/types/user.type";
import { apiClient } from "@/lib/api-client";
import userService from "@/app/service/user.service";
import errorService from "@/app/service/error.service";

// Import new components
import StepIndicator from "@/components/StepIndicator/StepIndicator";
import MechanicSelector from "@/components/MechanicSelector/MechanicSelector";
import DialogNavigation from "@/components/DialogNavigation/DialogNavigation";
import ErrorGuidelineStep from "./steps/ErrorGuidelineStep";
import OverviewStep from "./steps/OverviewStep";

interface CreateTaskFromErrorsCpnProps {
  children?: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  requestId: string;
  selectedErrors: ERROR_FOR_REQUEST_DETAIL_WEB[];
  onTaskCreated?: () => void;
  hasUninstallTask?: boolean;
}

type Step = "errors" | "mechanic" | "overview";

const STEPS = ["Errors & Guidelines", "Select Mechanic", "Overview"];

const CreateTaskFromErrorsCpn = ({
  children,
  open,
  setOpen,
  requestId,
  selectedErrors,
  onTaskCreated,
  hasUninstallTask = true,
}: CreateTaskFromErrorsCpnProps) => {
  const { user: authUser } = useAuth();

  // Filter out errors with "Assigned" status
  const availableErrors = useMemo(() => {
    return selectedErrors.filter((error) => error.status !== "Assigned");
  }, [selectedErrors]);

  // State
  const [currentStep, setCurrentStep] = useState<Step>("errors");
  const [canProceed, setCanProceed] = useState(false);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate] = useState<Date>(new Date());
  const [selectedErrorGuidelines, setSelectedErrorGuidelines] = useState<
    string[]
  >([]);
  const [errorGuidelines, setErrorGuidelines] = useState<{
    [errorId: string]: ErrorGuideline;
  }>({});
  const [mechanics, setMechanics] = useState<GET_MECHANIC_USER[]>([]);
  const [selectedMechanic, setSelectedMechanic] =
    useState<GET_MECHANIC_USER | null>(null);
  const [loadingGuidelines, setLoadingGuidelines] = useState<boolean>(false);
  const [loadingMechanics, setLoadingMechanics] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  // Fetch functions
  const fetchErrorGuidelines = useCallback(async () => {
    if (availableErrors.length === 0) return;

    try {
      setLoadingGuidelines(true);
      const guidelines: { [errorId: string]: ErrorGuideline } = {};

      await Promise.all(
        availableErrors.map(async (error) => {
          try {
            const errorGuideline = await errorService.getErrorGuidelines(
              error.errorId
            );
            if (errorGuideline && errorGuideline.length > 0) {
              guidelines[error.errorId] = errorGuideline[0];
            }
          } catch (err) {
            console.error(
              `Failed to fetch guideline for error ${error.errorId}:`,
              err
            );
          }
        })
      );

      setErrorGuidelines(guidelines);
    } catch (error) {
      console.error("Failed to fetch error guidelines:", error);
      toast.error("Failed to fetch error guidelines");
    } finally {
      setLoadingGuidelines(false);
    }
  }, [availableErrors]);

  const fetchMechanics = useCallback(async () => {
    try {
      setLoadingMechanics(true);
      const mechanicsData = await userService.getUsersByRole(3);
      setMechanics(mechanicsData);
    } catch (error) {
      console.error("Failed to fetch mechanics:", error);
      toast.error("Failed to fetch mechanics");
    } finally {
      setLoadingMechanics(false);
    }
  }, []);

  // Effects
  useEffect(() => {
    if (open) {
      fetchErrorGuidelines();
      fetchMechanics();
      setCurrentStep("errors");
      setAssigneeId("");
      setSelectedMechanic(null);
      setSelectedErrorGuidelines([]);
      setCanProceed(false);
    }
  }, [open, fetchErrorGuidelines, fetchMechanics]);

  useEffect(() => {
    switch (currentStep) {
      case "errors":
        setCanProceed(selectedErrorGuidelines.length > 0);
        break;
      case "mechanic":
        setCanProceed(!!selectedMechanic);
        break;
      case "overview":
        setCanProceed(true);
        break;
    }
  }, [currentStep, selectedErrorGuidelines, selectedMechanic]);

  // Handlers
  const handleMechanicSelection = (mechanic: GET_MECHANIC_USER) => {
    setSelectedMechanic(mechanic);
    setAssigneeId(mechanic.id);
  };

  const handleSubmit = async () => {
    if (!selectedMechanic || selectedErrorGuidelines.length === 0) {
      toast.error("Please complete all required fields");
      return;
    }

    try {
      setCreating(true);
      const taskData: CREATE_REPAIR_TASK = {
        RequestId: requestId,
        StartDate: startDate.toISOString(),
        AssigneeId: assigneeId,
        ErrorGuidelineIds: selectedErrorGuidelines,
      };

      await apiClient.task.createRepairTask(taskData);
      toast.success("Repair task created successfully!");
      setOpen(false);
      if (onTaskCreated) {
        onTaskCreated();
      }
    } catch (error) {
      console.error("Failed to create repair task:", error);
      toast.error("Failed to create repair task");
    } finally {
      setCreating(false);
    }
  };

  // Navigation
  const getCurrentStepIndex = () => {
    const stepMap = ["errors", "mechanic", "overview"];
    return stepMap.findIndex((step) => step === currentStep);
  };

  const goToNextStep = () => {
    if (currentStep === "errors") setCurrentStep("mechanic");
    else if (currentStep === "mechanic") setCurrentStep("overview");
  };

  const goToPreviousStep = () => {
    if (currentStep === "mechanic") setCurrentStep("errors");
    else if (currentStep === "overview") setCurrentStep("mechanic");
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case "errors":
        return (
          <ErrorGuidelineStep
            availableErrors={availableErrors}
            errorGuidelines={errorGuidelines}
            selectedErrorGuidelines={selectedErrorGuidelines}
            onSelectionChange={setSelectedErrorGuidelines}
            loading={loadingGuidelines}
            hasUninstallTask={hasUninstallTask}
          />
        );

      case "mechanic":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Select Mechanic & Schedule
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                Start Date: {startDate.toLocaleDateString()}{" "}
                {startDate.toLocaleTimeString()}
              </div>
            </div>

            <MechanicSelector
              mechanics={mechanics}
              selectedMechanic={selectedMechanic}
              onMechanicSelect={handleMechanicSelection}
              loading={loadingMechanics}
            />
          </div>
        );

      case "overview":
        return (
          <OverviewStep
            selectedErrorGuidelines={selectedErrorGuidelines}
            errorGuidelines={errorGuidelines}
            availableErrors={availableErrors}
            selectedMechanic={selectedMechanic}
            startDate={startDate}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto max-w-5xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Create Repair Task</DialogTitle>
          <DialogDescription>
            Follow the steps to create a repair task for the selected errors
          </DialogDescription>

          <StepIndicator
            steps={STEPS}
            currentStepIndex={getCurrentStepIndex()}
          />
        </DialogHeader>

        <div className="my-6">{renderStepContent()}</div>

        <DialogNavigation
          currentStep={currentStep}
          firstStep="errors"
          lastStep="overview"
          canProceed={canProceed}
          onPrevious={goToPreviousStep}
          onNext={goToNextStep}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          submitLabel="Create Task"
          loading={creating}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CreateTaskFromErrorsCpn;
