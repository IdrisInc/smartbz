import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, FileText, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface CreditNote {
  id: string;
  credit_note_number: string;
  contact_id: string | null;
  sale_return_id: string | null;
  purchase_return_id: string | null;
  note_type: 'sales' | 'purchase';
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: 'draft' | 'issued' | 'applied' | 'cancelled';
  reason: string | null;
  notes: string | null;
  issued_date: string;
  applied_date: string | null;
  created_at: string;
  contacts?: { name: string } | null;
}

export function CreditNotesTab() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sales' | 'purchase'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<CreditNote | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      fetchCreditNotes();
    }
  }, [currentOrganization]);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('credit_notes')
        .select(`
          *,
          contacts(name)
        `)
        .eq('organization_id', currentOrganization?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreditNotes((data as CreditNote[]) || []);
    } catch (error) {
      console.error('Error fetching credit notes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load credit notes',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCreditNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('credit_notes')
        .update({ 
          status: 'applied',
          applied_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credit note applied successfully',
      });
      fetchCreditNotes();
    } catch (error) {
      console.error('Error applying credit note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to apply credit note',
      });
    }
  };

  const handleCancelCreditNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('credit_notes')
        .update({ status: 'cancelled' })
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Credit note cancelled',
      });
      fetchCreditNotes();
    } catch (error) {
      console.error('Error cancelling credit note:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to cancel credit note',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'secondary',
      issued: 'outline',
      applied: 'default',
      cancelled: 'destructive',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant={type === 'sales' ? 'default' : 'secondary'}>
        {type === 'sales' ? 'Credit Note' : 'Debit Note'}
      </Badge>
    );
  };

  const filteredNotes = creditNotes.filter(note => {
    const matchesSearch = note.credit_note_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || note.note_type === typeFilter;
    const matchesStatus = statusFilter === 'all' || note.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totals = {
    sales: filteredNotes.filter(n => n.note_type === 'sales' && n.status !== 'cancelled').reduce((sum, n) => sum + Number(n.total_amount), 0),
    purchase: filteredNotes.filter(n => n.note_type === 'purchase' && n.status !== 'cancelled').reduce((sum, n) => sum + Number(n.total_amount), 0),
  };

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credit Notes (Sales)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">${totals.sales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Owed to customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Debit Notes (Purchase)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">${totals.purchase.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Owed by suppliers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totals.purchase - totals.sales >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totals.purchase - totals.sales).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {totals.purchase - totals.sales >= 0 ? 'Net receivable' : 'Net payable'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Credit & Debit Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={(val: 'all' | 'sales' | 'purchase') => setTypeFilter(val)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Credit Notes</SelectItem>
                <SelectItem value="purchase">Debit Notes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No credit/debit notes found
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Note Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Issued Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotes.map((note) => (
                    <TableRow key={note.id}>
                      <TableCell className="font-medium">{note.credit_note_number}</TableCell>
                      <TableCell>{getTypeBadge(note.note_type)}</TableCell>
                      <TableCell>{note.contacts?.name || '-'}</TableCell>
                      <TableCell>{format(new Date(note.issued_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">${Number(note.amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right">${Number(note.tax_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium">${Number(note.total_amount).toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(note.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedNote(note);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {note.status === 'issued' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApplyCreditNote(note.id)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleCancelCreditNote(note.id)}
                              >
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedNote?.note_type === 'sales' ? 'Credit Note' : 'Debit Note'} Details
            </DialogTitle>
          </DialogHeader>
          {selectedNote && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Note Number</p>
                  <p className="font-medium">{selectedNote.credit_note_number}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <div>{getStatusBadge(selectedNote.status)}</div>
                </div>
                <div>
                  <p className="text-muted-foreground">Issued Date</p>
                  <p className="font-medium">{format(new Date(selectedNote.issued_date), 'MMM dd, yyyy')}</p>
                </div>
                {selectedNote.applied_date && (
                  <div>
                    <p className="text-muted-foreground">Applied Date</p>
                    <p className="font-medium">{format(new Date(selectedNote.applied_date), 'MMM dd, yyyy')}</p>
                  </div>
                )}
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p className="font-medium">{selectedNote.contacts?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <div>{getTypeBadge(selectedNote.note_type)}</div>
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-medium">${Number(selectedNote.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span className="font-medium">${Number(selectedNote.tax_amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>${Number(selectedNote.total_amount).toFixed(2)}</span>
                </div>
              </div>

              {selectedNote.reason && (
                <div>
                  <p className="text-muted-foreground text-sm">Reason</p>
                  <p>{selectedNote.reason}</p>
                </div>
              )}

              {selectedNote.notes && (
                <div>
                  <p className="text-muted-foreground text-sm">Notes</p>
                  <p>{selectedNote.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
