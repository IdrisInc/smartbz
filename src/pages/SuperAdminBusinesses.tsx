import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function SuperAdminBusinesses() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Business Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            All Businesses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Business management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}