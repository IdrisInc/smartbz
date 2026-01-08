import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FeatureConfig {
  id: string;
  feature_key: string;
  feature_name: string;
  description: string | null;
  category: string;
  free_enabled: boolean;
  basic_enabled: boolean;
  premium_enabled: boolean;
  enterprise_enabled: boolean;
}

export function FeatureConfigTab() {
  const [features, setFeatures] = useState<FeatureConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newFeature, setNewFeature] = useState({
    feature_key: '',
    feature_name: '',
    description: '',
    category: 'general',
    free_enabled: false,
    basic_enabled: false,
    premium_enabled: true,
    enterprise_enabled: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchFeatures();
  }, []);

  const fetchFeatures = async () => {
    try {
      const { data, error } = await supabase
        .from('feature_configs')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setFeatures(data || []);
    } catch (error) {
      console.error('Error fetching features:', error);
      toast({
        title: "Error",
        description: "Failed to load feature configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = async (featureId: string, updates: Partial<FeatureConfig>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('feature_configs')
        .update(updates)
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.map(f => 
        f.id === featureId ? { ...f, ...updates } : f
      ));

      toast({
        title: "Updated",
        description: "Feature configuration updated",
      });
    } catch (error) {
      console.error('Error updating feature:', error);
      toast({
        title: "Error",
        description: "Failed to update feature",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addFeature = async () => {
    if (!newFeature.feature_key || !newFeature.feature_name) {
      toast({
        title: "Error",
        description: "Please fill in required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('feature_configs')
        .insert(newFeature)
        .select()
        .single();

      if (error) throw error;

      setFeatures(prev => [...prev, data]);
      setNewFeature({
        feature_key: '',
        feature_name: '',
        description: '',
        category: 'general',
        free_enabled: false,
        basic_enabled: false,
        premium_enabled: true,
        enterprise_enabled: true,
      });
      setIsAddDialogOpen(false);

      toast({
        title: "Success",
        description: "Feature added successfully",
      });
    } catch (error) {
      console.error('Error adding feature:', error);
      toast({
        title: "Error",
        description: "Failed to add feature",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return;

    try {
      const { error } = await supabase
        .from('feature_configs')
        .delete()
        .eq('id', featureId);

      if (error) throw error;

      setFeatures(prev => prev.filter(f => f.id !== featureId));
      toast({
        title: "Deleted",
        description: "Feature deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast({
        title: "Error",
        description: "Failed to delete feature",
        variant: "destructive",
      });
    }
  };

  const categories = [...new Set(features.map(f => f.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Feature Configuration</h2>
          <p className="text-muted-foreground">
            Configure which features are available for each subscription plan
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Feature
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Feature</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Feature Key *</Label>
                <Input
                  value={newFeature.feature_key}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, feature_key: e.target.value }))}
                  placeholder="e.g., advanced_analytics"
                />
              </div>
              <div className="space-y-2">
                <Label>Feature Name *</Label>
                <Input
                  value={newFeature.feature_name}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, feature_name: e.target.value }))}
                  placeholder="e.g., Advanced Analytics"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Feature description..."
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newFeature.category}
                  onValueChange={(value) => setNewFeature(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="hr">HR</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="operations">Operations</SelectItem>
                    <SelectItem value="reporting">Reporting</SelectItem>
                    <SelectItem value="integrations">Integrations</SelectItem>
                    <SelectItem value="security">Security</SelectItem>
                    <SelectItem value="customization">Customization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label>Free</Label>
                  <Switch
                    checked={newFeature.free_enabled}
                    onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, free_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Basic</Label>
                  <Switch
                    checked={newFeature.basic_enabled}
                    onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, basic_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Premium</Label>
                  <Switch
                    checked={newFeature.premium_enabled}
                    onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, premium_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enterprise</Label>
                  <Switch
                    checked={newFeature.enterprise_enabled}
                    onCheckedChange={(checked) => setNewFeature(prev => ({ ...prev, enterprise_enabled: checked }))}
                  />
                </div>
              </div>
              <Button onClick={addFeature} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Feature
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Features by Category */}
      {categories.map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="capitalize">{category}</CardTitle>
            <CardDescription>
              {features.filter(f => f.category === category).length} features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">Feature</TableHead>
                    <TableHead className="text-center w-20">Free</TableHead>
                    <TableHead className="text-center w-20">Basic</TableHead>
                    <TableHead className="text-center w-20">Premium</TableHead>
                    <TableHead className="text-center w-20">Enterprise</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features
                    .filter(f => f.category === category)
                    .map(feature => (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{feature.feature_name}</p>
                            <p className="text-xs text-muted-foreground">{feature.feature_key}</p>
                            {feature.description && (
                              <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={feature.free_enabled}
                            onCheckedChange={(checked) => updateFeature(feature.id, { free_enabled: checked })}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={feature.basic_enabled}
                            onCheckedChange={(checked) => updateFeature(feature.id, { basic_enabled: checked })}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={feature.premium_enabled}
                            onCheckedChange={(checked) => updateFeature(feature.id, { premium_enabled: checked })}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Switch
                            checked={feature.enterprise_enabled}
                            onCheckedChange={(checked) => updateFeature(feature.id, { enterprise_enabled: checked })}
                            disabled={saving}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFeature(feature.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Plan Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Plan Feature Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {['free', 'basic', 'premium', 'enterprise'].map(plan => {
              const planKey = `${plan}_enabled` as keyof FeatureConfig;
              const enabledCount = features.filter(f => f[planKey]).length;
              return (
                <Card key={plan} className="bg-muted/30">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold capitalize mb-2">{plan}</h4>
                    <p className="text-3xl font-bold text-primary">{enabledCount}</p>
                    <p className="text-sm text-muted-foreground">features enabled</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
