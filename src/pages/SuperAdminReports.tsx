import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function SuperAdminReports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Platform Reports</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics & Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Platform reports and analytics coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}