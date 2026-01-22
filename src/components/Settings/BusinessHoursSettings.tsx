import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

const DAYS_OF_WEEK = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
];

export function BusinessHoursSettings() {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingDays, setWorkingDays] = useState<string[]>(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('17:00');

  useEffect(() => {
    if (currentOrganization?.id) {
      loadSettings();
    }
  }, [currentOrganization?.id]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('business_settings')
        .select('working_days, opening_time, closing_time')
        .eq('organization_id', currentOrganization?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setWorkingDays(data.working_days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
        setOpeningTime(data.opening_time?.substring(0, 5) || '09:00');
        setClosingTime(data.closing_time?.substring(0, 5) || '17:00');
      }
    } catch (error) {
      console.error('Error loading business hours:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (dayId: string, checked: boolean) => {
    if (checked) {
      setWorkingDays([...workingDays, dayId]);
    } else {
      setWorkingDays(workingDays.filter(d => d !== dayId));
    }
  };

  const handleSave = async () => {
    if (workingDays.length === 0) {
      toast.error('Please select at least one working day');
      return;
    }

    if (openingTime >= closingTime) {
      toast.error('Opening time must be before closing time');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_settings')
        .upsert({
          organization_id: currentOrganization?.id,
          business_name: currentOrganization?.name || 'Business',
          working_days: workingDays,
          opening_time: openingTime + ':00',
          closing_time: closingTime + ':00'
        }, {
          onConflict: 'organization_id'
        });

      if (error) throw error;
      toast.success('Business hours saved successfully');
    } catch (error) {
      console.error('Error saving business hours:', error);
      toast.error('Failed to save business hours');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Working Hours & Days
        </CardTitle>
        <CardDescription>
          Set your business operating hours and working days
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <Label>Working Days</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={workingDays.includes(day.id)}
                      onCheckedChange={(checked) => handleDayToggle(day.id, checked as boolean)}
                    />
                    <Label htmlFor={day.id} className="text-sm font-normal cursor-pointer">
                      {day.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="openingTime">Opening Time</Label>
                <Input
                  id="openingTime"
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="closingTime">Closing Time</Label>
                <Input
                  id="closingTime"
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Business Hours'
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
