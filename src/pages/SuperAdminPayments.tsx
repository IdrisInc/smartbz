import { PaymentProofManagement } from '@/components/Admin/PaymentProofManagement';

export default function SuperAdminPayments() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Management</h1>
        <p className="text-muted-foreground">
          Review and manage manual payment submissions and activation codes
        </p>
      </div>

      <PaymentProofManagement />
    </div>
  );
}