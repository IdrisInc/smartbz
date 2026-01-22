import React from 'react';
import { Languages, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage, Language } from '@/contexts/LanguageContext';
import { useTheme, Theme } from '@/contexts/ThemeContext';

const languages: { value: Language; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
];

const themes: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="h-4 w-4" /> },
  { value: 'dark', label: 'Dark', icon: <Moon className="h-4 w-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
];

export function LanguageThemeSelector() {
  const { language, setLanguage } = useLanguage();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const currentLanguage = languages.find(l => l.value === language);

  return (
    <div className="flex items-center gap-1">
      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Language">
            <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Language / Lugha</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map(lang => (
            <DropdownMenuItem
              key={lang.value}
              onClick={() => setLanguage(lang.value)}
              className={language === lang.value ? 'bg-accent' : ''}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Theme Toggle */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" title="Theme">
            {resolvedTheme === 'dark' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme / Mandhari</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {themes.map(t => (
            <DropdownMenuItem
              key={t.value}
              onClick={() => setTheme(t.value)}
              className={theme === t.value ? 'bg-accent' : ''}
            >
              <span className="mr-2">{t.icon}</span>
              {t.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
