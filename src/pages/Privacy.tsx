import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Shield, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface LegalPage {
  title: string;
  content: string;
  updated_at: string;
}

export default function PrivacyPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState<LegalPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      const { data, error } = await supabase
        .from('legal_pages')
        .select('*')
        .eq('page_type', 'privacy_policy')
        .single();

      if (error) throw error;
      setPage(data);
    } catch (error) {
      console.error('Error fetching privacy policy:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert markdown-like content to HTML
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) {
          return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{line.slice(2)}</h1>;
        }
        if (line.startsWith('## ')) {
          return <h2 key={i} className="text-2xl font-semibold mt-6 mb-3">{line.slice(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={i} className="text-xl font-medium mt-4 mb-2">{line.slice(4)}</h3>;
        }
        if (line.startsWith('- ')) {
          return <li key={i} className="ml-6 text-muted-foreground">{line.slice(2)}</li>;
        }
        if (line.trim() === '') {
          return <br key={i} />;
        }
        return <p key={i} className="text-muted-foreground mb-2">{line}</p>;
      });
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          {page && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date(page.updated_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <Card className="animate-slide-in-right">
          <CardContent className="pt-6 prose prose-slate max-w-none">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-1/2 mt-6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : page ? (
              <div className="legal-content">
                {renderContent(page.content)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Privacy policy not found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Button variant="outline" onClick={() => navigate('/terms')}>
            Terms of Service
          </Button>
          <Button variant="outline" onClick={() => navigate('/faq')}>
            FAQ
          </Button>
        </div>
      </main>
    </div>
  );
}
