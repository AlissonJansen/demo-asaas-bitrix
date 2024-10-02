export interface BillingData {
  billingType?: string;
  dueDate?: string;
  value?: number;
  description?: string;
  observation?: string;
  customer: Record<string, any>
}
