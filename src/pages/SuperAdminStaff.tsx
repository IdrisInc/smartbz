import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCog } from 'lucide-react';

export default function SuperAdminStaff() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Staff Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            All Staff Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Staff management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}