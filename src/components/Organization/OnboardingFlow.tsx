import React, { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Building2, MapPin } from 'lucide-react';
import { BusinessRegistrationStep } from './BusinessRegistrationStep';
import { BranchRegistrationStep } from './BranchRegistrationStep';
import { OnboardingComplete } from './OnboardingComplete';
import { OnboardingFooter } from './OnboardingFooter';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import dashboardPreview from '@/assets/dashboard-preview.png';
import teamCollaboration from '@/assets/team-collaboration.png';
import retailPos from '@/assets/retail-pos.png';

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

  useEffect(() => {
    checkOnboardingProgress();
  }, [currentOrganization]);

  const checkOnboardingProgress = async () => {
    if (!currentOrganization) return;

    const progressCheck = [
      currentOrganization ? 1 : null,
      await checkBranchExists() ? 2 : null,
    ].filter(Boolean) as number[];

    setCompletedSteps(progressCheck);
    
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
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-glow/10 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/5 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="flex-1 max-w-6xl mx-auto space-y-8 relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Hero Section with Image */}
        <div className="grid lg:grid-cols-2 gap-8 items-center animate-fade-in">
          <div className="text-center lg:text-left space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-4 animate-glow shadow-glow">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Set Up Your Business
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Let's get your organization ready in just a few simple steps.
            </p>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-glow/20 rounded-2xl blur-xl"></div>
            <img 
              src={dashboardPreview} 
              alt="Dashboard Preview" 
              className="relative rounded-2xl shadow-elegant border border-white/10 hover:scale-105 transition-transform duration-500"
            />
          </div>
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
            </div>
          </CardHeader>
        </Card>

        {/* Steps Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {steps.map((step) => {
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
                              ? 'text-white' 
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

        {/* Step Content with Side Image */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 animate-slide-in-right">
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
          
          {/* Side Images */}
          <div className="hidden lg:flex flex-col gap-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
              <img 
                src={teamCollaboration} 
                alt="Team Collaboration" 
                className="relative rounded-xl shadow-soft border border-white/10 hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">Team Collaboration</p>
                <p className="text-xs text-muted-foreground">Work together seamlessly</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-glow/20 to-transparent rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
              <img 
                src={retailPos} 
                alt="Point of Sale" 
                className="relative rounded-xl shadow-soft border border-white/10 hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg p-3">
                <p className="text-sm font-medium text-foreground">Modern POS System</p>
                <p className="text-xs text-muted-foreground">Streamlined sales experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <OnboardingFooter />
    </div>
  );
}
