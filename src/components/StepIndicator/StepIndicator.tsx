import { Progress } from "@/components/ui/progress";

interface StepIndicatorProps {
  steps: string[];
  currentStepIndex: number;
}

const StepIndicator = ({ steps, currentStepIndex }: StepIndicatorProps) => {
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        {steps.map((step, index) => (
          <span
            key={index}
            className={
              index === currentStepIndex
                ? "font-medium text-blue-600"
                : "text-gray-500"
            }
          >
            {index + 1}. {step}
          </span>
        ))}
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
};

export default StepIndicator;
