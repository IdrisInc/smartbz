import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/components/Auth/AuthProvider';
import { LoginForm } from '@/components/Auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';

const planNames: Record<string, string> = {
  free: 'Free',
  basic: 'Basic',
  premium: 'Premium',
  enterprise: 'Enterprise',
};

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode') || 'login';
  const selectedPlan = searchParams.get('plan') || '';

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">BizWiz</h1>
          <p className="text-muted-foreground mt-2">
            {t('auth.completeBusinessSolution')}
          </p>
          {mode === 'signup' && selectedPlan && planNames[selectedPlan] && (
            <Badge variant="secondary" className="mt-3">
              {t('auth.selectedPlan')}: {planNames[selectedPlan]}
            </Badge>
          )}
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle>{mode === 'signup' ? t('auth.createAccount') : t('auth.welcome')}</CardTitle>
            <CardDescription>
              {mode === 'signup'
                ? t('auth.registerDesc')
                : t('auth.signInToAccount')
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm defaultMode={mode === 'signup' ? 'signup' : 'login'} selectedPlan={selectedPlan} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
