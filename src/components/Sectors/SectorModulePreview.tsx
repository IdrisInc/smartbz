import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingCart, Users, Calendar, Truck, Stethoscope, BookOpen,
  Building, Tractor, Palette, Briefcase, Heart, BarChart3,
  Package, DollarSign, Clock, MapPin, Shield, Wrench
} from 'lucide-react';
import { SectorConfiguration } from '@/config/sectorConfigurations';

interface SectorModulePreviewProps {
  sectorId: string;
  config: SectorConfiguration;
}

const sectorModules: Record<string, { title: string; description: string; icon: React.ElementType; items: { label: string; value: string; progress?: number }[] }[]> = {
  retail: [
    { title: 'Point of Sale', description: 'Fast checkout & payment processing', icon: ShoppingCart, items: [
      { label: 'Today\'s Transactions', value: '147', progress: 73 },
      { label: 'Average Basket', value: '$42.50' },
      { label: 'Returns Today', value: '3' },
    ]},
    { title: 'Customer Loyalty', description: 'Rewards & retention programs', icon: Users, items: [
      { label: 'Active Members', value: '2,450' },
      { label: 'Points Redeemed', value: '12,340', progress: 45 },
      { label: 'New Sign-ups', value: '28' },
    ]},
  ],
  manufacturing: [
    { title: 'Production Floor', description: 'Real-time production monitoring', icon: Package, items: [
      { label: 'Active Batches', value: '8', progress: 67 },
      { label: 'Quality Pass Rate', value: '97.3%', progress: 97 },
      { label: 'Machine Utilization', value: '89%', progress: 89 },
    ]},
    { title: 'Supply Chain', description: 'Raw material & supplier tracking', icon: Truck, items: [
      { label: 'Pending Orders', value: '12' },
      { label: 'On-Time Delivery', value: '94%', progress: 94 },
      { label: 'Low Stock Alerts', value: '5' },
    ]},
  ],
  healthcare: [
    { title: 'Appointments', description: 'Patient scheduling & management', icon: Calendar, items: [
      { label: 'Today\'s Appointments', value: '34' },
      { label: 'Wait Time Avg.', value: '12 min' },
      { label: 'No-Shows', value: '2' },
    ]},
    { title: 'Patient Care', description: 'Records & treatment tracking', icon: Stethoscope, items: [
      { label: 'Active Patients', value: '1,247' },
      { label: 'Prescriptions Today', value: '67' },
      { label: 'Lab Results Pending', value: '8' },
    ]},
  ],
  education: [
    { title: 'Student Portal', description: 'Enrollment & academic tracking', icon: BookOpen, items: [
      { label: 'Enrolled Students', value: '456' },
      { label: 'Attendance Rate', value: '94%', progress: 94 },
      { label: 'Avg. Grade', value: 'B+' },
    ]},
    { title: 'Course Management', description: 'Scheduling & curriculum', icon: Calendar, items: [
      { label: 'Active Courses', value: '24' },
      { label: 'This Week Classes', value: '96' },
      { label: 'Room Utilization', value: '78%', progress: 78 },
    ]},
  ],
  hospitality: [
    { title: 'Reservations', description: 'Room & table booking system', icon: Calendar, items: [
      { label: 'Occupancy Rate', value: '87%', progress: 87 },
      { label: 'Check-ins Today', value: '23' },
      { label: 'Check-outs', value: '18' },
    ]},
    { title: 'Guest Services', description: 'Requests & satisfaction', icon: Users, items: [
      { label: 'Active Guests', value: '89' },
      { label: 'Service Requests', value: '12' },
      { label: 'Satisfaction', value: '4.8/5' },
    ]},
  ],
  finance: [
    { title: 'Portfolio Overview', description: 'Client investment management', icon: DollarSign, items: [
      { label: 'Total AUM', value: '$2.4M' },
      { label: 'Active Portfolios', value: '156' },
      { label: 'YTD Returns', value: '+12.3%', progress: 62 },
    ]},
    { title: 'Compliance', description: 'Regulatory & audit tracking', icon: Shield, items: [
      { label: 'Compliance Score', value: '98%', progress: 98 },
      { label: 'Pending Reviews', value: '3' },
      { label: 'Next Audit', value: '15 days' },
    ]},
  ],
  transportation: [
    { title: 'Fleet Status', description: 'Vehicle tracking & management', icon: Truck, items: [
      { label: 'Vehicles Active', value: '19/28' },
      { label: 'Fuel Efficiency', value: '8.2 km/L' },
      { label: 'Maintenance Due', value: '4' },
    ]},
    { title: 'Deliveries', description: 'Shipment & route tracking', icon: MapPin, items: [
      { label: 'In Transit', value: '34' },
      { label: 'On-Time Rate', value: '92%', progress: 92 },
      { label: 'Completed Today', value: '67' },
    ]},
  ],
  construction: [
    { title: 'Project Tracker', description: 'Active construction projects', icon: Building, items: [
      { label: 'Active Projects', value: '5' },
      { label: 'Overall Progress', value: '58%', progress: 58 },
      { label: 'Budget Used', value: '45%', progress: 45 },
    ]},
    { title: 'Safety Dashboard', description: 'Compliance & incidents', icon: Shield, items: [
      { label: 'Safe Days', value: '47' },
      { label: 'Incidents MTD', value: '0' },
      { label: 'Inspections Due', value: '2' },
    ]},
  ],
  agriculture: [
    { title: 'Farm Overview', description: 'Crops & livestock status', icon: Tractor, items: [
      { label: 'Active Crops', value: '6 types' },
      { label: 'Livestock Count', value: '230' },
      { label: 'Harvest Ready', value: '2 fields', progress: 80 },
    ]},
    { title: 'Weather & Planning', description: 'Seasonal planning tools', icon: Calendar, items: [
      { label: 'Temperature', value: '28°C' },
      { label: 'Rain Probability', value: '60%' },
      { label: 'Next Planting', value: '12 days' },
    ]},
  ],
  entertainment: [
    { title: 'Event Manager', description: 'Upcoming events & bookings', icon: Palette, items: [
      { label: 'Upcoming Events', value: '8' },
      { label: 'Tickets Sold', value: '3,456' },
      { label: 'Revenue MTD', value: '$89K' },
    ]},
    { title: 'Venue & Talent', description: 'Resource management', icon: Users, items: [
      { label: 'Venues Booked', value: '6/8' },
      { label: 'Artists Lined Up', value: '12' },
      { label: 'Crew Assigned', value: '45' },
    ]},
  ],
  consulting: [
    { title: 'Project Pipeline', description: 'Active engagements', icon: Briefcase, items: [
      { label: 'Active Projects', value: '12' },
      { label: 'Utilization Rate', value: '85%', progress: 85 },
      { label: 'Pipeline Value', value: '$340K' },
    ]},
    { title: 'Time & Billing', description: 'Billable hours tracking', icon: Clock, items: [
      { label: 'Billable Hours MTD', value: '1,240' },
      { label: 'Average Rate', value: '$150/hr' },
      { label: 'Invoiced MTD', value: '$186K' },
    ]},
  ],
  real_estate: [
    { title: 'Listings', description: 'Active property listings', icon: Building, items: [
      { label: 'Active Listings', value: '34' },
      { label: 'Avg. Days on Market', value: '28' },
      { label: 'Viewings Scheduled', value: '12' },
    ]},
    { title: 'Transactions', description: 'Sales & rental closings', icon: DollarSign, items: [
      { label: 'Closed MTD', value: '8' },
      { label: 'Avg. Sale Price', value: '$245K' },
      { label: 'Commission Earned', value: '$58K' },
    ]},
  ],
  non_profit: [
    { title: 'Fundraising', description: 'Donations & campaigns', icon: Heart, items: [
      { label: 'Total Raised MTD', value: '$125K' },
      { label: 'Active Donors', value: '340' },
      { label: 'Campaign Progress', value: '67%', progress: 67 },
    ]},
    { title: 'Programs', description: 'Impact & volunteer tracking', icon: Users, items: [
      { label: 'Beneficiaries', value: '4,500' },
      { label: 'Volunteer Hours', value: '2,340' },
      { label: 'Active Programs', value: '12' },
    ]},
  ],
  technology: [
    { title: 'Dev Projects', description: 'Software development tracker', icon: BarChart3, items: [
      { label: 'Active Sprints', value: '4' },
      { label: 'Open Tickets', value: '23' },
      { label: 'Deployment Success', value: '99.2%', progress: 99 },
    ]},
    { title: 'IT Assets', description: 'Hardware & license management', icon: Wrench, items: [
      { label: 'Total Assets', value: '450' },
      { label: 'Licenses Expiring', value: '12' },
      { label: 'System Uptime', value: '99.9%', progress: 99 },
    ]},
  ],
  other: [
    { title: 'Business Overview', description: 'General business metrics', icon: BarChart3, items: [
      { label: 'Total Revenue', value: '$125K' },
      { label: 'Customers', value: '342' },
      { label: 'Growth', value: '+15%', progress: 65 },
    ]},
    { title: 'Operations', description: 'Day-to-day management', icon: Package, items: [
      { label: 'Products/Services', value: '89' },
      { label: 'Active Orders', value: '34' },
      { label: 'Fulfillment Rate', value: '96%', progress: 96 },
    ]},
  ],
};

export function SectorModulePreview({ sectorId, config }: SectorModulePreviewProps) {
  const modules = sectorModules[sectorId] || sectorModules.other;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {modules.map((module) => {
        const ModuleIcon = module.icon;
        return (
          <Card key={module.title} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ModuleIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{module.title}</CardTitle>
                  <CardDescription className="text-xs">{module.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {module.items.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <span className="text-sm font-semibold text-foreground">{item.value}</span>
                    </div>
                    {item.progress !== undefined && (
                      <Progress value={item.progress} className="h-1.5" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
