
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Clock, Search, Download } from 'lucide-react';

const mockAttendanceData = [
  { id: 1, employee: 'John Smith', date: '2024-01-29', checkIn: '09:00', checkOut: '17:30', totalHours: 8.5, status: 'present', overtime: 0.5 },
  { id: 2, employee: 'Sarah Johnson', date: '2024-01-29', checkIn: '09:15', checkOut: '17:00', totalHours: 7.75, status: 'present', overtime: 0 },
  { id: 3, employee: 'Mike Wilson', date: '2024-01-29', checkIn: '-', checkOut: '-', totalHours: 0, status: 'absent', overtime: 0 },
  { id: 4, employee: 'John Smith', date: '2024-01-28', checkIn: '09:00', checkOut: '17:00', totalHours: 8, status: 'present', overtime: 0 },
  { id: 5, employee: 'Sarah Johnson', date: '2024-01-28', checkIn: '09:00', checkOut: '13:00', totalHours: 4, status: 'half-day', overtime: 0 },
];

export function AttendanceTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  const filteredAttendance = mockAttendanceData.filter(record =>
    record.employee.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'default';
      case 'absent': return 'destructive';
      case 'half-day': return 'secondary';
      case 'late': return 'outline';
      default: return 'outline';
    }
  };

  const todayAttendance = filteredAttendance.filter(record => record.date === '2024-01-29');
  const presentCount = todayAttendance.filter(record => record.status === 'present').length;
  const absentCount = todayAttendance.filter(record => record.status === 'absent').length;
  const totalHours = todayAttendance.reduce((sum, record) => sum + record.totalHours, 0);

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
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            <p className="text-xs text-muted-foreground">out of {todayAttendance.length} employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            <p className="text-xs text-muted-foreground">employees absent</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-muted-foreground">worked today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overtime</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAttendance.reduce((sum, record) => sum + record.overtime, 0)}h</div>
            <p className="text-xs text-muted-foreground">overtime hours</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>Employee attendance tracking and time management</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Total Hours</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendance.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employee}</TableCell>
                  <TableCell>{record.date}</TableCell>
                  <TableCell>{record.checkIn}</TableCell>
                  <TableCell>{record.checkOut}</TableCell>
                  <TableCell>{record.totalHours}h</TableCell>
                  <TableCell>{record.overtime}h</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(record.status)}>
                      {record.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
