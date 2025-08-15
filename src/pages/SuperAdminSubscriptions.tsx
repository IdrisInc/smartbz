import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export default function SuperAdminSubscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Subscription Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            All Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Subscription management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}