import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import {
  ChevronLeft, ChevronRight, Play, LogIn, LayoutDashboard, Package,
  ShoppingCart, Users, Wallet, TrendingUp, Settings, Monitor,
  CheckCircle2, Eye, X, Maximize2, Minimize2
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  module: string;
  imageUrl?: string;
}

const defaultTourSteps: TourStep[] = [
  { id: 'login', title: 'Secure Login', description: 'Sign in with email & password or use social login. Multi-factor authentication supported.', module: 'auth' },
  { id: 'dashboard', title: 'Smart Dashboard', description: 'Real-time KPIs, charts, and alerts tailored to your industry sector.', module: 'dashboard' },
  { id: 'products', title: 'Product Management', description: 'Add products with categories, brands, units, taxes, and stock tracking.', module: 'products' },
  { id: 'pos', title: 'Point of Sale', description: 'Fast checkout with barcode scanning, discounts, and multiple payment methods.', module: 'pos' },
  { id: 'sales', title: 'Sales & Returns', description: 'Track all sales transactions, process returns, and manage credit notes.', module: 'sales' },
  { id: 'inventory', title: 'Inventory Control', description: 'Purchase orders, stock adjustments, supplier management, and low-stock alerts.', module: 'inventory' },
  { id: 'finance', title: 'Finance & Reports', description: 'Invoices, expenses, revenue tracking, and comprehensive financial reports.', module: 'finance' },
  { id: 'employees', title: 'HR & Payroll', description: 'Employee management, attendance tracking, Tanzania-compliant payroll processing.', module: 'employees' },
  { id: 'settings', title: 'System Settings', description: 'Business hours, roles & permissions, email templates, and subscription management.', module: 'settings' },
];

// Mock data for each module preview
const mockModulePreviews: Record<string, React.ReactNode> = {
  auth: <LoginPreview />,
  dashboard: <DashboardPreview />,
  products: <ProductsPreview />,
  pos: <POSPreview />,
  sales: <SalesPreview />,
  inventory: <InventoryPreview />,
  finance: <FinancePreview />,
  employees: <EmployeesPreview />,
  settings: <SettingsPreview />,
};

interface SystemDemoTourProps {
  sectorId: string;
  sectorName: string;
}

export function SystemDemoTour({ sectorId, sectorName }: SystemDemoTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tourSteps, setTourSteps] = useState<TourStep[]>(defaultTourSteps);

  // Load admin-configured tour content from onboarding_content
  useEffect(() => {
    const loadTourContent = async () => {
      const { data } = await supabase
        .from('onboarding_content')
        .select('*')
        .like('content_key', 'tour_%')
        .eq('is_active', true)
        .order('display_order');

      if (data && data.length > 0) {
        const adminSteps: TourStep[] = data.map(item => ({
          id: item.content_key.replace('tour_', ''),
          title: item.title || '',
          description: item.content || '',
          module: (item.metadata as any)?.module || item.content_key.replace('tour_', ''),
          imageUrl: item.image_url || undefined,
        }));
        setTourSteps(adminSteps);
      }
    };
    loadTourContent();
  }, []);

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= tourSteps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, tourSteps.length]);

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  const moduleIcons: Record<string, React.ElementType> = {
    auth: LogIn, dashboard: LayoutDashboard, products: Package,
    pos: ShoppingCart, sales: ShoppingCart, inventory: Package,
    finance: Wallet, employees: Users, settings: Settings,
  };

  const StepIcon = moduleIcons[step.module] || Monitor;

  return (
    <Card className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-50 shadow-2xl' : ''}`}>
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 -z-10" onClick={() => setIsExpanded(false)} />
      )}

      <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Live System Tour</CardTitle>
              <CardDescription>See how {sectorName} businesses use the platform</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-1"
            >
              <Play className={`h-3.5 w-3.5 ${isPlaying ? 'text-green-600' : ''}`} />
              {isPlaying ? 'Pause' : 'Auto-play'}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <Progress value={progress} className="h-1.5 mt-3" />
      </CardHeader>

      <CardContent className="p-0">
        <div className={`grid ${isExpanded ? 'md:grid-cols-[280px,1fr]' : 'md:grid-cols-[220px,1fr]'}`}>
          {/* Step Navigation */}
          <div className="border-r bg-muted/30">
            <ScrollArea className={isExpanded ? 'h-[calc(100vh-220px)]' : 'h-[400px]'}>
              <div className="p-2 space-y-0.5">
                {tourSteps.map((s, idx) => {
                  const Icon = moduleIcons[s.module] || Monitor;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { setCurrentStep(idx); setIsPlaying(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all text-sm ${
                        idx === currentStep
                          ? 'bg-primary/10 text-primary font-medium shadow-sm'
                          : idx < currentStep
                          ? 'text-muted-foreground hover:bg-accent/50'
                          : 'text-foreground hover:bg-accent/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        idx < currentStep
                          ? 'bg-green-100 text-green-700'
                          : idx === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {idx < currentStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : idx + 1}
                      </div>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Step Content */}
          <div className={isExpanded ? 'h-[calc(100vh-220px)] overflow-y-auto' : 'h-[400px] overflow-y-auto'}>
            <div className="p-4 sm:p-6 space-y-4">
              {/* Step Header */}
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <StepIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {currentStep + 1}/{tourSteps.length}
                </Badge>
              </div>

              {/* Module Preview */}
              {step.imageUrl ? (
                <div className="rounded-xl border overflow-hidden shadow-sm">
                  <img src={step.imageUrl} alt={step.title} className="w-full h-auto" />
                </div>
              ) : (
                <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                  <div className="bg-muted/50 px-3 py-1.5 border-b flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">SmartBZ — {step.title}</span>
                  </div>
                  <div className="p-4">
                    {mockModulePreviews[step.module] || <GenericPreview title={step.title} />}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCurrentStep(Math.min(tourSteps.length - 1, currentStep + 1))}
                  disabled={currentStep === tourSteps.length - 1}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Mock Module Previews ────────────────────────────────────

function LoginPreview() {
  return (
    <div className="max-w-sm mx-auto space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-foreground">Welcome Back</h3>
        <p className="text-sm text-muted-foreground">Sign in to your account</p>
      </div>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-xs">Email</Label>
          <Input placeholder="admin@company.com" disabled className="bg-muted/50" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Password</Label>
          <Input type="password" placeholder="••••••••" disabled className="bg-muted/50" />
        </div>
        <Button className="w-full" disabled>Sign In</Button>
        <p className="text-xs text-center text-muted-foreground">Demo mode — no actual login required</p>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Revenue', value: 'TZS 12.4M', change: '+15%' },
          { label: 'Orders', value: '847', change: '+8%' },
          { label: 'Customers', value: '2,340', change: '+12%' },
          { label: 'Products', value: '456', change: '+3%' },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-lg border bg-card">
            <p className="text-xs text-muted-foreground">{m.label}</p>
            <p className="text-lg font-bold text-foreground">{m.value}</p>
            <p className="text-xs text-green-600">{m.change} this month</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border">
          <p className="text-sm font-medium text-foreground mb-2">Sales Trend</p>
          <div className="flex items-end gap-1 h-16">
            {[40, 55, 38, 65, 72, 60, 80].map((h, i) => (
              <div key={i} className="flex-1 bg-primary/20 rounded-t" style={{ height: `${h}%` }}>
                <div className="w-full bg-primary rounded-t" style={{ height: `${h * 0.7}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <p className="text-sm font-medium text-foreground mb-2">Top Products</p>
          <div className="space-y-2">
            {['Laptop Pro', 'Phone X', 'Tablet Air'].map((p, i) => (
              <div key={p} className="flex justify-between text-xs">
                <span className="text-foreground">{p}</span>
                <span className="text-muted-foreground">{[124, 89, 67][i]} sold</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Input placeholder="Search products..." disabled className="max-w-xs bg-muted/50" />
        <Button size="sm" disabled>+ Add Product</Button>
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Product</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">SKU</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Price</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Stock</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
          </tr></thead>
          <tbody>
            {[
              ['Rice (25kg)', 'RIC-001', 'TZS 65,000', '234', 'In Stock'],
              ['Cooking Oil (5L)', 'OIL-002', 'TZS 28,500', '12', 'Low Stock'],
              ['Sugar (1kg)', 'SUG-003', 'TZS 3,200', '567', 'In Stock'],
              ['Cement (50kg)', 'CEM-004', 'TZS 18,000', '0', 'Out of Stock'],
            ].map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-medium text-foreground">{row[0]}</td>
                <td className="px-3 py-2 text-muted-foreground">{row[1]}</td>
                <td className="px-3 py-2 text-foreground">{row[2]}</td>
                <td className="px-3 py-2 text-foreground">{row[3]}</td>
                <td className="px-3 py-2">
                  <Badge variant={row[4] === 'In Stock' ? 'default' : row[4] === 'Low Stock' ? 'secondary' : 'destructive'} className="text-xs">
                    {row[4]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function POSPreview() {
  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-3 space-y-2">
        <Input placeholder="Scan barcode or search..." disabled className="bg-muted/50" />
        <div className="grid grid-cols-3 gap-2">
          {['Rice 25kg', 'Oil 5L', 'Sugar 1kg', 'Flour 2kg', 'Salt 500g', 'Tea 100g'].map(p => (
            <button key={p} className="p-3 border rounded-lg text-center hover:bg-accent/50 transition-colors">
              <p className="text-xs font-medium text-foreground">{p}</p>
              <p className="text-xs text-muted-foreground">TZS {Math.floor(Math.random() * 50 + 5)}K</p>
            </button>
          ))}
        </div>
      </div>
      <div className="col-span-2 border rounded-lg p-3 space-y-2 bg-muted/20">
        <p className="font-medium text-sm text-foreground">Current Sale</p>
        <div className="space-y-1 text-xs">
          {[['Rice 25kg', 'TZS 65,000'], ['Oil 5L x2', 'TZS 57,000']].map(([item, price]) => (
            <div key={item} className="flex justify-between py-1 border-b">
              <span className="text-foreground">{item}</span>
              <span className="text-foreground">{price}</span>
            </div>
          ))}
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-sm">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">TZS 122,000</span>
        </div>
        <Button className="w-full" size="sm" disabled>Complete Sale</Button>
      </div>
    </div>
  );
}

function SalesPreview() {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/50">
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Invoice</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Amount</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Date</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
        </tr></thead>
        <tbody>
          {[
            ['INV-0047', 'John Doe', 'TZS 245,000', 'Mar 06', 'Completed'],
            ['INV-0046', 'Jane Smith', 'TZS 89,500', 'Mar 05', 'Pending'],
            ['INV-0045', 'ABC Corp', 'TZS 1,200,000', 'Mar 05', 'Completed'],
            ['INV-0044', 'Mary Johnson', 'TZS 34,000', 'Mar 04', 'Returned'],
          ].map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2 font-medium text-primary">{row[0]}</td>
              <td className="px-3 py-2 text-foreground">{row[1]}</td>
              <td className="px-3 py-2 font-medium text-foreground">{row[2]}</td>
              <td className="px-3 py-2 text-muted-foreground">{row[3]}</td>
              <td className="px-3 py-2">
                <Badge variant={row[4] === 'Completed' ? 'default' : row[4] === 'Pending' ? 'secondary' : 'destructive'} className="text-xs">
                  {row[4]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InventoryPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Items', value: '456', icon: Package },
          { label: 'Low Stock', value: '12', icon: TrendingUp },
          { label: 'Pending POs', value: '5', icon: ShoppingCart },
        ].map(m => (
          <div key={m.label} className="p-3 rounded-lg border flex items-center gap-2">
            <m.icon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{m.label}</p>
              <p className="text-lg font-bold text-foreground">{m.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/50">
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">PO Number</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Items</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
          </tr></thead>
          <tbody>
            {[
              ['PO-2024-041', 'ABC Suppliers', '15', 'Received'],
              ['PO-2024-042', 'XYZ Trading', '8', 'In Transit'],
              ['PO-2024-043', 'Local Vendor', '22', 'Pending'],
            ].map((row, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-medium text-foreground">{row[0]}</td>
                <td className="px-3 py-2 text-foreground">{row[1]}</td>
                <td className="px-3 py-2 text-foreground">{row[2]}</td>
                <td className="px-3 py-2">
                  <Badge variant={row[3] === 'Received' ? 'default' : 'secondary'} className="text-xs">{row[3]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FinancePreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg border">
          <p className="text-sm font-medium text-foreground mb-2">Revenue vs Expenses</p>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Revenue</span>
                <span className="text-foreground">TZS 8.5M</span>
              </div>
              <Progress value={85} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">Expenses</span>
                <span className="text-foreground">TZS 5.2M</span>
              </div>
              <Progress value={52} className="h-2" />
            </div>
          </div>
        </div>
        <div className="p-3 rounded-lg border">
          <p className="text-sm font-medium text-foreground mb-2">Recent Invoices</p>
          <div className="space-y-1 text-xs">
            {[['INV-047', 'TZS 245K', 'Paid'], ['INV-046', 'TZS 89K', 'Due'], ['INV-045', 'TZS 1.2M', 'Paid']].map(([id, amt, status]) => (
              <div key={id} className="flex justify-between py-1">
                <span className="text-foreground">{id}</span>
                <span className="text-foreground">{amt}</span>
                <Badge variant={status === 'Paid' ? 'default' : 'secondary'} className="text-[10px] h-5">{status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesPreview() {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead><tr className="bg-muted/50">
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Name</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Role</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Branch</th>
          <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
        </tr></thead>
        <tbody>
          {[
            ['Amina Hassan', 'Cashier', 'Main Branch', 'Active'],
            ['John Kimaro', 'Manager', 'Downtown', 'Active'],
            ['Grace Mwangi', 'Sales Staff', 'Main Branch', 'On Leave'],
            ['Peter Msemwa', 'Inventory', 'Warehouse', 'Active'],
          ].map((row, i) => (
            <tr key={i} className="border-t">
              <td className="px-3 py-2 font-medium text-foreground">{row[0]}</td>
              <td className="px-3 py-2 text-foreground">{row[1]}</td>
              <td className="px-3 py-2 text-muted-foreground">{row[2]}</td>
              <td className="px-3 py-2">
                <Badge variant={row[3] === 'Active' ? 'default' : 'secondary'} className="text-xs">{row[3]}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SettingsPreview() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Business Name', value: 'Demo Company Ltd' },
          { label: 'Country', value: 'Tanzania' },
          { label: 'Opening Hours', value: '8:00 AM - 6:00 PM' },
          { label: 'Currency', value: 'TZS (Tanzanian Shilling)' },
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg border bg-muted/20">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="text-sm font-medium text-foreground">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg border">
        <p className="text-sm font-medium text-foreground mb-2">Roles & Permissions</p>
        <div className="flex flex-wrap gap-2">
          {['Business Owner', 'Manager', 'Cashier', 'Sales Staff', 'Inventory Staff'].map(r => (
            <Badge key={r} variant="outline" className="text-xs">{r}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-muted-foreground">
      <div className="text-center">
        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">{title} Preview</p>
      </div>
    </div>
  );
}
