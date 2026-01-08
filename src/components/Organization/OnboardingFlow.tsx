import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Building2, MapPin, Users } from 'lucide-react';
import { BusinessRegistrationStep } from './BusinessRegistrationStep';
import { BranchRegistrationStep } from './BranchRegistrationStep';
import { OnboardingComplete } from './OnboardingComplete';
import { OnboardingFooter } from './OnboardingFooter';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';

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

  // Check onboarding progress when component mounts
  useEffect(() => {
    checkOnboardingProgress();
  }, [currentOrganization]);

  const checkOnboardingProgress = async () => {
    if (!currentOrganization) return;

    const progressCheck = [
      // Step 1: Business details (organization exists)
      currentOrganization ? 1 : null,
      
      // Step 2: Branch created
      await checkBranchExists() ? 2 : null,
    ].filter(Boolean) as number[];

    setCompletedSteps(progressCheck);
    
    // Set current step to the next incomplete step
    if (progressCheck.length === 0) {
      setCurrentStep(1);
    } else if (progressCheck.length === 1) {
      setCurrentStep(2);
    } else if (progressCheck.length === 2) {
      setCurrentStep(3);
    }
  };

  const checkBranchExists = async () => {
    if (!currentOrganization) return false;
    
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .limit(1);
      
      return !error && data && data.length > 0;
    } catch (error) {
      console.error('Error checking branches:', error);
      return false;
    }
  };

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
    <div className="min-h-screen bg-gradient-hero flex flex-col overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-glow/10 rounded-full animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/5 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
        {/* Decorative images/patterns */}
        <div className="absolute top-10 right-10 w-48 h-48 opacity-20">
          <svg viewBox="0 0 200 200" className="w-full h-full text-primary">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.3" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="80" fill="url(#grad1)" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="10 5" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>
        <div className="absolute bottom-32 left-10 w-36 h-36 opacity-15">
          <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
            <rect x="10" y="10" width="80" height="80" rx="10" fill="currentColor" fillOpacity="0.2" />
            <rect x="25" y="25" width="50" height="50" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
      </div>
      
      <div className="flex-1 max-w-4xl mx-auto space-y-8 relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-4 animate-glow">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Welcome to BizWiz
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Transform your business management with our comprehensive platform. Let's set up your organization in just a few simple steps.
          </p>
        </div>

        {/* Enhanced Progress */}
        <Card className="animate-scale-in glass shadow-card border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gradient-primary rounded-full animate-pulse"></div>
                Setup Progress
              </CardTitle>
              <span className="text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                {completedSteps.length} of {steps.length} completed
              </span>
            </div>
            <div className="relative">
              <Progress value={progress} className="h-3 bg-muted/30" />
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 animate-pulse" 
                   style={{ width: `${progress}%` }}></div>
            </div>
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
                className={`cursor-pointer transition-all duration-500 transform hover-lift ${
                  isCurrent
                    ? 'ring-2 ring-primary shadow-elegant bg-gradient-accent animate-glow border-primary/30'
                    : isCompleted
                    ? 'bg-gradient-to-br from-success/10 to-success/5 border-success/30 shadow-soft'
                    : !isAccessible
                    ? 'opacity-50 cursor-not-allowed grayscale'
                    : 'hover-scale shadow-card glass'
                }`}
                onClick={() => isAccessible && setCurrentStep(step.id)}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 relative">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${
                      isCurrent 
                        ? 'bg-gradient-primary shadow-glow' 
                        : isCompleted
                        ? 'bg-gradient-to-r from-success to-success/80 shadow-soft'
                        : 'bg-muted/30'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-8 w-8 text-white animate-scale-in" />
                      ) : (
                        <step.icon 
                          className={`h-8 w-8 ${
                            isCurrent 
                              ? 'text-white animate-bounce' 
                              : 'text-muted-foreground'
                          }`} 
                        />
                      )}
                    </div>
                    {isCurrent && (
                      <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping"></div>
                    )}
                  </div>
                  <CardTitle className={`text-lg font-semibold ${
                    isCurrent ? 'text-primary' : isCompleted ? 'text-success' : ''
                  }`}>
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {step.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* Enhanced Step Content */}
        <div className="animate-slide-in-right">
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
      
      {/* Footer */}
      <OnboardingFooter />
    </div>
  );
}