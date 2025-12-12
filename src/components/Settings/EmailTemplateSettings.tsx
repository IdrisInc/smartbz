import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, Mail, ShoppingCart, Package, Eye, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const templateSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200, "Subject must be less than 200 characters"),
  header_text: z.string().max(500, "Header text must be less than 500 characters").optional(),
  footer_text: z.string().max(500, "Footer text must be less than 500 characters").optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  custom_message: z.string().max(1000, "Custom message must be less than 1000 characters").optional(),
});

interface EmailTemplate {
  id?: string;
  template_type: string;
  subject: string;
  header_text: string;
  footer_text: string;
  primary_color: string;
  logo_url: string;
  show_business_details: boolean;
  show_items_table: boolean;
  custom_message: string;
  is_active: boolean;
}

const defaultTemplates: Record<string, Omit<EmailTemplate, 'id'>> = {
  sale_confirmation: {
    template_type: 'sale_confirmation',
    subject: 'Receipt for your purchase - {{sale_number}}',
    header_text: 'Thank you for your purchase!',
    footer_text: 'If you have any questions about this transaction, please contact us.',
    primary_color: '#3b82f6',
    logo_url: '',
    show_business_details: true,
    show_items_table: true,
    custom_message: '',
    is_active: true
  },
  purchase_order: {
    template_type: 'purchase_order',
    subject: 'Purchase Order {{po_number}} from {{business_name}}',
    header_text: 'Please find below the details of our purchase order:',
    footer_text: 'Please confirm receipt of this order.',
    primary_color: '#10b981',
    logo_url: '',
    show_business_details: true,
    show_items_table: true,
    custom_message: '',
    is_active: true
  }
};

export function EmailTemplateSettings() {
  const [templates, setTemplates] = useState<Record<string, EmailTemplate>>({});
  const [activeTemplate, setActiveTemplate] = useState('sale_confirmation');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchTemplates();
    }
  }, [currentOrganization]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;

      const templateMap: Record<string, EmailTemplate> = {};
      
      // Initialize with defaults
      Object.keys(defaultTemplates).forEach(key => {
        templateMap[key] = { ...defaultTemplates[key] };
      });

      // Override with saved templates
      data?.forEach((template: any) => {
        templateMap[template.template_type] = template;
      });

      setTemplates(templateMap);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: "Error",
        description: "Failed to load email templates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const template = templates[activeTemplate];
    
    // Validate
    const result = templateSchema.safeParse(template);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const templateData = {
        organization_id: currentOrganization?.id,
        template_type: activeTemplate,
        subject: template.subject,
        header_text: template.header_text || null,
        footer_text: template.footer_text || null,
        primary_color: template.primary_color,
        logo_url: template.logo_url || null,
        show_business_details: template.show_business_details,
        show_items_table: template.show_items_table,
        custom_message: template.custom_message || null,
        is_active: template.is_active
      };

      if (template.id) {
        const { error } = await supabase
          .from('email_templates')
          .update(templateData)
          .eq('id', template.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('email_templates')
          .insert(templateData)
          .select()
          .single();
        if (error) throw error;
        
        setTemplates(prev => ({
          ...prev,
          [activeTemplate]: { ...prev[activeTemplate], id: data.id }
        }));
      }

      toast({
        title: "Template Saved",
        description: "Your email template has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Error",
        description: "Failed to save email template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (field: keyof EmailTemplate, value: any) => {
    setTemplates(prev => ({
      ...prev,
      [activeTemplate]: {
        ...prev[activeTemplate],
        [field]: value
      }
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const currentTemplate = templates[activeTemplate] || defaultTemplates[activeTemplate];

  const renderPreview = () => {
    const template = currentTemplate;
    return (
      <div className="border rounded-lg bg-background p-4 max-h-[500px] overflow-auto">
        <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '600px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0', 
            borderBottom: `2px solid ${template.primary_color}` 
          }}>
            {template.logo_url && (
              <img src={template.logo_url} alt="Logo" style={{ maxHeight: '60px', marginBottom: '10px' }} />
            )}
            <h1 style={{ margin: 0, color: template.primary_color }}>
              {currentOrganization?.name || 'Your Business'}
            </h1>
            {template.show_business_details && (
              <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                123 Business St, City • (555) 123-4567
              </p>
            )}
          </div>
          
          {/* Content */}
          <div style={{ padding: '20px 0' }}>
            <h2 style={{ color: '#333' }}>{template.header_text || 'Email Header'}</h2>
            
            {template.custom_message && (
              <p style={{ color: '#666', marginBottom: '20px' }}>{template.custom_message}</p>
            )}
            
            <p><strong>Reference:</strong> #12345</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
            
            {template.show_items_table && (
              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '20px 0' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Item</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Qty</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Price</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>Sample Product</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'center' }}>2</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>$25.00</td>
                    <td style={{ padding: '8px', borderBottom: '1px solid #eee', textAlign: 'right' }}>$50.00</td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', backgroundColor: '#f9f9f9' }}>
                    <td colSpan={3} style={{ padding: '12px 8px', textAlign: 'right' }}>Total:</td>
                    <td style={{ padding: '12px 8px', textAlign: 'right' }}>$50.00</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer */}
          <div style={{ 
            textAlign: 'center', 
            padding: '20px 0', 
            borderTop: '1px solid #eee',
            color: '#666',
            fontSize: '12px'
          }}>
            <p>{template.footer_text || 'Thank you for your business!'}</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Templates
              </CardTitle>
              <CardDescription>
                Customize the emails sent to customers and suppliers
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                <Eye className="h-4 w-4 mr-2" />
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Template
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTemplate} onValueChange={setActiveTemplate}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sale_confirmation" className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Sale Confirmation
              </TabsTrigger>
              <TabsTrigger value="purchase_order" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Purchase Order
              </TabsTrigger>
            </TabsList>

            <div className="mt-6">
              <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                {/* Editor */}
                <div className="space-y-6">
                  {/* Active Status */}
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Enable Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Send automatic emails for this transaction type
                      </p>
                    </div>
                    <Switch
                      checked={currentTemplate.is_active}
                      onCheckedChange={(checked) => updateTemplate('is_active', checked)}
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={currentTemplate.subject}
                      onChange={(e) => updateTemplate('subject', e.target.value)}
                      placeholder="Enter email subject..."
                    />
                    {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    <p className="text-xs text-muted-foreground">
                      Available variables: {'{{sale_number}}'}, {'{{po_number}}'}, {'{{business_name}}'}, {'{{customer_name}}'}
                    </p>
                  </div>

                  {/* Header Text */}
                  <div className="space-y-2">
                    <Label htmlFor="header">Header Message</Label>
                    <Textarea
                      id="header"
                      value={currentTemplate.header_text}
                      onChange={(e) => updateTemplate('header_text', e.target.value)}
                      placeholder="Enter header message..."
                      rows={2}
                    />
                    {errors.header_text && <p className="text-sm text-destructive">{errors.header_text}</p>}
                  </div>

                  {/* Custom Message */}
                  <div className="space-y-2">
                    <Label htmlFor="custom">Custom Message (Optional)</Label>
                    <Textarea
                      id="custom"
                      value={currentTemplate.custom_message}
                      onChange={(e) => updateTemplate('custom_message', e.target.value)}
                      placeholder="Add a personal message to your emails..."
                      rows={3}
                    />
                    {errors.custom_message && <p className="text-sm text-destructive">{errors.custom_message}</p>}
                  </div>

                  {/* Footer Text */}
                  <div className="space-y-2">
                    <Label htmlFor="footer">Footer Message</Label>
                    <Textarea
                      id="footer"
                      value={currentTemplate.footer_text}
                      onChange={(e) => updateTemplate('footer_text', e.target.value)}
                      placeholder="Enter footer message..."
                      rows={2}
                    />
                    {errors.footer_text && <p className="text-sm text-destructive">{errors.footer_text}</p>}
                  </div>

                  {/* Branding */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium flex items-center gap-2">
                      <Palette className="h-4 w-4" />
                      Branding
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="color">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            id="color"
                            value={currentTemplate.primary_color}
                            onChange={(e) => updateTemplate('primary_color', e.target.value)}
                            className="w-12 h-10 p-1 cursor-pointer"
                          />
                          <Input
                            value={currentTemplate.primary_color}
                            onChange={(e) => updateTemplate('primary_color', e.target.value)}
                            placeholder="#3b82f6"
                            className="flex-1"
                          />
                        </div>
                        {errors.primary_color && <p className="text-sm text-destructive">{errors.primary_color}</p>}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="logo">Logo URL</Label>
                        <Input
                          id="logo"
                          value={currentTemplate.logo_url}
                          onChange={(e) => updateTemplate('logo_url', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Display Options */}
                  <div className="space-y-4 p-4 border rounded-lg">
                    <h4 className="font-medium">Display Options</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Business Details</Label>
                        <p className="text-sm text-muted-foreground">
                          Display address, phone, and email in header
                        </p>
                      </div>
                      <Switch
                        checked={currentTemplate.show_business_details}
                        onCheckedChange={(checked) => updateTemplate('show_business_details', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Show Items Table</Label>
                        <p className="text-sm text-muted-foreground">
                          Include itemized list of products/services
                        </p>
                      </div>
                      <Switch
                        checked={currentTemplate.show_items_table}
                        onCheckedChange={(checked) => updateTemplate('show_items_table', checked)}
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Email Preview</Label>
                      <Badge variant="outline">Live Preview</Badge>
                    </div>
                    {renderPreview()}
                  </div>
                )}
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
