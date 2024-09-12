import { Request, Response, Router } from "express";
import { BitrixAPI } from "../utils/bitrix.api";
import { dotenvConfig } from "../config/env.config";
import { bitrixVariables } from "../utils/bitrix.variables";

const AssasRouter = Router();
const bitrixAPI = new BitrixAPI();

AssasRouter.post("/assas", async (req: Request, res: Response) => {
  // if (req.headers["asaas-access-token"] !== dotenvConfig.ASSAS.WEBHOOK_TOKEN)
  //   return res.status(400).send("Unauthorized");

  try {
    switch (req.body.event) {
      case "PAYMENT_CONFIRMED": // Aguardando pagamento
        const deal = await bitrixAPI.getDeal(req.body.payment.externalReference);
        const secundaria = !!+deal[bitrixVariables.negocio.conta];

        await bitrixAPI.updateStage(
          req.body.payment.externalReference,
          secundaria ? "C9:UC_0H0Q8A" : "C9:UC_LYDAX1" // Gerar nota fiscal
        );
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Pagamento efetuado!",
          "Pagamento foi efetuado pelo cliente!",
          "check",
          "2"
        );
        break;
      case "PAYMENT_APPROVED_BY_RISK_ANALYSIS": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão aprovado!",
          "O cartão foi aprovado pela análise de riscos!",
          "check",
          "2"
        );
        break;
      case "PAYMENT_REPROVED_BY_RISK_ANALYSIS": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão reprovado!",
          "O cartão foi reprovado pela análise de riscos!",
          "attention",
          "2"
        );
        break;
      case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão recusado!",
          "Cartão recusado durante a compra!",
          "attention",
          "2"
        );
        break;
      case "PAYMENT_OVERDUE":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cobrança vencida!",
          "Cliente não efetuou o pagamento a tempo!",
          "attention",
          "2"
        );
        break;
      case "PAYMENT_BANK_SLIP_VIEWED":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Boleto visualizado",
          "O boleto foi visualizado pelo cliente!",
          "check",
          "2"
        );
        break;
      case "PAYMENT_CHECKOUT_VIEWED":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Fatura visualizada",
          "A Fatura foi visualizada pelo cliente!",
          "check",
          "2"
        );
        break;
      case "INVOICE_AUTHORIZED":
        // await bitrixAPI.updateDeal(dealID, req.body.pdfUrl);
        await bitrixAPI.updateStage(
          req.body.invoice.externalReference,
          "C9:FINAL_INVOICE"
        );

        await bitrixAPI.addCommentInTimeline(
          req.body.invoice.externalReference,
          `PDF: ${req.body.invoice.pdfUrl}\nXML: ${req.body.invoice.xmlUrl}`
        );
        break;
      case "INVOICE_CANCELED":
        await bitrixAPI.updateStage(
          req.body.invoice.externalReference,
          "C9:UC_C1T4PT"
        );

        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Fatura cancelada",
          "Fatura foi cancelada",
          "info",
          "2"
        );
        break;
      case "INVOICE_ERROR":
        await bitrixAPI.updateStage(
          req.body.invoice.externalReference,
          "C9:UC_C1T4PT"
        );

        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Erro na fatura!",
          "Erro na aprovação da fatura",
          "attention",
          "2"
        );
        break;
      default:
        break;
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.error(e);
    return res.status(400).send(e);
  }
});

export default AssasRouter;
