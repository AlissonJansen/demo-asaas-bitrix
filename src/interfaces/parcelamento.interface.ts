export interface Parcelamento {
    billingType?: "UNDEFINED" | "CREDIT_CARD" | "PIX" | "BOLETO";
    dueDate?: string;
    description?: string;
    installmentCount: number;
    installmentValue: number;
    customer: Record<string, any>
  }
  