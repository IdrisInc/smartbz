
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Target, TrendingUp, Users, Search, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';

export function PerformanceTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('current');
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();

  useEffect(() => {
    if (currentOrganization) {
      fetchEmployees();
    }
  }, [currentOrganization]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast({
        title: "Error",
        description: "Failed to load performance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Create performance data based on employees (since we don't have a performance table yet)
  const performanceData = employees.map(emp => ({
    id: emp.id,
    employee: `${emp.first_name} ${emp.last_name}`,
    position: emp.position || 'Unknown',
    overallScore: 4.0 + Math.random() * 1, // Random score between 4.0-5.0
    goals: { completed: Math.floor(Math.random() * 8) + 3, total: 10 },
    lastReview: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextReview: new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    kpis: {
      productivity: Math.floor(Math.random() * 20) + 80,
      quality: Math.floor(Math.random() * 15) + 85,
      collaboration: Math.floor(Math.random() * 25) + 75
    }
  }));

  const filteredPerformance = performanceData.filter(emp =>
    emp.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderStars = (score: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-4 w-4 ${i < Math.floor(score) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={reviewPeriod} onValueChange={setReviewPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="q4-2023">Q4 2023</SelectItem>
              <SelectItem value="q3-2023">Q3 2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button>
          Schedule Reviews
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Performance</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.2</div>
            <p className="text-xs text-muted-foreground">out of 5.0</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Completed</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">19/25</div>
            <p className="text-xs text-muted-foreground">76% completion rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reviews Due</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">this quarter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">exceeding expectations</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : filteredPerformance.length > 0 ? (
          filteredPerformance.map((employee) => (
            <Card key={employee.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{employee.employee}</CardTitle>
                    <CardDescription>{employee.position}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {renderStars(employee.overallScore)}
                      <span className={`ml-2 font-bold ${getScoreColor(employee.overallScore)}`}>
                        {employee.overallScore.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium mb-2">Goals Progress</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completed</span>
                        <span>{employee.goals.completed}/{employee.goals.total}</span>
                      </div>
                      <Progress value={(employee.goals.completed / employee.goals.total) * 100} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Key Performance Indicators</h4>
                    <div className="space-y-1 text-sm">
                      {Object.entries(employee.kpis).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                          <span className="font-medium">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Review Schedule</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Last Review</span>
                        <span>{employee.lastReview}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Review</span>
                        <span>{employee.nextReview}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">View Details</Button>
                  <Button variant="outline" size="sm">Schedule Review</Button>
                  <Button variant="outline" size="sm">Set Goals</Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              No employees found for performance tracking
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
