import { Badge } from '@/components/ui/badge';

export type StockStatusType = 'available' | 'reserved' | 'damaged' | 'returned_qc' | 'scrap';

interface StockStatusBadgeProps {
  status: StockStatusType;
  className?: string;
}

export const stockStatusLabels: Record<StockStatusType, string> = {
  available: 'Available / Good',
  reserved: 'Reserved',
  damaged: 'Damaged / Defective',
  returned_qc: 'Returned / QC',
  scrap: 'Scrap / Write-off',
};

export const stockStatusColors: Record<StockStatusType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  available: 'default',
  reserved: 'secondary',
  damaged: 'destructive',
  returned_qc: 'outline',
  scrap: 'destructive',
};

export function StockStatusBadge({ status, className }: StockStatusBadgeProps) {
  return (
    <Badge variant={stockStatusColors[status]} className={className}>
      {stockStatusLabels[status]}
    </Badge>
  );
}
