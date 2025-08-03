
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BusinessSettings } from '@/components/Settings/BusinessSettings';
import { TaxSettings } from '@/components/Settings/TaxSettings';
import { FeatureSettings } from '@/components/Settings/FeatureSettings';
import { UserSettings } from '@/components/Settings/UserSettings';
import { LogsSettings } from '@/components/Settings/LogsSettings';
import { SubscriptionSettings } from '@/components/Settings/SubscriptionSettings';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings & Configuration</h2>
        <p className="text-muted-foreground">
          Configure your business settings and feature preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="tax">Tax & Currency</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessSettings />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionSettings />
        </TabsContent>

        <TabsContent value="tax">
          <TaxSettings />
        </TabsContent>

        <TabsContent value="features">
          <FeatureSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserSettings />
        </TabsContent>

        <TabsContent value="logs">
          <LogsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
