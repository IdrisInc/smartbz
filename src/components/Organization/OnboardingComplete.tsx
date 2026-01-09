
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Users, Settings, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function OnboardingComplete() {
  const navigate = useNavigate();

  const nextSteps = [
    {
      icon: BarChart3,
      title: 'Start Managing',
      description: 'Begin tracking sales, inventory, and more',
      action: () => navigate('/dashboard'),
      buttonText: 'Go to Dashboard'
    },
    {
      icon: Users,
      title: 'Explore Features',
      description: 'Discover sales, inventory, and reporting tools',
      action: () => navigate('/dashboard/sales'),
      buttonText: 'Explore Sales'
    },
    {
      icon: Settings,
      title: 'Learn More',
      description: 'Get familiar with the system',
      action: () => navigate('/dashboard/products'),
      buttonText: 'View Products'
    }
  ];

  return (
    <div className="space-y-8">
      <Card className="animate-scale-in text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-3xl text-green-600">Congratulations! 🎉</CardTitle>
          <CardDescription className="text-lg">
            Your business is now set up and ready to go!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 p-6 rounded-lg border">
            <p className="text-sm text-muted-foreground mb-4">
              You've successfully:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Registered your business details</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Created your first branch (free)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {nextSteps.map((step, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-all duration-300 hover:scale-105 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 bg-primary/10 rounded-full">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                onClick={step.action} 
                className="w-full transition-all duration-200 hover:scale-105"
                variant="outline"
              >
                {step.buttonText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-in">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">
              Ready to start managing your business?
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="transition-all duration-200 hover:scale-105"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
