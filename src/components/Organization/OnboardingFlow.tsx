
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Building2, MapPin, Users } from 'lucide-react';
import { BusinessRegistrationStep } from './BusinessRegistrationStep';
import { BranchRegistrationStep } from './BranchRegistrationStep';
import { OnboardingComplete } from './OnboardingComplete';
import { useOrganization } from '@/contexts/OrganizationContext';

const steps = [
  {
    id: 1,
    title: 'Business Details',
    description: 'Register your business information',
    icon: Building2,
  },
  {
    id: 2,
    title: 'First Branch',
    description: 'Set up your main location',
    icon: MapPin,
  },
  {
    id: 3,
    title: 'Complete',
    description: 'Ready to manage your business',
    icon: CheckCircle2,
  },
];

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const { currentOrganization } = useOrganization();

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (stepId < steps.length) {
      setCurrentStep(stepId + 1);
    }
  };

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-4xl font-bold tracking-tight">Welcome to BizWiz</h1>
          <p className="text-xl text-muted-foreground">
            Let's set up your business in just a few steps
          </p>
        </div>

        {/* Progress */}
        <Card className="animate-scale-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Setup Progress</CardTitle>
              <span className="text-sm text-muted-foreground">
                {completedSteps.length} of {steps.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = step.id <= Math.max(currentStep, ...completedSteps) + 1;

            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  isCurrent
                    ? 'ring-2 ring-primary shadow-lg animate-pulse'
                    : isCompleted
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20'
                    : !isAccessible
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => isAccessible && setCurrentStep(step.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-2">
                    {isCompleted ? (
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    ) : (
                      <step.icon 
                        className={`h-8 w-8 ${
                          isCurrent ? 'text-primary animate-bounce' : 'text-muted-foreground'
                        }`} 
                      />
                    )}
                  </div>
                  <CardTitle className="text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="animate-fade-in">
          {currentStep === 1 && (
            <BusinessRegistrationStep onComplete={() => handleStepComplete(1)} />
          )}
          {currentStep === 2 && (
            <BranchRegistrationStep onComplete={() => handleStepComplete(2)} />
          )}
          {currentStep === 3 && (
            <OnboardingComplete />
          )}
        </div>
      </div>
    </div>
  );
}
