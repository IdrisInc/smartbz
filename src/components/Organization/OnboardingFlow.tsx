import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Building2, MapPin, Users, ShoppingCart, Package, 
  DollarSign, BarChart3, Heart, GraduationCap, Home, Truck,
  Hammer, Wheat, Briefcase, Sparkles, ArrowRight, Play
} from 'lucide-react';
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

const sectors = [
  { id: 'retail', name: 'Retail', icon: ShoppingCart, color: 'from-blue-500 to-blue-600' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Package, color: 'from-orange-500 to-orange-600' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'from-red-500 to-red-600' },
  { id: 'education', name: 'Education', icon: GraduationCap, color: 'from-purple-500 to-purple-600' },
  { id: 'hospitality', name: 'Hospitality', icon: Home, color: 'from-pink-500 to-pink-600' },
  { id: 'transportation', name: 'Transportation', icon: Truck, color: 'from-cyan-500 to-cyan-600' },
  { id: 'construction', name: 'Construction', icon: Hammer, color: 'from-amber-500 to-amber-600' },
  { id: 'agriculture', name: 'Agriculture', icon: Wheat, color: 'from-green-500 to-green-600' },
  { id: 'finance', name: 'Finance', icon: DollarSign, color: 'from-emerald-500 to-emerald-600' },
  { id: 'technology', name: 'Technology', icon: BarChart3, color: 'from-indigo-500 to-indigo-600' },
  { id: 'consulting', name: 'Consulting', icon: Briefcase, color: 'from-slate-500 to-slate-600' },
  { id: 'other', name: 'Other', icon: Sparkles, color: 'from-violet-500 to-violet-600' },
];

const features = [
  { title: 'Sales & POS', description: 'Complete point of sale system', icon: ShoppingCart },
  { title: 'Inventory', description: 'Stock management & tracking', icon: Package },
  { title: 'Finance', description: 'Expense & revenue tracking', icon: DollarSign },
  { title: 'HR & Payroll', description: 'Tanzania-compliant payroll', icon: Users },
  { title: 'Reports', description: 'Business analytics', icon: BarChart3 },
  { title: 'Multi-Branch', description: 'Manage multiple locations', icon: Building2 },
];

interface OnboardingContent {
  content_key: string;
  title: string;
  subtitle: string;
  content: string;
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [onboardingContent, setOnboardingContent] = useState<Record<string, OnboardingContent>>({});
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    checkOnboardingProgress();
    fetchOnboardingContent();
  }, [currentOrganization]);

  const fetchOnboardingContent = async () => {
    try {
      const { data } = await supabase
        .from('onboarding_content')
        .select('*')
        .eq('is_active', true);
      
      if (data) {
        const contentMap: Record<string, OnboardingContent> = {};
        data.forEach(item => {
          contentMap[item.content_key] = item;
        });
        setOnboardingContent(contentMap);
      }
    } catch (error) {
      console.error('Error fetching onboarding content:', error);
    }
  };

  const checkOnboardingProgress = async () => {
    if (!currentOrganization) return;

    const progressCheck = [
      currentOrganization ? 1 : null,
      await checkBranchExists() ? 2 : null,
    ].filter(Boolean) as number[];

    setCompletedSteps(progressCheck);
    
    if (progressCheck.length >= 1) {
      setShowRegistration(true);
    }
    
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

  const handleGetStarted = () => {
    setShowRegistration(true);
  };

  const progress = (completedSteps.length / steps.length) * 100;

  // Show landing page if no organization yet
  if (!showRegistration && !currentOrganization) {
    return (
      <div className="min-h-screen bg-gradient-hero flex flex-col overflow-hidden relative">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-primary-glow/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/5 rounded-full blur-3xl animate-float" style={{animationDelay: '2s'}}></div>
          
          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
        </div>

        <div className="flex-1 relative z-10">
          {/* Hero Section */}
          <section className="container mx-auto px-4 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center space-y-8 animate-fade-in">
                {/* Logo Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Business Management Made Simple</span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
                  <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                    {onboardingContent.hero?.title || 'Welcome to '}
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent">
                    BizWiz
                  </span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  {onboardingContent.hero?.content || 'The complete business management solution designed for Tanzanian businesses. Streamline operations, boost productivity, and grow your business with our powerful yet easy-to-use platform.'}
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="group bg-gradient-primary hover:opacity-90 text-lg px-8 py-6 shadow-elegant hover-lift"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="text-lg px-8 py-6 hover-lift"
                  >
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </div>
              </div>

              {/* Feature Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-16 animate-slide-in-right" style={{animationDelay: '0.3s'}}>
                {features.map((feature, index) => (
                  <Card 
                    key={feature.title} 
                    className="group hover-lift glass border-0 shadow-card"
                    style={{animationDelay: `${index * 0.1}s`}}
                  >
                    <CardContent className="pt-6 text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft group-hover:shadow-glow transition-shadow">
                        <feature.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Sectors Section */}
          <section className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 animate-fade-in">
                <Badge variant="secondary" className="mb-4">Industry Solutions</Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  {onboardingContent.sectors_intro?.title || 'Built for Your Industry'}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  {onboardingContent.sectors_intro?.content || 'Whether you\'re in retail, manufacturing, healthcare, or any other sector, BizWiz adapts to your unique business needs.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sectors.map((sector, index) => (
                  <Card 
                    key={sector.id}
                    className="group hover-lift cursor-pointer glass border-0 shadow-card overflow-hidden"
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <CardContent className="pt-6 text-center relative">
                      <div className={`absolute inset-0 bg-gradient-to-br ${sector.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${sector.color} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform`}>
                        <sector.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-sm">{sector.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Benefits Section */}
          <section className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6 animate-slide-in-left">
                  <Badge variant="secondary">Why BizWiz?</Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold">
                    Everything You Need to Run Your Business
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    From sales and inventory to Tanzania-compliant payroll calculations, BizWiz provides comprehensive tools designed specifically for local businesses.
                  </p>
                  <ul className="space-y-4">
                    {[
                      'Tanzania PAYE, NSSF, WCF & SDL compliant',
                      'Multi-branch support for growing businesses',
                      'Real-time inventory tracking',
                      'Comprehensive sales & financial reports',
                      'Role-based access control',
                      'Works offline with sync capabilities'
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted}
                    className="mt-4 bg-gradient-primary hover:opacity-90"
                  >
                    Start Your Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>

                <div className="relative animate-slide-in-right">
                  {/* Dashboard Preview Mockup */}
                  <div className="relative rounded-2xl overflow-hidden shadow-elegant border border-border/50">
                    <div className="bg-gradient-to-br from-card to-muted p-6 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-destructive"></div>
                        <div className="w-3 h-3 rounded-full bg-warning"></div>
                        <div className="w-3 h-3 rounded-full bg-success"></div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'Revenue', value: 'TZS 12.5M' },
                          { label: 'Orders', value: '324' },
                          { label: 'Customers', value: '89' },
                        ].map((stat) => (
                          <div key={stat.label} className="bg-background/50 rounded-lg p-4">
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                            <p className="text-lg font-bold">{stat.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-32 bg-background/50 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating cards */}
                  <div className="absolute -top-4 -right-4 bg-card rounded-lg shadow-soft p-3 animate-float">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Sale Complete</p>
                        <p className="text-xs text-muted-foreground">TZS 45,000</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute -bottom-4 -left-4 bg-card rounded-lg shadow-soft p-3 animate-float" style={{animationDelay: '1s'}}>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Package className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">Stock Alert</p>
                        <p className="text-xs text-muted-foreground">3 items low</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="container mx-auto px-4 py-16 lg:py-24">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-gradient-primary text-white border-0 shadow-elegant overflow-hidden">
                <CardContent className="pt-12 pb-12 text-center relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]"></div>
                  <div className="relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                      {onboardingContent.cta?.title || 'Ready to Get Started?'}
                    </h2>
                    <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
                      {onboardingContent.cta?.content || 'Set up your business in minutes and join thousands of Tanzanian businesses already using BizWiz.'}
                    </p>
                    <Button 
                      size="lg"
                      variant="secondary"
                      onClick={handleGetStarted}
                      className="text-lg px-8 py-6 hover-lift"
                    >
                      Create Your Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>

        <OnboardingFooter />
      </div>
    );
  }

  // Show registration flow
  return (
    <div className="min-h-screen bg-gradient-hero flex flex-col overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-primary-glow/10 rounded-full blur-2xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/5 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="flex-1 max-w-4xl mx-auto space-y-8 relative z-10 p-4 sm:p-6 lg:p-8">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-full mb-4 animate-glow shadow-glow">
            <Building2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Set Up Your Business
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's get your organization ready in just a few simple steps.
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
