import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch } from 'lucide-react';

export default function SuperAdminBranches() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Branch Management</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            All Branches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Branch management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
}