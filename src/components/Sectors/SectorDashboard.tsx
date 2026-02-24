import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSectorFeatures } from '@/hooks/useSectorFeatures';
import { SectorModulePreview } from '@/components/Sectors/SectorModulePreview';
import { 
  TrendingUp, Users, Package, DollarSign, Activity,
  Calendar, Target, BarChart3, CheckCircle2
} from 'lucide-react';

const getMetricIcon = (metric: string) => {
  const lowerMetric = metric.toLowerCase();
  if (lowerMetric.includes('sales') || lowerMetric.includes('revenue')) return DollarSign;
  if (lowerMetric.includes('customer') || lowerMetric.includes('patient') || lowerMetric.includes('student')) return Users;
  if (lowerMetric.includes('product') || lowerMetric.includes('inventory') || lowerMetric.includes('stock')) return Package;
  if (lowerMetric.includes('performance') || lowerMetric.includes('efficiency') || lowerMetric.includes('rate')) return TrendingUp;
  if (lowerMetric.includes('activity') || lowerMetric.includes('utilization')) return Activity;
  if (lowerMetric.includes('appointment') || lowerMetric.includes('booking') || lowerMetric.includes('schedule')) return Calendar;
  if (lowerMetric.includes('goal') || lowerMetric.includes('target')) return Target;
  return BarChart3;
};

export function SectorDashboard() {
  const { sectorConfig, features, getDashboardMetrics, isSectorSpecific } = useSectorFeatures();

  if (!isSectorSpecific) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>General Business Dashboard</CardTitle>
          <CardDescription>
            Your organization is set to "Other" sector. Configure a specific business sector to unlock industry-specific features and metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Go to Settings → Business Information to select your industry sector and access tailored functionality.
          </p>
        </CardContent>
      </Card>
    );
  }

  const metrics = getDashboardMetrics();
  const sectorId = sectorConfig.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{sectorConfig.name} Dashboard</h2>
          <p className="text-muted-foreground">
            Industry-specific metrics and insights for your {sectorConfig.name.toLowerCase()} business
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {features.length} Active Features
        </Badge>
      </div>

      {/* Sector-Specific Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.slice(0, 4).map((metric) => {
          const Icon = getMetricIcon(metric);
          return (
            <Card key={metric}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">--</div>
                <p className="text-xs text-muted-foreground">Sector-specific metric</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sector Module Previews */}
      <SectorModulePreview sectorId={sectorId} config={sectorConfig} />

      {/* Active Features */}
      <Card>
        <CardHeader>
          <CardTitle>Active {sectorConfig.name} Features</CardTitle>
          <CardDescription>Industry-specific features enabled for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.id} className="flex items-start space-x-3 rounded-lg border p-3">
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium leading-none">{feature.name}</p>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Sector Metrics */}
      {metrics.length > 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional {sectorConfig.name} Metrics</CardTitle>
            <CardDescription>Extended metrics specific to your industry</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {metrics.slice(4).map((metric) => {
                const Icon = getMetricIcon(metric);
                return (
                  <div key={metric} className="flex items-center space-x-2 rounded-lg border p-3">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{metric}</p>
                      <p className="text-lg font-bold">--</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
