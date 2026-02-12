import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LayoutDashboard, ShoppingCart, Package, Store, Wallet, Users,
  UserCheck, TrendingUp, Settings, GitBranch, Crown, ChevronRight,
  ChevronLeft, X, Play, CheckCircle2
} from 'lucide-react';

interface TourStep {
  id: string;
  icon: React.ComponentType<any>;
  titleKey: string;
  title: string;
  description: string;
  features: string[];
  color: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    titleKey: 'nav.dashboard',
    title: 'Dashboard',
    description: 'Your command center with real-time business metrics, sales trends, and quick action buttons.',
    features: ['Revenue overview', 'Sales charts', 'Low stock alerts', 'Recent activities', 'Quick actions'],
    color: 'bg-blue-500',
  },
  {
    id: 'sales',
    icon: ShoppingCart,
    titleKey: 'nav.sales',
    title: 'Sales & POS',
    description: 'Complete point-of-sale system with invoicing, returns management, and payment tracking.',
    features: ['POS interface', 'Invoice generation', 'Sale returns & refunds', 'Payment methods', 'Discount management'],
    color: 'bg-green-500',
  },
  {
    id: 'products',
    icon: Package,
    titleKey: 'nav.products',
    title: 'Product Management',
    description: 'Manage your entire product catalog with categories, brands, units, and tax configurations.',
    features: ['Product catalog', 'Categories & brands', 'Unit management', 'Tax rules', 'Barcode/SKU support'],
    color: 'bg-purple-500',
  },
  {
    id: 'inventory',
    icon: Store,
    titleKey: 'nav.inventory',
    title: 'Inventory Management',
    description: 'Track stock levels, manage purchase orders, handle returns, and perform stock audits.',
    features: ['Stock tracking', 'Purchase orders', 'Purchase returns', 'Stock adjustments', 'Audit logs', 'Quotations'],
    color: 'bg-orange-500',
  },
  {
    id: 'finance',
    icon: Wallet,
    titleKey: 'nav.finance',
    title: 'Finance & Accounting',
    description: 'Comprehensive financial management with invoicing, expense tracking, and credit notes.',
    features: ['Invoicing', 'Expense tracking', 'Credit notes', 'Revenue reports', 'Payment history'],
    color: 'bg-emerald-500',
  },
  {
    id: 'employees',
    icon: UserCheck,
    titleKey: 'nav.employees',
    title: 'Employee Management',
    description: 'Manage your workforce with attendance tracking, payroll processing, and performance monitoring.',
    features: ['Employee profiles', 'Attendance tracking', 'Payroll (TZ PAYE/NSSF)', 'Performance reviews', 'Payslip generation'],
    color: 'bg-cyan-500',
  },
  {
    id: 'contacts',
    icon: Users,
    titleKey: 'nav.contacts',
    title: 'Contact Management',
    description: 'Organize customers and suppliers with detailed profiles and transaction history.',
    features: ['Customer database', 'Supplier management', 'Contact details', 'Transaction history'],
    color: 'bg-pink-500',
  },
  {
    id: 'reports',
    icon: TrendingUp,
    titleKey: 'nav.reports',
    title: 'Reports & Analytics',
    description: 'Data-driven insights with sales performance, inventory levels, and financial summaries.',
    features: ['Sales analytics', 'Inventory reports', 'Cash flow charts', 'Customer insights', 'Export to PDF/Excel'],
    color: 'bg-indigo-500',
  },
  {
    id: 'branches',
    icon: GitBranch,
    titleKey: 'nav.branches',
    title: 'Multi-Branch Support',
    description: 'Manage multiple business locations with branch-specific data and configurations.',
    features: ['Branch creation', 'Staff assignment', 'Branch-level reports', 'Centralized control'],
    color: 'bg-amber-500',
  },
  {
    id: 'settings',
    icon: Settings,
    titleKey: 'nav.settings',
    title: 'System Settings',
    description: 'Configure every aspect of your business — from appearance and roles to tax rules and email templates.',
    features: ['Business settings', 'Role management', 'Tax configuration', 'Email templates', 'Appearance customization', 'Subscription management'],
    color: 'bg-gray-500',
  },
];

interface AdminDemoTourProps {
  open: boolean;
  onClose: () => void;
}

export function AdminDemoTour({ open, onClose }: AdminDemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useLanguage();
  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const next = useCallback(() => {
    if (currentStep < tourSteps.length - 1) setCurrentStep((s) => s + 1);
  }, [currentStep]);

  const prev = useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  }, [currentStep]);

  useEffect(() => {
    if (open) setCurrentStep(0);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, next, prev, onClose]);

  const isLast = currentStep === tourSteps.length - 1;
  const Icon = step.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              {t('demo.title')}
            </DialogTitle>
            <Badge variant="secondary" className="text-xs">
              {t('demo.step')} {currentStep + 1} {t('demo.of')} {tourSteps.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </DialogHeader>

        <div className="space-y-4 py-2">
          <Card className="border-0 shadow-none">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${step.color} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{t(step.titleKey) || step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Key Features</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {step.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Step indicators */}
          <div className="flex justify-center gap-1.5">
            {tourSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('demo.skip')}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={prev} disabled={currentStep === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('common.back')}
            </Button>
            {isLast ? (
              <Button size="sm" onClick={onClose}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {t('demo.finish')}
              </Button>
            ) : (
              <Button size="sm" onClick={next}>
                {t('common.next')}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
