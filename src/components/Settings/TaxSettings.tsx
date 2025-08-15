
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export function TaxSettings() {
  const [taxSettings, setTaxSettings] = useState({
    defaultTaxRate: '8.5',
    taxInclusive: false,
    currency: 'USD',
    currencySymbol: '$',
    decimalPlaces: 2
  });

  const handleSave = () => {
    console.log('Saving tax settings:', taxSettings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tax Configuration</CardTitle>
          <CardDescription>
            Set up tax rates and currency preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="defaultTaxRate">Default Tax Rate (%)</Label>
              <Input
                id="defaultTaxRate"
                type="number"
                step="0.1"
                value={taxSettings.defaultTaxRate}
                onChange={(e) => setTaxSettings({...taxSettings, defaultTaxRate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={taxSettings.currency} onValueChange={(value) => setTaxSettings({...taxSettings, currency: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="CAD">Canadian Dollar (CAD)</SelectItem>
                  <SelectItem value="TZS">Tanzanian Shilling (TZS)</SelectItem>
                  <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="UGX">Ugandan Shilling (UGX)</SelectItem>
                  <SelectItem value="RWF">Rwandan Franc (RWF)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="taxInclusive"
              checked={taxSettings.taxInclusive}
              onCheckedChange={(checked) => setTaxSettings({...taxSettings, taxInclusive: checked})}
            />
            <Label htmlFor="taxInclusive">Tax Inclusive Pricing</Label>
          </div>

          <Button onClick={handleSave}>Save Tax Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
}
