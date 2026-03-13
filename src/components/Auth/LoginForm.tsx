
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LoginFormProps {
  defaultMode?: 'login' | 'signup';
  selectedPlan?: string;
}

export function LoginForm({ defaultMode = 'login', selectedPlan = '' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      if (!email) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please enter your email address.",
        });
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth?reset=true`,
        });
        
        if (error) throw error;
        
        toast({
          title: "Check your email",
          description: "We've sent you a password reset link.",
        });
        setIsForgotPassword(false);
      } catch (error: any) {
        toast({
          variant: "destructive",
          title: "Error",
          description: error.message || "Failed to send reset email.",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter both email and password.",
      });
      return;
    }

    if (mode === 'signup' && (!firstName || !lastName)) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter your first and last name.",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password, {
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
          selected_plan: selectedPlan || 'free',
        });
        toast({
          title: "Account Created!",
          description: "Your account has been created and is pending activation by an administrator. You will be notified once approved.",
        });
      } else {
        await signIn(email, password);
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: error.message || "An error occurred during authentication.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              placeholder="First name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              placeholder="Last name"
            />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="Enter your email"
        />
      </div>
      {!isForgotPassword && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            minLength={6}
          />
        </div>
      )}
      <Button 
        type="submit" 
        className="w-full" 
        disabled={isLoading}
      >
        {isLoading ? 'Loading...' : (
          isForgotPassword ? 'Send Reset Link' : 
          mode === 'signup' ? 'Create Account' : 'Sign In'
        )}
      </Button>
      
      <div className="mt-4 text-center space-y-2">
        {!isForgotPassword && (
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-sm text-primary hover:underline block w-full"
          >
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsForgotPassword(!isForgotPassword)}
          className="text-sm text-muted-foreground hover:underline"
        >
          {isForgotPassword 
            ? 'Back to sign in'
            : 'Forgot your password?'
          }
        </button>
      </div>
    </form>
  );
}
