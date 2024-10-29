import { dotenvConfig } from "../config/env.config";

export const Stages = dotenvConfig.ASSAS.DEV_ASAAS_URL
  ? {
      NOVO: "C13:NEW",
      SOLICITAR_PAGAMENTO: "C13:PREPARATION",
      ERRO_SOLICITANDO_PAGAMENTO: "C13:PREPAYMENT_INVOIC",
      AGUARDANDO_PAGAMENTO: "C13:EXECUTING",
      FIM_CONTA_SECUNDARIA: "C13:FINAL_INVOICE",
      GERAR_NOTA_FISCAL: "C13:UC_8UCN88",
      ERRO_GERANDO_NOTA_FISCAL: "C13:UC_20XS8W",
      NOTA_AGUARDANDO_APROVACAO: "C13:UC_SZAPM6",
      FIM: "C13:UC_LYS34Z",
    }
  : {
      NOVO: "C9:NEW",
      SOLICITAR_PAGAMENTO: "C9:PREPARATION",
      ERRO_SOLICITANDO_PAGAMENTO: "C9:PREPAYMENT_INVOICE",
      AGUARDANDO_PAGAMENTO: "C9:EXECUTING",
      FIM_CONTA_SECUNDARIA: "C9:UC_0H0Q8A",
      GERAR_NOTA_FISCAL: "C9:UC_LYDAX1",
      ERRO_GERANDO_NOTA_FISCAL: "C9:UC_C1T4PT",
      NOTA_AGUARDANDO_APROVACAO: "C9:UC_S0GGXP",
      FIM: "C9:FINAL_INVOICE",
    };
