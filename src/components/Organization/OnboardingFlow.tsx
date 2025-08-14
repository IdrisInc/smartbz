
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
    <div className="min-h-screen gradient-bg p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      <div className="absolute top-20 left-20 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-bounce-in"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-accent/20 rounded-full blur-3xl animate-bounce-in" style={{ animationDelay: '0.5s' }}></div>
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4 animate-fade-in">
          <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-lg">Welcome to BizWiz</h1>
          <p className="text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
            Let's set up your business in just a few steps and get you ready to manage everything efficiently
          </p>
        </div>

        {/* Progress */}
        <Card className="animate-scale-in glass-effect border-white/20 shadow-2xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Setup Progress</CardTitle>
              <span className="text-sm text-white/80">
                {completedSteps.length} of {steps.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-3 bg-white/20" />
          </CardHeader>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = step.id <= Math.max(currentStep, ...completedSteps) + 1;

            return (
              <Card
                key={step.id}
                className={`cursor-pointer transition-all duration-500 transform hover:scale-105 glass-effect border-white/30 shadow-xl ${
                  isCurrent
                    ? 'ring-2 ring-white/50 shadow-2xl animate-pulse scale-105'
                    : isCompleted
                    ? 'bg-green-500/20 border-green-300/50 text-white'
                    : !isAccessible
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/20'
                }`}
                onClick={() => isAccessible && setCurrentStep(step.id)}
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3">
                    {isCompleted ? (
                      <div className="relative">
                        <CheckCircle2 className="h-10 w-10 text-green-300 animate-bounce-in" />
                        <div className="absolute inset-0 h-10 w-10 rounded-full bg-green-300/30 animate-ping"></div>
                      </div>
                    ) : (
                      <step.icon 
                        className={`h-10 w-10 ${
                          isCurrent 
                            ? 'text-white animate-bounce drop-shadow-lg' 
                            : 'text-white/70'
                        }`} 
                      />
                    )}
                  </div>
                  <CardTitle className="text-lg text-white font-semibold">{step.title}</CardTitle>
                  <CardDescription className="text-sm text-white/80">
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
