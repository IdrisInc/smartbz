import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ShoppingCart, Package, Heart, GraduationCap, Home, Truck,
  Hammer, Wheat, DollarSign, BarChart3, Briefcase, Building2,
  Play, Sparkles, ArrowLeft, CheckCircle2, Calendar, Users,
  TrendingUp, Activity, Target, FileText, Settings, Shield,
  Clock, MapPin, Wrench, Leaf, Music, BookOpen
} from 'lucide-react';
import { sectorConfigurations, SectorConfiguration } from '@/config/sectorConfigurations';
import { SectorModulePreview } from '@/components/Sectors/SectorModulePreview';
import { useNavigate } from 'react-router-dom';

const sectorIcons: Record<string, React.ElementType> = {
  retail: ShoppingCart, manufacturing: Package, technology: BarChart3,
  healthcare: Heart, finance: DollarSign, education: GraduationCap,
  hospitality: Home, real_estate: Building2, construction: Hammer,
  transportation: Truck, agriculture: Wheat, entertainment: Play,
  consulting: Briefcase, non_profit: Heart, other: Sparkles,
};

const sectorColors: Record<string, string> = {
  retail: 'bg-blue-500/10 text-blue-700 border-blue-200',
  manufacturing: 'bg-orange-500/10 text-orange-700 border-orange-200',
  technology: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  healthcare: 'bg-red-500/10 text-red-700 border-red-200',
  finance: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  education: 'bg-purple-500/10 text-purple-700 border-purple-200',
  hospitality: 'bg-pink-500/10 text-pink-700 border-pink-200',
  real_estate: 'bg-teal-500/10 text-teal-700 border-teal-200',
  construction: 'bg-amber-500/10 text-amber-700 border-amber-200',
  transportation: 'bg-cyan-500/10 text-cyan-700 border-cyan-200',
  agriculture: 'bg-green-500/10 text-green-700 border-green-200',
  entertainment: 'bg-rose-500/10 text-rose-700 border-rose-200',
  consulting: 'bg-slate-500/10 text-slate-700 border-slate-200',
  non_profit: 'bg-sky-500/10 text-sky-700 border-sky-200',
  other: 'bg-violet-500/10 text-violet-700 border-violet-200',
};

const sectorDescriptions: Record<string, string> = {
  retail: 'Shops, supermarkets, boutiques',
  manufacturing: 'Production & factories',
  technology: 'IT services, software',
  healthcare: 'Clinics, pharmacies, hospitals',
  finance: 'Banking, insurance, investments',
  education: 'Schools, training centers',
  hospitality: 'Hotels, restaurants, tourism',
  real_estate: 'Property management',
  construction: 'Building, contractors',
  transportation: 'Logistics, delivery services',
  agriculture: 'Farming, agribusiness',
  entertainment: 'Media, events, leisure',
  consulting: 'Professional services',
  non_profit: 'NGOs, charities',
  other: 'Any other business type',
};

export default function SectorShowcase() {
  const [activeSector, setActiveSector] = useState('retail');
  const navigate = useNavigate();
  const config = sectorConfigurations[activeSector] || sectorConfigurations.other;
  const Icon = sectorIcons[activeSector] || Sparkles;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Industry Solutions</h1>
              <p className="text-xs text-muted-foreground">Explore features for every business type</p>
            </div>
          </div>
          <Button onClick={() => navigate('/auth')} className="bg-primary text-primary-foreground">
            Get Started
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sector Selector Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 mb-8">
          {Object.entries(sectorConfigurations).map(([id, sector]) => {
            const SectorIcon = sectorIcons[id] || Sparkles;
            const isActive = activeSector === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSector(id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                  isActive 
                    ? 'border-primary bg-primary/5 shadow-md scale-105' 
                    : 'border-border bg-card hover:border-primary/30 hover:bg-accent/5'
                }`}
              >
                <SectorIcon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-xs font-medium leading-tight ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {sector.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Sector Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl border ${sectorColors[activeSector] || ''}`}>
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{config.name}</h2>
            <p className="text-muted-foreground">{sectorDescriptions[activeSector]}</p>
          </div>
          <Badge variant="secondary" className="ml-auto">
            {config.features.length} Features · {config.productCategories.length} Categories
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {config.dashboardMetrics.slice(0, 4).map((metric, idx) => (
                <Card key={metric}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{metric}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                      {['1,247', '94.3%', '856', '$45.2K'][idx] || '--'}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="text-green-600">+{[12, 3, 8, 15][idx]}%</span> from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Metrics */}
            {config.dashboardMetrics.length > 4 && (
              <div className="grid gap-4 md:grid-cols-3">
                {config.dashboardMetrics.slice(4).map((metric) => (
                  <Card key={metric}>
                    <CardContent className="flex items-center gap-3 pt-6">
                      <Activity className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{metric}</p>
                        <p className="text-lg font-bold text-foreground">--</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Sector Module Preview */}
            <SectorModulePreview sectorId={activeSector} config={config} />
          </TabsContent>

          {/* Features Tab */}
          <TabsContent value="features" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {config.features.map((feature) => (
                <Card key={feature.id} className="border-l-4 border-l-primary">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{feature.name}</CardTitle>
                      <Badge variant="default" className="bg-green-500/10 text-green-700 border-green-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                      </Badge>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeatureDemo featureId={feature.id} sectorId={activeSector} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {config.workflows.map((workflow) => (
                <Card key={workflow} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Settings className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground capitalize">
                          {workflow.replace(/_/g, ' ')}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Automated workflow for {config.name.toLowerCase()} operations
                        </p>
                        <div className="flex gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">Configurable</Badge>
                          <Badge variant="outline" className="text-xs">Auto-trigger</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Custom Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Custom Fields for {config.name}</CardTitle>
                <CardDescription>Industry-specific data fields</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2">
                  {config.customFields.map((field) => (
                    <div key={field.name} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{field.name.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-muted-foreground">Type: {field.type}</p>
                      </div>
                      {field.options && (
                        <div className="flex flex-wrap gap-1">
                          {field.options.slice(0, 3).map(opt => (
                            <Badge key={opt} variant="secondary" className="text-xs">{opt}</Badge>
                          ))}
                          {field.options.length > 3 && (
                            <Badge variant="secondary" className="text-xs">+{field.options.length - 3}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {config.productCategories.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {category.description && <CardDescription>{category.description}</CardDescription>}
                  </CardHeader>
                  <CardContent>
                    {category.fields && category.fields.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fields</p>
                        <div className="grid gap-2">
                          {category.fields.map((field) => (
                            <div key={field.name} className="flex items-center justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm capitalize">{field.name.replace(/_/g, ' ')}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                {field.options && (
                                  <Badge variant="secondary" className="text-xs">{field.options.length} options</Badge>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {config.reportTypes.map((report) => (
                <Card key={report} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize text-foreground">{report.replace(/_/g, ' ')}</h3>
                        <p className="text-sm text-muted-foreground">
                          Detailed {report.replace(/_/g, ' ')} analysis for {config.name.toLowerCase()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Required Fields */}
            <Card>
              <CardHeader>
                <CardTitle>Required Data Fields</CardTitle>
                <CardDescription>Essential fields for {config.name} reporting</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {config.requiredFields.map((field) => (
                    <Badge key={field} variant="outline" className="capitalize">
                      <Shield className="h-3 w-3 mr-1" />
                      {field.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Feature demo component showing mini previews for each feature type
function FeatureDemo({ featureId, sectorId }: { featureId: string; sectorId: string }) {
  const demoContent: Record<string, React.ReactNode> = {
    // Retail
    loyalty_programs: <DemoTable rows={[['Gold Member', '2,450 pts', 'Active'], ['Silver', '890 pts', 'Active'], ['Bronze', '120 pts', 'New']]} headers={['Tier', 'Points', 'Status']} />,
    seasonal_inventory: <DemoTable rows={[['Summer Collection', '342 items', '85%'], ['Winter Wear', '128 items', '45%']]} headers={['Season', 'Stock', 'Sold']} />,
    pos_integration: <DemoStats stats={[{ label: 'Today Sales', value: '47' }, { label: 'Avg. Value', value: '$32' }]} />,
    price_management: <DemoStats stats={[{ label: 'Active Promos', value: '5' }, { label: 'Avg. Discount', value: '15%' }]} />,
    // Manufacturing
    production_planning: <DemoTable rows={[['Batch #A001', 'In Progress', '65%'], ['Batch #A002', 'Queued', '0%']]} headers={['Batch', 'Status', 'Complete']} />,
    quality_control: <DemoStats stats={[{ label: 'Pass Rate', value: '97.3%' }, { label: 'Inspections', value: '24' }]} />,
    supply_chain: <DemoStats stats={[{ label: 'Suppliers', value: '18' }, { label: 'On-Time', value: '94%' }]} />,
    work_orders: <DemoTable rows={[['WO-2024-041', 'Active', 'Line A'], ['WO-2024-042', 'Pending', 'Line B']]} headers={['Order', 'Status', 'Line']} />,
    // Healthcare
    appointment_scheduling: <DemoTable rows={[['Dr. Smith', '9:00 AM', 'Confirmed'], ['Dr. Patel', '10:30 AM', 'Pending']]} headers={['Doctor', 'Time', 'Status']} />,
    patient_records: <DemoStats stats={[{ label: 'Patients', value: '1,247' }, { label: 'Today', value: '34' }]} />,
    insurance_billing: <DemoStats stats={[{ label: 'Claims', value: '89' }, { label: 'Approved', value: '76' }]} />,
    compliance_tracking: <DemoStats stats={[{ label: 'Compliance', value: '98%' }, { label: 'Audits', value: '3' }]} />,
    // Education
    student_management: <DemoStats stats={[{ label: 'Students', value: '456' }, { label: 'Classes', value: '24' }]} />,
    course_scheduling: <DemoTable rows={[['Math 101', 'Mon/Wed', 'Room A1'], ['Science', 'Tue/Thu', 'Lab B2']]} headers={['Course', 'Schedule', 'Room']} />,
    academic_reporting: <DemoStats stats={[{ label: 'Avg. Grade', value: 'B+' }, { label: 'Pass Rate', value: '91%' }]} />,
    resource_booking: <DemoStats stats={[{ label: 'Rooms', value: '32' }, { label: 'Booked', value: '78%' }]} />,
    // Hospitality
    reservation_system: <DemoTable rows={[['Room 201', 'Occupied', 'John D.'], ['Room 305', 'Reserved', 'Jane S.']]} headers={['Room', 'Status', 'Guest']} />,
    guest_services: <DemoStats stats={[{ label: 'Guests', value: '89' }, { label: 'Rating', value: '4.8' }]} />,
    event_management: <DemoStats stats={[{ label: 'Events', value: '5' }, { label: 'Revenue', value: '$12K' }]} />,
    housekeeping: <DemoTable rows={[['Floor 1', '8/10 clean', '80%'], ['Floor 2', '6/8 clean', '75%']]} headers={['Area', 'Status', 'Complete']} />,
    // Finance
    portfolio_management: <DemoStats stats={[{ label: 'AUM', value: '$2.4M' }, { label: 'Returns', value: '+12%' }]} />,
    risk_assessment: <DemoStats stats={[{ label: 'Risk Score', value: '72' }, { label: 'Alerts', value: '3' }]} />,
    regulatory_reporting: <DemoStats stats={[{ label: 'Reports', value: '12' }, { label: 'Compliant', value: '100%' }]} />,
    audit_trails: <DemoTable rows={[['TXN-001', 'Transfer', '$5,000'], ['TXN-002', 'Deposit', '$12,500']]} headers={['ID', 'Type', 'Amount']} />,
    // Transportation
    fleet_management: <DemoTable rows={[['TRK-001', 'En Route', '85%'], ['VAN-003', 'Available', '100%']]} headers={['Vehicle', 'Status', 'Fuel']} />,
    route_optimization: <DemoStats stats={[{ label: 'Routes', value: '15' }, { label: 'Savings', value: '23%' }]} />,
    driver_management: <DemoStats stats={[{ label: 'Drivers', value: '28' }, { label: 'On Duty', value: '19' }]} />,
    cargo_tracking: <DemoTable rows={[['SHP-4501', 'In Transit', 'Dar-Mwanza'], ['SHP-4502', 'Delivered', 'Dar-Arusha']]} headers={['Shipment', 'Status', 'Route']} />,
    // Construction
    project_management: <DemoTable rows={[['Sunset Tower', '67%', 'On Track'], ['Green Park', '23%', 'Delayed']]} headers={['Project', 'Progress', 'Status']} />,
    resource_planning: <DemoStats stats={[{ label: 'Workers', value: '145' }, { label: 'Equipment', value: '32' }]} />,
    safety_compliance: <DemoStats stats={[{ label: 'Incidents', value: '0' }, { label: 'Days Safe', value: '47' }]} />,
    equipment_tracking: <DemoTable rows={[['Crane #1', 'Active', '320 hrs'], ['Excavator', 'Maintenance', '--']]} headers={['Equipment', 'Status', 'Hours']} />,
    // Agriculture
    crop_management: <DemoTable rows={[['Maize', '50 acres', 'Growing'], ['Wheat', '30 acres', 'Harvest']]} headers={['Crop', 'Area', 'Stage']} />,
    livestock_tracking: <DemoStats stats={[{ label: 'Cattle', value: '230' }, { label: 'Healthy', value: '98%' }]} />,
    weather_monitoring: <DemoStats stats={[{ label: 'Temp', value: '28°C' }, { label: 'Rain', value: '60%' }]} />,
    equipment_scheduling: <DemoStats stats={[{ label: 'Tractors', value: '8' }, { label: 'Available', value: '5' }]} />,
    // Entertainment
    event_planning: <DemoTable rows={[['Music Fest', 'Jul 15', '2,500 seats'], ['Comedy Night', 'Jul 22', '300 seats']]} headers={['Event', 'Date', 'Capacity']} />,
    talent_management: <DemoStats stats={[{ label: 'Artists', value: '45' }, { label: 'Booked', value: '12' }]} />,
    venue_booking: <DemoStats stats={[{ label: 'Venues', value: '8' }, { label: 'Utilization', value: '76%' }]} />,
    ticket_sales: <DemoStats stats={[{ label: 'Sold', value: '3,456' }, { label: 'Revenue', value: '$89K' }]} />,
    // Consulting
    time_tracking: <DemoStats stats={[{ label: 'Billable Hrs', value: '1,240' }, { label: 'Rate', value: '$150/hr' }]} />,
    client_portal: <DemoStats stats={[{ label: 'Clients', value: '34' }, { label: 'Active', value: '28' }]} />,
    knowledge_base: <DemoStats stats={[{ label: 'Articles', value: '156' }, { label: 'Templates', value: '42' }]} />,
    // Real Estate
    property_management: <DemoTable rows={[['Sunset Apt', '3BR/2BA', '$1,200/mo'], ['Ocean View', '2BR/1BA', '$950/mo']]} headers={['Property', 'Type', 'Price']} />,
    client_matching: <DemoStats stats={[{ label: 'Matches', value: '23' }, { label: 'Success', value: '67%' }]} />,
    document_management: <DemoStats stats={[{ label: 'Contracts', value: '89' }, { label: 'Pending', value: '12' }]} />,
    market_analysis: <DemoStats stats={[{ label: 'Avg Price', value: '$245K' }, { label: 'Trend', value: '+5.2%' }]} />,
    // Non-Profit
    donor_management: <DemoTable rows={[['Foundation X', '$50,000', 'Annual'], ['Corp Y', '$25,000', 'Monthly']]} headers={['Donor', 'Amount', 'Frequency']} />,
    volunteer_coordination: <DemoStats stats={[{ label: 'Volunteers', value: '156' }, { label: 'Hours', value: '2,340' }]} />,
    grant_tracking: <DemoStats stats={[{ label: 'Applications', value: '8' }, { label: 'Approved', value: '5' }]} />,
    impact_reporting: <DemoStats stats={[{ label: 'Beneficiaries', value: '4,500' }, { label: 'Programs', value: '12' }]} />,
    // Other / Generic
    custom_workflows: <DemoStats stats={[{ label: 'Workflows', value: '8' }, { label: 'Automated', value: '5' }]} />,
    flexible_categories: <DemoStats stats={[{ label: 'Categories', value: '15' }, { label: 'Products', value: '342' }]} />,
    custom_reporting: <DemoStats stats={[{ label: 'Reports', value: '12' }, { label: 'Scheduled', value: '4' }]} />,
    integration_support: <DemoStats stats={[{ label: 'Integrations', value: '6' }, { label: 'Active', value: '4' }]} />,
    // Technology
    license_management: <DemoStats stats={[{ label: 'Licenses', value: '234' }, { label: 'Expiring', value: '12' }]} />,
    project_tracking: <DemoTable rows={[['App v2.0', 'Sprint 4', '78%'], ['API Update', 'Review', '95%']]} headers={['Project', 'Phase', 'Done']} />,
    support_tickets: <DemoStats stats={[{ label: 'Open', value: '23' }, { label: 'Resolved', value: '156' }]} />,
    asset_management: <DemoStats stats={[{ label: 'Assets', value: '450' }, { label: 'Value', value: '$1.2M' }]} />,
  };

  return demoContent[featureId] || <DemoStats stats={[{ label: 'Status', value: 'Active' }]} />;
}

function DemoTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50">
            {headers.map(h => <th key={h} className="text-left px-3 py-2 font-medium text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t">
              {row.map((cell, j) => <td key={j} className="px-3 py-2 text-foreground">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DemoStats({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="flex gap-6">
      {stats.map(s => (
        <div key={s.label}>
          <p className="text-xs text-muted-foreground">{s.label}</p>
          <p className="text-lg font-bold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
