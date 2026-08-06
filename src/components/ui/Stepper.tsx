import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function Stepper({ steps, currentStep, completedSteps }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index);
          const isCurrent = currentStep === index;
          const isUpcoming = !isCompleted && !isCurrent;

          return (
            <div key={index} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    isCompleted
                      ? "bg-blue-700 text-white"
                      : isCurrent
                      ? "bg-blue-700 text-white ring-4 ring-blue-100"
                      : "bg-slate-100 text-slate-400"
                  }`}
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
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-16px] transition-all ${
                    completedSteps.includes(index) ? "bg-blue-700" : "bg-slate-200"
                  }`}
                />
              )}
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
