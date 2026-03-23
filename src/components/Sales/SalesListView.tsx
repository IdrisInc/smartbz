import React from 'react';
import { Check, X, Clock, Eye, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SalesListViewProps {
  sales: any[];
  loading: boolean;
  searchTerm: string;
  isBusinessOwner: boolean;
  hasMoreSales: boolean;
  onConfirm: (saleId: string) => void;
  onReject: (saleId: string) => void;
  onViewDetails: (saleId: string) => void;
  onLoadMore: () => void;
}

export function SalesListView({
  sales, loading, searchTerm, isBusinessOwner, hasMoreSales,
  onConfirm, onReject, onViewDetails, onLoadMore,
}: SalesListViewProps) {
  const filteredSales = sales.filter(sale =>
    sale.sale_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.contacts?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && sales.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (filteredSales.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            {searchTerm ? 'No sales found matching your search.' : 'No sales recorded yet.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {filteredSales.map((sale) => (
        <Card key={sale.id}>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">{sale.sale_number || `Sale #${sale.id.slice(0, 8)}`}</CardTitle>
                <CardDescription>Customer: {sale.contacts?.name || 'Walk-in Customer'}</CardDescription>
              </div>
              <div className="text-right space-y-1">
                <div className="text-2xl font-bold">${sale.total_amount?.toLocaleString() || '0'}</div>
                <div className="flex gap-1 justify-end flex-wrap">
                  <Badge
                    variant={
                      sale.confirmation_status === 'confirmed' ? 'default' :
                      sale.confirmation_status === 'rejected' ? 'destructive' :
                      'outline'
                    }
                  >
                    {sale.confirmation_status === 'confirmed' && <Check className="h-3 w-3 mr-1" />}
                    {sale.confirmation_status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                    {sale.confirmation_status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                    {sale.confirmation_status === 'confirmed' ? 'Approved' :
                     sale.confirmation_status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
                <span>Payment: {sale.payment_method || 'Not specified'}</span>
                <span>Date: {new Date(sale.sale_date || sale.created_at).toLocaleDateString()}</span>
                {sale.created_by_name && <span>Created by: {sale.created_by_name}</span>}
                {sale.confirmed_by_name && sale.confirmation_status === 'confirmed' && (
                  <span>Approved by: {sale.confirmed_by_name}</span>
                )}
                {sale.confirmed_by_name && sale.confirmation_status === 'rejected' && (
                  <span className="text-destructive">Rejected by: {sale.confirmed_by_name}</span>
                )}
                {sale.rejection_reason && (
                  <span className="text-destructive">Reason: {sale.rejection_reason}</span>
                )}
              </div>
              <div className="flex gap-2">
                {isBusinessOwner && sale.confirmation_status === 'pending' && (
                  <>
                    <Button variant="default" size="sm" onClick={() => onConfirm(sale.id)}>
                      <Check className="h-4 w-4 mr-2" />Confirm
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => onReject(sale.id)}>
                      <X className="h-4 w-4 mr-2" />Reject
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" onClick={() => onViewDetails(sale.id)}>
                  <Eye className="h-4 w-4 mr-2" />View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMoreSales && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={onLoadMore} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
