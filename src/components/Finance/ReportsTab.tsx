
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';

export function ReportsTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select defaultValue="monthly">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit & Loss Statement</CardTitle>
            <CardDescription>Current month financial summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Revenue</span>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="font-bold text-green-600">$45,231.89</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Total Expenses</span>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="font-bold text-red-600">$12,234.00</span>
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-lg">Net Profit</span>
                <span className="font-bold text-lg text-green-600">$32,997.89</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tax Summary</CardTitle>
            <CardDescription>Tax obligations and payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Sales Tax Collected</span>
              <span className="font-bold">$2,415.50</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Income Tax Due</span>
              <span className="font-bold">$8,249.47</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Payroll Tax</span>
              <span className="font-bold">$1,890.23</span>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Tax Liability</span>
                <span className="font-bold">$12,555.20</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Analysis</CardTitle>
          <CardDescription>Monthly cash flow breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">$28,450</div>
                <div className="text-sm text-muted-foreground">Cash Inflow</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">$15,230</div>
                <div className="text-sm text-muted-foreground">Cash Outflow</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">$13,220</div>
                <div className="text-sm text-muted-foreground">Net Cash Flow</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
