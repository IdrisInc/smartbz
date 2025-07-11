
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function TaxSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>Configure your default currency and formatting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC - Coordinated Universal Time</SelectItem>
                  <SelectItem value="EST">EST - Eastern Standard Time</SelectItem>
                  <SelectItem value="PST">PST - Pacific Standard Time</SelectItem>
                  <SelectItem value="GMT">GMT - Greenwich Mean Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button>Save Currency Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>Set up tax rates and rules for your business</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch id="tax-inclusive" />
            <Label htmlFor="tax-inclusive">Tax Inclusive Pricing</Label>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium">Tax Rates</h4>
              <Button variant="outline" size="sm">Add Tax Rate</Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label>Sales Tax</Label>
                  <p className="text-sm text-muted-foreground">General sales tax</p>
                </div>
                <div className="w-24">
                  <Input placeholder="8.5" />
                </div>
                <div className="text-sm">%</div>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>

              <div className="flex items-center gap-4 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label>Service Tax</Label>
                  <p className="text-sm text-muted-foreground">Tax on services</p>
                </div>
                <div className="w-24">
                  <Input placeholder="5.0" />
                </div>
                <div className="text-sm">%</div>
                <Button variant="ghost" size="sm">Remove</Button>
              </div>
            </div>
          </div>

          <Button>Save Tax Settings</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Settings</CardTitle>
          <CardDescription>Configure invoice numbering and templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="invoice-prefix">Invoice Prefix</Label>
              <Input id="invoice-prefix" placeholder="INV-" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next-number">Next Invoice Number</Label>
              <Input id="next-number" type="number" placeholder="1001" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-terms">Default Payment Terms</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select payment terms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Due Immediately</SelectItem>
                <SelectItem value="net15">Net 15 Days</SelectItem>
                <SelectItem value="net30">Net 30 Days</SelectItem>
                <SelectItem value="net60">Net 60 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button>Save Invoice Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
