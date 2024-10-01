export interface BillingData {
  billingType?: string;
  dueDate?: string;
  value?: number;
  description?: string;
  customer: Record<string, any>
}
