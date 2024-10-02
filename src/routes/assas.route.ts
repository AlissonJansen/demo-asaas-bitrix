import { Request, Response, Router } from "express";
import { BitrixAPI } from "../apis/bitrix.api";
import { bitrixVariables } from "../utils/bitrix.variables";
import { Stages } from "../interfaces/stages";
import { AssasAPI } from "../apis/assas.api";
import { dotenvConfig } from "../config/env.config";

const AssasRouter = Router();
const bitrixAPI = new BitrixAPI();

AssasRouter.post("/assas", async (req: Request, res: Response) => {
  if (req.headers["asaas-access-token"] !== dotenvConfig.ASSAS.WEBHOOK_TOKEN)
    return res.status(400).send("Unauthorized");

  try {
    switch (req.body.event) {
      case "PAYMENT_CONFIRMED": // Aguardando pagamento
        {
          const [dealID, tipoDePagamento, _] =
            req.body.payment.externalReference.split("||");

          if (tipoDePagamento === "Parcela") {
            const [dealID, tipoDePagamento, conta] =
              req.body.payment.externalReference.split("||");

            if (tipoDePagamento !== "Parcela") break;

            const [id, value] = conta.split("-");
            const assasAPI = new AssasAPI({ VALUE: value, ID: id });
            const parcelamento = req.body.payment.installment;
            const cobrancas = await assasAPI.getParcelamento_cobrancas(
              parcelamento
            );

            const ultimaParcelaPaga =
              req.body.payment.description.split(" ")[1];

            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio.ultima_parcela_paga]: ultimaParcelaPaga,
            });

            const proximaCobranca = cobrancas.find(
              (cobranca: any) =>
                +cobranca.description.split(" ")[1] === +ultimaParcelaPaga + 1
            );

            const deal = await bitrixAPI.getDeal(dealID);
            const contaRosas = deal[bitrixVariables.negocio.conta] === "727";

            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da ${ultimaParcelaPaga}ª parcela foi efetuado pelo cliente!`,
              "check",
              "deal"
            );

            if (proximaCobranca) {
              await bitrixAPI.addDetails(dealID, {
                [bitrixVariables.negocio
                  .ultima_parcela_paga]: `${ultimaParcelaPaga}`,
                SOURCE_DESCRIPTION: `boleto: ${proximaCobranca.bankSlipUrl}\npagamento: ${proximaCobranca.invoiceUrl}`,
                [bitrixVariables.negocio.cobrancaID]: proximaCobranca.id,
              });

              await bitrixAPI.updateStage(
                dealID,
                contaRosas
                  ? Stages.AGUARDANDO_PAGAMENTO
                  : Stages.GERAR_NOTA_FISCAL
              );
            }
            break;
          }

          const deal = await bitrixAPI.getDeal(dealID);
          const contaRosas = deal[bitrixVariables.negocio.conta] === "727";

          if (tipoDePagamento === "Entrada") {
            const parcelamento = deal[bitrixVariables.negocio.parcelamento];
            let titulo = deal.TITLE;

            if (titulo.split(" | ")[1]) {
              titulo = titulo.split(" | ")[0];
            }

            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio.entrada_paga]: "1",
            });

            if (parcelamento === "717") {
              await bitrixAPI.addDetails(dealID, {
                TITLE: `${titulo} | 1ª Parcela`,
              });
            }

            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da entrada foi efetuado pelo cliente!`,
              "check",
              "deal"
            );

            if (deal[bitrixVariables.negocio.parcelamento] === "717") {
              await bitrixAPI.updateStage(
                dealID,
                contaRosas ? Stages.NOVO : Stages.GERAR_NOTA_FISCAL
              );
              break;
            }

            await bitrixAPI.updateStage(
              dealID,
              contaRosas ? Stages.SOLICITAR_PAGAMENTO : Stages.GERAR_NOTA_FISCAL
            );
            break;
          }

          if (tipoDePagamento === "A vista") {
            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da cobrança foi efetuado à vista pelo cliente!`,
              "check",
              "deal"
            );

            await bitrixAPI.updateStage(
              dealID,
              contaRosas
                ? Stages.FIM_CONTA_SECUNDARIA
                : Stages.GERAR_NOTA_FISCAL
            );
          }
        }
        break;
      case "PAYMENT_RECEIVED":
        {
          const [dealID, tipoDePagamento, _] =
            req.body.payment.externalReference.split("||");

          if (tipoDePagamento === "Parcela") {
            const [dealID, tipoDePagamento, conta] =
              req.body.payment.externalReference.split("||");

            if (tipoDePagamento !== "Parcela") break;

            const [id, value] = conta.split("-");
            const assasAPI = new AssasAPI({ VALUE: value, ID: id });
            const parcelamento = req.body.payment.installment;
            const cobrancas = await assasAPI.getParcelamento_cobrancas(
              parcelamento
            );

            const ultimaParcelaPaga =
              req.body.payment.description.split(" ")[1];

            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio.ultima_parcela_paga]: ultimaParcelaPaga,
            });

            const proximaCobranca = cobrancas.find(
              (cobranca: any) =>
                +cobranca.description.split(" ")[1] === +ultimaParcelaPaga + 1
            );

            const deal = await bitrixAPI.getDeal(dealID);
            const contaRosas = deal[bitrixVariables.negocio.conta] === "727";

            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da ${ultimaParcelaPaga}ª parcela foi efetuado pelo cliente!`,
              "check",
              "deal"
            );

            if (proximaCobranca) {
              await bitrixAPI.addDetails(dealID, {
                [bitrixVariables.negocio
                  .ultima_parcela_paga]: `${ultimaParcelaPaga}`,
                SOURCE_DESCRIPTION: `boleto: ${proximaCobranca.bankSlipUrl}\npagamento: ${proximaCobranca.invoiceUrl}`,
                [bitrixVariables.negocio.cobrancaID]: proximaCobranca.id,
              });

              await bitrixAPI.updateStage(
                dealID,
                contaRosas
                  ? Stages.AGUARDANDO_PAGAMENTO
                  : Stages.GERAR_NOTA_FISCAL
              );
            }
            break;
          }

          const deal = await bitrixAPI.getDeal(dealID);
          const contaRosas = deal[bitrixVariables.negocio.conta] === "727";

          if (tipoDePagamento === "Entrada") {
            const parcelamento = deal[bitrixVariables.negocio.parcelamento];
            const titulo = deal.TITLE;

            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio.entrada_paga]: "1",
            });

            if (parcelamento === "717") {
              await bitrixAPI.addDetails(dealID, {
                TITLE: `${titulo} | 1ª Parcela`,
              });
            }

            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da entrada foi efetuado pelo cliente!`,
              "check",
              "deal"
            );

            if (deal[bitrixVariables.negocio.parcelamento] === "717") {
              await bitrixAPI.updateStage(
                dealID,
                contaRosas ? Stages.NOVO : Stages.GERAR_NOTA_FISCAL
              );
              break;
            }

            await bitrixAPI.updateStage(
              dealID,
              contaRosas ? Stages.SOLICITAR_PAGAMENTO : Stages.GERAR_NOTA_FISCAL
            );
            break;
          }

          if (tipoDePagamento === "A vista") {
            await bitrixAPI.addLog(
              dealID,
              "Pagamento efetuado!",
              `Pagamento da cobrança foi efetuado à vista pelo cliente!`,
              "check",
              "deal"
            );

            await bitrixAPI.updateStage(
              dealID,
              contaRosas
                ? Stages.FIM_CONTA_SECUNDARIA
                : Stages.GERAR_NOTA_FISCAL
            );
          }
        }
        break;
      case "PAYMENT_APPROVED_BY_RISK_ANALYSIS": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão aprovado!",
          "O cartão foi aprovado pela análise de riscos!",
          "check",
          "deal"
        );
        break;
      case "PAYMENT_REPROVED_BY_RISK_ANALYSIS": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão reprovado!",
          "O cartão foi reprovado pela análise de riscos!",
          "attention",
          "deal"
        );
        break;
      case "PAYMENT_CREDIT_CARD_CAPTURE_REFUSED": // Analise de risco para cartões de crédito
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cartão recusado!",
          "Cartão recusado durante a compra!",
          "attention",
          "deal"
        );
        break;
      case "PAYMENT_OVERDUE":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Cobrança vencida!",
          "Cliente não efetuou o pagamento a tempo!",
          "attention",
          "deal"
        );
        break;
      case "PAYMENT_BANK_SLIP_VIEWED":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Boleto visualizado",
          "O boleto foi visualizado pelo cliente!",
          "check",
          "deal"
        );
        break;
      case "PAYMENT_CHECKOUT_VIEWED":
        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Fatura visualizada",
          "A Fatura foi visualizada pelo cliente!",
          "check",
          "deal"
        );
        break;
      case "INVOICE_AUTHORIZED":
        {
          const [dealID, tipoDePagamento, conta] =
            req.body.invoice.externalReference.split("||");
          const [contaID, contaVALUE] = conta.split("-");
          const assasAPI = new AssasAPI({ ID: contaID, VALUE: contaVALUE });
          const bitrixAPI = new BitrixAPI();
          const pagamentoID = req.body.invoice.payment;
          let mensagem = "";

          const pagamento = await assasAPI.getBill(pagamentoID);
          const cobranca = await bitrixAPI.getDeal(dealID);
          const parcelamento = cobranca[bitrixVariables.negocio.parcelamento];

          if (tipoDePagamento === "Parcela") {
            mensagem = `Nota fiscal referente à ${
              pagamento.description.split(" ")[1]
            }ª parcela\n\n`;
          }

          if (tipoDePagamento === "Entrada") {
            mensagem = "Nota fiscal referente ao pagamento da entrada\n\n";
          }

          await bitrixAPI.addCommentInTimeline(
            dealID,
            `${mensagem}PDF: ${req.body.invoice.pdfUrl}\nXML: ${req.body.invoice.xmlUrl}`
          );

          if (tipoDePagamento === "A vista") {
            await bitrixAPI.updateStage(dealID, Stages.FIM);
          }
        }
        break;
      case "INVOICE_CANCELED":
        await bitrixAPI.updateStage(
          req.body.invoice.externalReference,
          Stages.ERRO_GERANDO_NOTA_FISCAL
        );

        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Nota cancelada",
          "Nota fiscal foi cancelada",
          "info",
          "deal"
        );
        break;
      case "INVOICE_ERROR":
        await bitrixAPI.updateStage(
          req.body.invoice.externalReference,
          Stages.ERRO_GERANDO_NOTA_FISCAL
        );

        await bitrixAPI.addLog(
          req.body.payment.externalReference,
          "Erro na fatura!",
          "Erro na aprovação da fatura",
          "attention",
          "deal"
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
