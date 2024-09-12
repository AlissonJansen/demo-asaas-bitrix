export interface BillingData {
  billingType?: string;
  dueDate?: string;
  value?: number;
  customer: Record<string, any>
}
