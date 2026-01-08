import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Loader2, Plus, Trash2, Edit, ChevronDown, ChevronRight, 
  LayoutDashboard, ShoppingCart, Package, DollarSign, Users, 
  UserCircle, BarChart3, Settings, Save
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ModuleConfig {
  id: string;
  module_key: string;
  module_name: string;
  description: string | null;
  parent_module_id: string | null;
  icon: string | null;
  display_order: number;
  free_enabled: boolean;
  basic_enabled: boolean;
  premium_enabled: boolean;
  enterprise_enabled: boolean;
  is_active: boolean;
  children?: ModuleConfig[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  Users,
  UserCircle,
  BarChart3,
  Settings,
};

export function ModuleConfigTab() {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleConfig | null>(null);
  const [formData, setFormData] = useState({
    module_key: '',
    module_name: '',
    description: '',
    parent_module_id: '',
    icon: '',
    display_order: 0,
    free_enabled: false,
    basic_enabled: false,
    premium_enabled: true,
    enterprise_enabled: true,
  });
  
  const { toast } = useToast();

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const { data, error } = await supabase
        .from('module_configs')
        .select('*')
        .order('display_order');

      if (error) throw error;

      // Organize into parent-child hierarchy
      const moduleMap = new Map<string, ModuleConfig>();
      const rootModules: ModuleConfig[] = [];

      data?.forEach(module => {
        moduleMap.set(module.id, { ...module, children: [] });
      });

      data?.forEach(module => {
        const moduleWithChildren = moduleMap.get(module.id)!;
        if (module.parent_module_id) {
          const parent = moduleMap.get(module.parent_module_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(moduleWithChildren);
          }
        } else {
          rootModules.push(moduleWithChildren);
        }
      });

      setModules(rootModules);
      // Expand all by default
      setExpandedModules(new Set(rootModules.map(m => m.id)));
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Error",
        description: "Failed to load module configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateModule = async (moduleId: string, updates: Partial<ModuleConfig>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('module_configs')
        .update(updates)
        .eq('id', moduleId);

      if (error) throw error;

      // Update local state
      const updateModuleInTree = (modules: ModuleConfig[]): ModuleConfig[] => {
        return modules.map(m => {
          if (m.id === moduleId) {
            return { ...m, ...updates };
          }
          if (m.children) {
            return { ...m, children: updateModuleInTree(m.children) };
          }
          return m;
        });
      };

      setModules(updateModuleInTree(modules));
      toast({ title: "Updated", description: "Module configuration saved" });
    } catch (error) {
      console.error('Error updating module:', error);
      toast({ title: "Error", description: "Failed to update module", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.module_key || !formData.module_name) {
      toast({ title: "Error", description: "Please fill in required fields", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        parent_module_id: formData.parent_module_id || null,
      };

      if (editingModule) {
        const { error } = await supabase
          .from('module_configs')
          .update(submitData)
          .eq('id', editingModule.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('module_configs')
          .insert(submitData);

        if (error) throw error;
      }

      await fetchModules();
      setIsAddDialogOpen(false);
      setEditingModule(null);
      resetForm();
      toast({ title: "Success", description: editingModule ? "Module updated" : "Module added" });
    } catch (error) {
      console.error('Error saving module:', error);
      toast({ title: "Error", description: "Failed to save module", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('Are you sure? This will also delete all subsystems.')) return;

    try {
      const { error } = await supabase
        .from('module_configs')
        .delete()
        .eq('id', moduleId);

      if (error) throw error;

      await fetchModules();
      toast({ title: "Deleted", description: "Module deleted successfully" });
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({ title: "Error", description: "Failed to delete module", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setFormData({
      module_key: '',
      module_name: '',
      description: '',
      parent_module_id: '',
      icon: '',
      display_order: 0,
      free_enabled: false,
      basic_enabled: false,
      premium_enabled: true,
      enterprise_enabled: true,
    });
  };

  const openEditDialog = (module: ModuleConfig) => {
    setEditingModule(module);
    setFormData({
      module_key: module.module_key,
      module_name: module.module_name,
      description: module.description || '',
      parent_module_id: module.parent_module_id || '',
      icon: module.icon || '',
      display_order: module.display_order,
      free_enabled: module.free_enabled,
      basic_enabled: module.basic_enabled,
      premium_enabled: module.premium_enabled,
      enterprise_enabled: module.enterprise_enabled,
    });
    setIsAddDialogOpen(true);
  };

  const toggleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const getAllModulesFlat = (): ModuleConfig[] => {
    const flat: ModuleConfig[] = [];
    modules.forEach(m => {
      flat.push(m);
    });
    return flat;
  };

  const renderModuleRow = (module: ModuleConfig, isChild = false) => {
    const IconComponent = module.icon ? iconMap[module.icon] : null;
    const hasChildren = module.children && module.children.length > 0;
    const isExpanded = expandedModules.has(module.id);

    return (
      <React.Fragment key={module.id}>
        <TableRow className={isChild ? 'bg-muted/30' : ''}>
          <TableCell>
            <div className="flex items-center gap-2">
              {!isChild && hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-6 w-6"
                  onClick={() => toggleExpanded(module.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              )}
              {isChild && <div className="w-6 ml-4" />}
              {IconComponent && <IconComponent className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="font-medium">{module.module_name}</p>
                <p className="text-xs text-muted-foreground">{module.module_key}</p>
              </div>
            </div>
          </TableCell>
          <TableCell className="max-w-[200px]">
            <p className="text-sm text-muted-foreground truncate">{module.description}</p>
          </TableCell>
          <TableCell className="text-center">
            <Switch
              checked={module.free_enabled}
              onCheckedChange={(checked) => updateModule(module.id, { free_enabled: checked })}
              disabled={saving}
            />
          </TableCell>
          <TableCell className="text-center">
            <Switch
              checked={module.basic_enabled}
              onCheckedChange={(checked) => updateModule(module.id, { basic_enabled: checked })}
              disabled={saving}
            />
          </TableCell>
          <TableCell className="text-center">
            <Switch
              checked={module.premium_enabled}
              onCheckedChange={(checked) => updateModule(module.id, { premium_enabled: checked })}
              disabled={saving}
            />
          </TableCell>
          <TableCell className="text-center">
            <Switch
              checked={module.enterprise_enabled}
              onCheckedChange={(checked) => updateModule(module.id, { enterprise_enabled: checked })}
              disabled={saving}
            />
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEditDialog(module)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => deleteModule(module.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </TableCell>
        </TableRow>
        {hasChildren && isExpanded && module.children?.map(child => renderModuleRow(child, true))}
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Calculate plan totals
  const countEnabled = (plan: 'free' | 'basic' | 'premium' | 'enterprise') => {
    let count = 0;
    const countInTree = (mods: ModuleConfig[]) => {
      mods.forEach(m => {
        if (m[`${plan}_enabled`]) count++;
        if (m.children) countInTree(m.children);
      });
    };
    countInTree(modules);
    return count;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Module Configuration</h2>
          <p className="text-muted-foreground">
            Configure modules and subsystems available for each subscription plan
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setEditingModule(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingModule ? 'Edit Module' : 'Add New Module'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Module Key *</Label>
                <Input
                  value={formData.module_key}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_key: e.target.value }))}
                  placeholder="e.g., sales_pos"
                />
              </div>
              <div className="space-y-2">
                <Label>Module Name *</Label>
                <Input
                  value={formData.module_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, module_name: e.target.value }))}
                  placeholder="e.g., Point of Sale"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Module description..."
                />
              </div>
              <div className="space-y-2">
                <Label>Parent Module (for subsystems)</Label>
                <Select
                  value={formData.parent_module_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, parent_module_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (root module)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (root module)</SelectItem>
                    {getAllModulesFlat().map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.module_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Icon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select icon" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(iconMap).map(icon => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Free</Label>
                  <Switch
                    checked={formData.free_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, free_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Basic</Label>
                  <Switch
                    checked={formData.basic_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, basic_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Premium</Label>
                  <Switch
                    checked={formData.premium_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, premium_enabled: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Enterprise</Label>
                  <Switch
                    checked={formData.enterprise_enabled}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enterprise_enabled: checked }))}
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full">
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingModule ? 'Update Module' : 'Add Module'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Plan Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(['free', 'basic', 'premium', 'enterprise'] as const).map(plan => (
          <Card key={plan} className="bg-muted/30">
            <CardContent className="pt-4">
              <h4 className="font-semibold capitalize mb-2">{plan} Plan</h4>
              <p className="text-3xl font-bold text-primary">{countEnabled(plan)}</p>
              <p className="text-sm text-muted-foreground">modules enabled</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modules Table */}
      <Card>
        <CardHeader>
          <CardTitle>Modules & Subsystems</CardTitle>
          <CardDescription>
            Manage which modules and features are available in each subscription plan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[250px]">Module</TableHead>
                  <TableHead className="min-w-[150px]">Description</TableHead>
                  <TableHead className="text-center w-20">Free</TableHead>
                  <TableHead className="text-center w-20">Basic</TableHead>
                  <TableHead className="text-center w-20">Premium</TableHead>
                  <TableHead className="text-center w-20">Enterprise</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {modules.map(module => renderModuleRow(module))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
