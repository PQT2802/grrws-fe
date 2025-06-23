import { DialogFooter } from "@/components/ui/dialog";
import ButtonCpn from "@/components/ButtonCpn/ButtonCpn";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";

interface DialogNavigationProps {
  currentStep: string;
  firstStep: string;
  lastStep: string;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
}

const DialogNavigation = ({
  currentStep,
  firstStep,
  lastStep,
  canProceed,
  onPrevious,
  onNext,
  onSubmit,
  onCancel,
  submitLabel = "Create Task",
  loading = false,
}: DialogNavigationProps) => {
  const isFirstStep = currentStep === firstStep;
  const isLastStep = currentStep === lastStep;

  return (
    <DialogFooter>
      <div className="flex justify-between w-full">
        <div>
          {!isFirstStep && (
            <ButtonCpn
              type="button"
              title="Previous"
              icon={<ChevronLeft />}
              onClick={onPrevious}
            />
          )}
        </div>

        <div className="flex gap-2">
          <ButtonCpn type="button" title="Cancel" onClick={onCancel} />

          {isLastStep ? (
            <ButtonCpn
              type="button"
              title={submitLabel}
              icon={<Check />}
              onClick={canProceed ? onSubmit : undefined}
              loading={loading}
            />
          ) : (
            <ButtonCpn
              type="button"
              title="Next Step"
              icon={<ChevronRight />}
              onClick={canProceed ? onNext : undefined}
            />
          )}
        </div>
      </div>
    </DialogFooter>
  );
};

export default DialogNavigation;
