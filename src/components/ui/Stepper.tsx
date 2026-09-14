import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  maxStepReached?: number;
  onStepClick?: (step: number) => void;
}

export function Stepper({ steps, currentStep, completedSteps, maxStepReached = currentStep, onStepClick }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-start">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const canNavigate = index <= maxStepReached && !!onStepClick;

          return (
            <div key={index} className="relative flex min-w-0 flex-1 flex-col items-center">
              {index < steps.length - 1 && (
                <div
                  className={`absolute left-1/2 top-4 z-0 h-0.5 w-full transition-all ${
                    completedSteps.includes(index) ? "bg-blue-700" : "bg-slate-200"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => canNavigate && onStepClick?.(index)}
                disabled={!canNavigate}
                aria-label={`Ir al paso ${index + 1}: ${step.label}`}
                className={`relative z-10 flex flex-col items-center rounded-lg p-1 transition-colors ${canNavigate ? "cursor-pointer hover:bg-blue-50" : "cursor-not-allowed"}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isCompleted
                      ? "bg-blue-700 text-white"
                      : isCurrent
                      ? "bg-blue-700 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  } ${canNavigate ? "cursor-pointer hover:bg-blue-800" : "cursor-not-allowed"}`}
                >
                  {isCompleted ? <Check size={14} strokeWidth={2.5} /> : <span>{index + 1}</span>}
                </div>
                <div className="mt-2 text-center" style={{ minWidth: 72 }}>
                  <p
                    className={`text-xs font-medium leading-tight ${
                      isCompleted || isCurrent ? "text-slate-800" : "text-slate-400"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-700 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
