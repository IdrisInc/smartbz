import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'sw';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.loading': 'Loading...',
    'common.noResults': 'No results found',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.description': 'Description',
    'common.total': 'Total',
    'common.quantity': 'Quantity',
    'common.price': 'Price',
    'common.amount': 'Amount',
    'common.type': 'Type',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.submit': 'Submit',
    'common.view': 'View',
    'common.download': 'Download',
    'common.print': 'Print',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.filter': 'Filter',
    'common.clear': 'Clear',
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.sales': 'Sales',
    'nav.products': 'Products',
    'nav.inventory': 'Inventory',
    'nav.finance': 'Finance',
    'nav.employees': 'Employees',
    'nav.contacts': 'Contacts',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.branches': 'Branches',
    
    // Settings
    'settings.title': 'Settings & Configuration',
    'settings.business': 'Business',
    'settings.subscription': 'Subscription',
    'settings.tax': 'Tax & Currency',
    'settings.payments': 'Payments',
    'settings.features': 'Features',
    'settings.users': 'Users & Roles',
    'settings.permissions': 'Permissions',
    'settings.email': 'Email Templates',
    'settings.logs': 'System Logs',
    'settings.modules': 'Modules',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    
    // Auth
    'auth.signIn': 'Sign In',
    'auth.signOut': 'Sign Out',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.overview': 'Overview',
    'dashboard.recentActivity': 'Recent Activity',
    
    // Search
    'search.placeholder': 'Search organizations, products, contacts...',
    'search.organizations': 'Organizations',
    'search.products': 'Products',
    'search.contacts': 'Contacts',
    'search.employees': 'Employees',
  },
  sw: {
    // Common - Swahili
    'common.save': 'Hifadhi',
    'common.cancel': 'Ghairi',
    'common.delete': 'Futa',
    'common.edit': 'Hariri',
    'common.add': 'Ongeza',
    'common.search': 'Tafuta',
    'common.loading': 'Inapakia...',
    'common.noResults': 'Hakuna matokeo yaliyopatikana',
    'common.actions': 'Vitendo',
    'common.status': 'Hali',
    'common.date': 'Tarehe',
    'common.name': 'Jina',
    'common.email': 'Barua pepe',
    'common.phone': 'Simu',
    'common.address': 'Anwani',
    'common.description': 'Maelezo',
    'common.total': 'Jumla',
    'common.quantity': 'Kiasi',
    'common.price': 'Bei',
    'common.amount': 'Kiasi',
    'common.type': 'Aina',
    'common.close': 'Funga',
    'common.confirm': 'Thibitisha',
    'common.back': 'Rudi',
    'common.next': 'Endelea',
    'common.submit': 'Wasilisha',
    'common.view': 'Tazama',
    'common.download': 'Pakua',
    'common.print': 'Chapisha',
    'common.export': 'Hamisha',
    'common.import': 'Ingiza',
    'common.filter': 'Chuja',
    'common.clear': 'Futa',
    'common.all': 'Zote',
    'common.active': 'Hai',
    'common.inactive': 'Isiyo hai',
    'common.pending': 'Inasubiri',
    'common.approved': 'Imekubaliwa',
    'common.rejected': 'Imekataliwa',
    
    // Navigation - Swahili
    'nav.dashboard': 'Dashibodi',
    'nav.sales': 'Mauzo',
    'nav.products': 'Bidhaa',
    'nav.inventory': 'Hesabu ya Stoki',
    'nav.finance': 'Fedha',
    'nav.employees': 'Wafanyakazi',
    'nav.contacts': 'Mawasiliano',
    'nav.reports': 'Ripoti',
    'nav.settings': 'Mipangilio',
    'nav.branches': 'Matawi',
    
    // Settings - Swahili
    'settings.title': 'Mipangilio na Usanidi',
    'settings.business': 'Biashara',
    'settings.subscription': 'Usajili',
    'settings.tax': 'Kodi na Sarafu',
    'settings.payments': 'Malipo',
    'settings.features': 'Vipengele',
    'settings.users': 'Watumiaji na Majukumu',
    'settings.permissions': 'Ruhusa',
    'settings.email': 'Violezo vya Barua pepe',
    'settings.logs': 'Kumbukumbu za Mfumo',
    'settings.modules': 'Moduli',
    'settings.language': 'Lugha',
    'settings.theme': 'Mandhari',
    
    // Auth - Swahili
    'auth.signIn': 'Ingia',
    'auth.signOut': 'Toka',
    'auth.signUp': 'Jisajili',
    'auth.email': 'Barua pepe',
    'auth.password': 'Nenosiri',
    
    // Dashboard - Swahili
    'dashboard.welcome': 'Karibu',
    'dashboard.overview': 'Muhtasari',
    'dashboard.recentActivity': 'Shughuli za Hivi Karibuni',
    
    // Search - Swahili
    'search.placeholder': 'Tafuta mashirika, bidhaa, mawasiliano...',
    'search.organizations': 'Mashirika',
    'search.products': 'Bidhaa',
    'search.contacts': 'Mawasiliano',
    'search.employees': 'Wafanyakazi',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem('app-language');
    return (stored as Language) || 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
