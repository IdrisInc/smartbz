import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';

interface BusinessPreloaderProps {
  children: React.ReactNode;
}

export function BusinessPreloader({ children }: BusinessPreloaderProps) {
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const { currentOrganization } = useOrganization();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    if (currentOrganization?.id) {
      loadBusinessInfo();
    } else {
      // If no organization, still hide preloader after delay
      setBusinessName('Loading...');
    }

    return () => clearTimeout(timer);
  }, [currentOrganization?.id]);

  const loadBusinessInfo = async () => {
    try {
      const { data } = await supabase
        .from('business_settings')
        .select('business_name, logo_url')
        .eq('organization_id', currentOrganization?.id)
        .single();

      if (data) {
        setBusinessName(data.business_name || currentOrganization?.name || 'SmartBZ');
        setLogoUrl(data.logo_url);
      } else {
        setBusinessName(currentOrganization?.name || 'SmartBZ');
        setLogoUrl(currentOrganization?.logo_url);
      }
    } catch (error) {
      setBusinessName(currentOrganization?.name || 'SmartBZ');
      setLogoUrl(currentOrganization?.logo_url);
    }
  };

  if (!loading) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 animate-in fade-in duration-500">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={businessName}
            className="h-24 w-24 object-contain rounded-lg"
          />
        ) : (
          <div className="h-24 w-24 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-4xl font-bold text-primary">
              {businessName.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        <h1 className="text-2xl font-bold text-foreground">
          {businessName}
        </h1>
        
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    </div>
  );
}
