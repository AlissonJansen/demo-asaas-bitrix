export type Stages =
  | "C9:NEW" // novo
  | "C9:PREPARATION" // Solicitar pagamento
  | "C9:PREPAYMENT_INVOICE" // Erro ao solicitar pagamento
  | "C9:EXECUTING" // Aguardando pagamento
  | "C9:UC_0H0Q8A" // Fim (Conta secundária)
  | "C9:UC_LYDAX1" // Gerar nota fiscal
  | "C9:UC_C1T4PT" // Erro ao gerar nota fiscal
  | "C9:UC_S0GGXP" // Aguardando aprovação da nota fiscal
  | "C9:FINAL_INVOICE" // Processo finalizado
