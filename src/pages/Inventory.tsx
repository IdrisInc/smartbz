
import React, { useState } from 'react';
import { Plus, Search, Package, TrendingDown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseOrderForm } from '@/components/Inventory/PurchaseOrderForm';

const mockInventory = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    sku: 'IPH15P-001',
    currentStock: 15,
    minStock: 10,
    maxStock: 50,
    location: 'A1-B2',
    lastPurchase: '2024-01-10',
    avgCost: 850.00,
    serialNumbers: ['IPH001', 'IPH002', 'IPH003']
  },
  {
    id: 2,
    name: 'Office Bundle',
    sku: 'BUNDLE-001',
    currentStock: 5,
    minStock: 10,
    maxStock: 30,
    location: 'B2-C1',
    lastPurchase: '2024-01-12',
    avgCost: 250.00,
    serialNumbers: []
  }
];

export default function Inventory() {
  const [showPOForm, setShowPOForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Purchases & Inventory</h2>
          <p className="text-muted-foreground">
            Manage inventory levels, purchase orders, and stock movements
          </p>
        </div>
        <Button onClick={() => setShowPOForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Purchase Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">Active inventory items</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">12</div>
            <p className="text-xs text-muted-foreground">Need reordering</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,430</div>
            <p className="text-xs text-muted-foreground">Total stock value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">Purchase orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="space-y-4">
        {mockInventory.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <CardDescription>SKU: {item.sku} | Location: {item.location}</CardDescription>
                </div>
                <Badge 
                  variant={item.currentStock <= item.minStock ? 'destructive' : 'default'}
                >
                  {item.currentStock <= item.minStock ? 'Low Stock' : 'In Stock'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Current Stock</div>
                  <div className="text-lg font-semibold">{item.currentStock}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Min/Max Stock</div>
                  <div className="text-lg">{item.minStock}/{item.maxStock}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Avg Cost</div>
                  <div className="text-lg font-semibold">${item.avgCost}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Last Purchase</div>
                  <div className="text-lg">{item.lastPurchase}</div>
                </div>
              </div>
              {item.serialNumbers.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm text-muted-foreground mb-2">Serial Numbers:</div>
                  <div className="flex flex-wrap gap-1">
                    {item.serialNumbers.map((serial) => (
                      <Badge key={serial} variant="outline" className="text-xs">
                        {serial}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showPOForm && (
        <PurchaseOrderForm onClose={() => setShowPOForm(false)} />
      )}
    </div>
  );
}
