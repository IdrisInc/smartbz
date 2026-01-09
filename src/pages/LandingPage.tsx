import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, Building2, MapPin, Users, ShoppingCart, Package, 
  DollarSign, BarChart3, Heart, GraduationCap, Home, Truck,
  Hammer, Wheat, Briefcase, Sparkles, ArrowRight, Play, LogIn
} from 'lucide-react';
import { OnboardingFooter } from '@/components/Organization/OnboardingFooter';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';

const sectors = [
  { id: 'retail', name: 'Retail', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', description: 'Shops, supermarkets, boutiques' },
  { id: 'manufacturing', name: 'Manufacturing', icon: Package, color: 'from-orange-500 to-orange-600', description: 'Production & factories' },
  { id: 'healthcare', name: 'Healthcare', icon: Heart, color: 'from-red-500 to-red-600', description: 'Clinics, pharmacies, hospitals' },
  { id: 'education', name: 'Education', icon: GraduationCap, color: 'from-purple-500 to-purple-600', description: 'Schools, training centers' },
  { id: 'hospitality', name: 'Hospitality', icon: Home, color: 'from-pink-500 to-pink-600', description: 'Hotels, restaurants, tourism' },
  { id: 'transportation', name: 'Transportation', icon: Truck, color: 'from-cyan-500 to-cyan-600', description: 'Logistics, delivery services' },
  { id: 'construction', name: 'Construction', icon: Hammer, color: 'from-amber-500 to-amber-600', description: 'Building, contractors' },
  { id: 'agriculture', name: 'Agriculture', icon: Wheat, color: 'from-green-500 to-green-600', description: 'Farming, agribusiness' },
  { id: 'finance', name: 'Finance', icon: DollarSign, color: 'from-emerald-500 to-emerald-600', description: 'Banking, insurance, investments' },
  { id: 'technology', name: 'Technology', icon: BarChart3, color: 'from-indigo-500 to-indigo-600', description: 'IT services, software' },
  { id: 'consulting', name: 'Consulting', icon: Briefcase, color: 'from-slate-500 to-slate-600', description: 'Professional services' },
  { id: 'real_estate', name: 'Real Estate', icon: Building2, color: 'from-teal-500 to-teal-600', description: 'Property management' },
  { id: 'entertainment', name: 'Entertainment', icon: Play, color: 'from-rose-500 to-rose-600', description: 'Media, events, leisure' },
  { id: 'non_profit', name: 'Non-Profit', icon: Heart, color: 'from-sky-500 to-sky-600', description: 'NGOs, charities' },
  { id: 'other', name: 'Other', icon: Sparkles, color: 'from-violet-500 to-violet-600', description: 'Any other business type' },
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

export default function LandingPage() {
  const [onboardingContent, setOnboardingContent] = useState<Record<string, OnboardingContent>>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOnboardingContent();
  }, []);

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

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

  const handleGetStarted = () => {
    navigate('/auth?mode=signup');
  };

  const handleLogin = () => {
    navigate('/auth');
  };

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

      {/* Navigation Header */}
      <header className="relative z-20 container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold">BizWiz</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleLogin}>
              <LogIn className="mr-2 h-4 w-4" />
              Login
            </Button>
            <Button onClick={handleGetStarted} className="bg-gradient-primary hover:opacity-90">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8 pb-16 lg:pt-16 lg:pb-24">
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
                  onClick={handleLogin}
                  className="text-lg px-8 py-6 hover-lift"
                >
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign In
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
        <section className="container mx-auto px-4 py-16 lg:py-24 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <Badge variant="secondary" className="mb-4">Industry Solutions</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                {onboardingContent.sectors_intro?.title || 'Built for Every Industry'}
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {onboardingContent.sectors_intro?.content || 'Whether you\'re in retail, manufacturing, healthcare, or any other sector, BizWiz adapts to your unique business needs.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {sectors.map((sector, index) => (
                <Card 
                  key={sector.id}
                  className="group hover-lift cursor-pointer glass border-0 shadow-card overflow-hidden"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <CardContent className="pt-6 pb-4 text-center relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${sector.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl bg-gradient-to-br ${sector.color} flex items-center justify-center shadow-soft group-hover:scale-110 transition-transform`}>
                      <sector.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-semibold text-sm">{sector.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{sector.description}</p>
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
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg"
                      variant="secondary"
                      onClick={handleGetStarted}
                      className="text-lg px-8 py-6 hover-lift"
                    >
                      Create Your Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={handleLogin}
                      className="text-lg px-8 py-6 hover-lift bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <LogIn className="mr-2 h-5 w-5" />
                      Sign In
                    </Button>
                  </div>
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
