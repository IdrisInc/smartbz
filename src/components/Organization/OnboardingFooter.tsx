import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface FooterLink {
  id: string;
  title: string;
  url: string;
  category: string;
}

export function OnboardingFooter() {
  const [links, setLinks] = useState<FooterLink[]>([]);

  useEffect(() => {
    fetchFooterLinks();
  }, []);

  const fetchFooterLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('footer_links')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error('Error fetching footer links:', error);
    }
  };

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.category]) {
      acc[link.category] = [];
    }
    acc[link.category].push(link);
    return acc;
  }, {} as Record<string, FooterLink[]>);

  return (
    <footer className="mt-auto border-t bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-lg mb-3 text-primary">BizWiz</h3>
            <p className="text-sm text-muted-foreground">
              Your complete business management solution for Tanzania.
            </p>
          </div>

          {/* Legal Links */}
          {groupedLinks.legal && (
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                {groupedLinks.legal.map(link => (
                  <li key={link.id}>
                    <Link 
                      to={link.url} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Support Links */}
          {groupedLinks.support && (
            <div>
              <h4 className="font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                {groupedLinks.support.map(link => (
                  <li key={link.id}>
                    <Link 
                      to={link.url} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* General Links */}
          {groupedLinks.general && (
            <div>
              <h4 className="font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                {groupedLinks.general.map(link => (
                  <li key={link.id}>
                    <Link 
                      to={link.url} 
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} BizWiz. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
