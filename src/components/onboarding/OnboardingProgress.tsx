import { useOnboarding } from '@/contexts/OnboardingContext';

export function OnboardingProgress() {
  const { stepNumber, totalSteps } = useOnboarding();
  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="w-full px-6 pt-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Step {stepNumber} of {totalSteps}</span>
        <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
