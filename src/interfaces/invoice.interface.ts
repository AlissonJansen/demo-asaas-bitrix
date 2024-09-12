export interface InvoiceData {
  serviceDescription: string;
  observations: string;
  payment: string;
  customer: string;
  value: number;
  deductions: number;
  effectiveDate: string; // data emissão
  municipalServiceName: string; // Análise e desenvolvimento de sistemas
  municipalServiceCode: string;
  externalReference?: string;
  taxes: {
    retainIss: boolean;
    iss: number;
    cofins:number;
    csll:number;
    inss:number;
    ir:number;
    pis:number;
  };
}
