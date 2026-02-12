import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Sun, Moon, Monitor, Paintbrush, Type, Layout, RotateCcw } from 'lucide-react';

interface AppearancePrefs {
  primaryHue: number;
  primarySaturation: number;
  fontSize: string;
  borderRadius: number;
  density: string;
  sidebarStyle: string;
}

const defaultPrefs: AppearancePrefs = {
  primaryHue: 220,
  primarySaturation: 90,
  fontSize: 'medium',
  borderRadius: 8,
  density: 'comfortable',
  sidebarStyle: 'default',
};

const colorPresets = [
  { name: 'Blue', hue: 220, sat: 90 },
  { name: 'Indigo', hue: 240, sat: 85 },
  { name: 'Purple', hue: 270, sat: 80 },
  { name: 'Rose', hue: 340, sat: 82 },
  { name: 'Red', hue: 0, sat: 84 },
  { name: 'Orange', hue: 25, sat: 90 },
  { name: 'Amber', hue: 45, sat: 93 },
  { name: 'Green', hue: 142, sat: 71 },
  { name: 'Teal', hue: 173, sat: 58 },
  { name: 'Cyan', hue: 190, sat: 80 },
];

export function AppearanceSettings() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { toast } = useToast();

  const [prefs, setPrefs] = useState<AppearancePrefs>(() => {
    const stored = localStorage.getItem('appearance-prefs');
    return stored ? { ...defaultPrefs, ...JSON.parse(stored) } : defaultPrefs;
  });

  const applyPrefs = (p: AppearancePrefs) => {
    const root = document.documentElement;
    root.style.setProperty('--primary', `${p.primaryHue} ${p.primarySaturation}% 56%`);
    root.style.setProperty('--primary-glow', `${(p.primaryHue + 20) % 360} ${Math.max(p.primarySaturation - 5, 50)}% 67%`);
    root.style.setProperty('--primary-dark', `${p.primaryHue} ${p.primarySaturation}% 45%`);
    root.style.setProperty('--radius', `${p.borderRadius / 16}rem`);

    const fontSizeMap: Record<string, string> = { small: '14px', medium: '16px', large: '18px' };
    root.style.fontSize = fontSizeMap[p.fontSize] || '16px';

    const densityMap: Record<string, string> = { compact: '0.75', comfortable: '1', spacious: '1.25' };
    root.style.setProperty('--density', densityMap[p.density] || '1');

    root.setAttribute('data-sidebar-style', p.sidebarStyle);
  };

  useEffect(() => {
    applyPrefs(prefs);
  }, [prefs]);

  const updatePref = <K extends keyof AppearancePrefs>(key: K, value: AppearancePrefs[K]) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    localStorage.setItem('appearance-prefs', JSON.stringify(updated));
  };

  const resetToDefaults = () => {
    setPrefs(defaultPrefs);
    localStorage.removeItem('appearance-prefs');
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--primary-glow');
    document.documentElement.style.removeProperty('--primary-dark');
    document.documentElement.style.removeProperty('--radius');
    document.documentElement.style.fontSize = '16px';
    toast({ title: t('common.save'), description: 'Appearance reset to defaults.' });
  };

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {resolvedTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            {t('settings.theme')}
          </CardTitle>
          <CardDescription>Choose your preferred color mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'light' as const, icon: Sun, label: 'Light' },
              { value: 'dark' as const, icon: Moon, label: 'Dark' },
              { value: 'system' as const, icon: Monitor, label: 'System' },
            ].map(({ value, icon: Icon, label }) => (
              <Button
                key={value}
                variant={theme === value ? 'default' : 'outline'}
                className="flex flex-col gap-2 h-20"
                onClick={() => setTheme(value)}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
          <CardDescription>Select your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => setLanguage('en')}
            >
              🇺🇸 English
            </Button>
            <Button
              variant={language === 'sw' ? 'default' : 'outline'}
              className="flex items-center gap-2"
              onClick={() => setLanguage('sw')}
            >
              🇹🇿 Kiswahili
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Accent Color */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Paintbrush className="h-5 w-5" />
            Accent Color
          </CardTitle>
          <CardDescription>Choose a primary color for the interface</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                className={`w-full aspect-square rounded-lg border-2 transition-all hover:scale-110 ${
                  prefs.primaryHue === preset.hue ? 'border-foreground ring-2 ring-foreground/20' : 'border-transparent'
                }`}
                style={{ backgroundColor: `hsl(${preset.hue}, ${preset.sat}%, 56%)` }}
                onClick={() => {
                  updatePref('primaryHue', preset.hue);
                  updatePref('primarySaturation', preset.sat);
                }}
                title={preset.name}
              />
            ))}
          </div>
          <div className="space-y-2">
            <Label>Custom Hue: {prefs.primaryHue}°</Label>
            <Slider
              value={[prefs.primaryHue]}
              onValueChange={([v]) => updatePref('primaryHue', v)}
              min={0}
              max={360}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Typography & Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Display Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Font Size</Label>
            <Select value={prefs.fontSize} onValueChange={(v) => updatePref('fontSize', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Border Radius: {prefs.borderRadius}px</Label>
            <Slider
              value={[prefs.borderRadius]}
              onValueChange={([v]) => updatePref('borderRadius', v)}
              min={0}
              max={20}
              step={1}
            />
            <div className="flex gap-2 items-center mt-2">
              <div className="w-12 h-8 bg-primary" style={{ borderRadius: `${prefs.borderRadius}px` }} />
              <span className="text-xs text-muted-foreground">Preview</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Density</Label>
            <Select value={prefs.density} onValueChange={(v) => updatePref('density', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="comfortable">Comfortable</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sidebar Style</Label>
            <Select value={prefs.sidebarStyle} onValueChange={(v) => updatePref('sidebarStyle', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="colored">Colored</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Reset */}
      <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
        <RotateCcw className="h-4 w-4" />
        Reset to Defaults
      </Button>
    </div>
  );
}
