
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Star, Target, TrendingUp, Users, Search } from 'lucide-react';

const mockPerformanceData = [
  { 
    id: 1, 
    employee: 'John Smith', 
    position: 'Store Manager', 
    overallScore: 4.5, 
    goals: { completed: 8, total: 10 }, 
    lastReview: '2024-01-15', 
    nextReview: '2024-04-15',
    kpis: { sales: 95, customerSat: 88, teamLead: 92 }
  },
  { 
    id: 2, 
    employee: 'Sarah Johnson', 
    position: 'Sales Associate', 
    overallScore: 4.2, 
    goals: { completed: 6, total: 8 }, 
    lastReview: '2024-01-10', 
    nextReview: '2024-04-10',
    kpis: { sales: 87, customerSat: 91, teamWork: 85 }
  },
  { 
    id: 3, 
    employee: 'Mike Wilson', 
    position: 'Accountant', 
    overallScore: 4.0, 
    goals: { completed: 5, total: 7 }, 
    lastReview: '2024-01-08', 
    nextReview: '2024-04-08',
    kpis: { accuracy: 96, efficiency: 78, compliance: 94 }
  },
];

export function PerformanceTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('current');

  const filteredPerformance = mockPerformanceData.filter(emp =>
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
        {filteredPerformance.map((employee) => (
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
                      {employee.overallScore}
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
        ))}
      </div>
    </div>
  );
}
