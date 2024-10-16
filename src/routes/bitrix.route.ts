import { Request, Response, Router } from "express";
import { BitrixAPI } from "../apis/bitrix.api";
import { AssasAPI } from "../apis/assas.api";
import { dotenvConfig } from "../config/env.config";
import { bitrixVariables } from "../utils/bitrix.variables";
import { customerValidator } from "../validators/customer.validator";
import { paymentHandler } from "../utils/payment.handler";
import { Stages } from "../interfaces/stages";
import { contas, parcelas } from "../utils/enums";
import { CreateMissingAsaasCustomer } from "../utils/createMissingCustomer";
import { etapaHandler } from "../utils/etapa.handler";

const bitrixRouter = Router();
const bitrixAPI = new BitrixAPI();

bitrixRouter.post(`/bitrix/contacts`, async (req: Request, res: Response) => {
  if (
    req.body.auth.application_token !== dotenvConfig.BITRIX.APP_TOKEN.CONTACTS
  ) {
    return res.status(401).send("Unauthorized");
  }

  const contactID = req.body.data.FIELDS.ID;
  const customer = await bitrixAPI.getCustomer(contactID).catch((e) => {});

  for (let i = 0; contas.length > i; i++) {
    const assasAPI = new AssasAPI(contas[i]);
    const walletID =
      assasAPI.account === "Rozza"
        ? dotenvConfig.ASSAS.ROSAS.WALLET_ID
        : dotenvConfig.ASSAS.ROZZA.WALLET_ID;

    try {
      switch (req.body.event) {
        case "ONCRMCONTACTADD": // Adicionado
          const novoCliente = await assasAPI.createCustomer({
            email: customer?.EMAIL?.[0].VALUE,
            mobilePhone: customer?.PHONE?.[0].VALUE,
            name: customer.NAME,
            addressNumber: customer[bitrixVariables.contato.addressNumber],
            address: customer[bitrixVariables.contato.endereco],
            province: customer[bitrixVariables.contato.province], // bairro
            postalCode: customer[bitrixVariables.contato.cep],
            cpfCnpj: customer[bitrixVariables.contato.cpf_cnpj],
            externalReference: contactID,
          });

          await bitrixAPI.addAssasID(
            novoCliente.externalReference,
            novoCliente.id,
            walletID
          );

          await bitrixAPI.addLog(
            contactID,
            "Contato adicionado!",
            `Contato adicionado na conta ${contas[i].VALUE} com sucesso!`,
            "check",
            "contact"
          );
          continue;
        case "ONCRMCONTACTUPDATE": // Alterado
          const clienteRecebido = {
            email: customer?.EMAIL?.[0].VALUE,
            mobilePhone: customer?.PHONE?.[0].VALUE,
            name: customer.NAME,
            addressNumber: customer[bitrixVariables.contato.addressNumber],
            address: customer[bitrixVariables.contato.endereco],
            province: customer[bitrixVariables.contato.province], // bairro
            postalCode: customer[bitrixVariables.contato.cep],
            cpfCnpj: customer[bitrixVariables.contato.cpf_cnpj],
            externalReference: contactID,
          };

          const customerAsaasID = !i
            ? customer[bitrixVariables.contato.rosas_assasID]
            : customer[bitrixVariables.contato.rozza_assasID];

          if (!customerAsaasID) {
            let clienteEncontradoNoAsaas = await assasAPI.findCustomerByEmail(
              customer?.EMAIL?.[0].VALUE
            );

            if (!clienteEncontradoNoAsaas) {
              clienteEncontradoNoAsaas = await assasAPI.createCustomer(
                clienteRecebido
              );
            }

            await bitrixAPI.addAssasID(
              clienteEncontradoNoAsaas.externalReference,
              clienteEncontradoNoAsaas.id,
              walletID
            );

            continue;
          }

          await assasAPI.updateCustomer(customerAsaasID, clienteRecebido);
          continue;
        case "ONCRMCONTACTDELETE": // Deletado
          await assasAPI.deleteCustomer(contactID);
          continue;
      }

      return res.status(200).send("ok");
    } catch (e) {
      console.log(e);
      return res.status(204).send(e);
    }
  }
});

bitrixRouter.post(`/bitrix/deals`, async (req: Request, res: Response) => {
  if (req.body.auth.application_token !== dotenvConfig.BITRIX.APP_TOKEN.DEALS)
    return res.status(401).send("Unauthorized");

  const id = req.body.data.FIELDS.ID;
  const deal = await bitrixAPI.getDeal(id).catch((e) => e);
  if (!deal)
    return res
      .status(204)
      .send("Houve um erro buscando o deal no bitrix" + deal);

  if (!deal.CONTACT_ID) return res.status(200).send("ok");
  const bitrixContact = await bitrixAPI
    .getCustomer(deal.CONTACT_ID)
    .catch((e) => e);
  if (!bitrixContact)
    return res
      .status(204)
      .send("Houve um erro buscando o cliente no bitrix" + deal);

  const conta = contas.find(
    (conta) => conta.ID === deal[bitrixVariables.negocio.conta]
  );
  if (!conta) return res.status(200).send("ok");
  const assasAPI = new AssasAPI(conta);
  const asaasCustomer = await assasAPI
    .findCustomerByExternalReference(deal.CONTACT_ID)
    .catch((e) => {});

  try {
    switch (deal.STAGE_ID) {
      case Stages.NOVO: // Solicitar pagamento
        {
          const pausa = +deal[bitrixVariables.negocio.pausa];

          if (pausa) break;

          await bitrixAPI.addDetails(id, {
            [bitrixVariables.negocio.pausa]: "1",
            [bitrixVariables.negocio.pagamento_requisitado]: "0",
          });
        }
        break;
      case Stages.SOLICITAR_PAGAMENTO: // Solicitar pagamento
        {
          const pagamentoRequisitado =
            deal[bitrixVariables.negocio.pagamento_requisitado];

          if (+pagamentoRequisitado) break;

          // {
          //   await bitrixAPI.updateStage(id, Stages.AGUARDANDO_PAGAMENTO);
          //   break;
          // };

          if (!asaasCustomer) {
            await CreateMissingAsaasCustomer(bitrixContact, assasAPI, deal);
          }

          const result = await paymentHandler(deal, bitrixContact, assasAPI);

          await bitrixAPI.updateStage(id, Stages.AGUARDANDO_PAGAMENTO);

          await bitrixAPI.addDetails(id, {
            SOURCE_DESCRIPTION: `boleto: ${result.bankSlipUrl}\npagamento: ${result.invoiceUrl}`,
            [bitrixVariables.negocio.clienteID]: result.customer,
            [bitrixVariables.negocio.cobrancaID]: result.id,
            [bitrixVariables.negocio.pausa]: "0",
            [bitrixVariables.negocio.pagamento_requisitado]: "1",
          });

          await bitrixAPI.addLog(
            id,
            "Cobrança criada!",
            `Cobrança criada e enviada ao cliente!`,
            "check",
            "deal"
          );
        }
        break;
      case Stages.AGUARDANDO_PAGAMENTO:
        {
          const assasPayment = await assasAPI.getBill(
            deal[bitrixVariables.negocio.cobrancaID]
          );
          const [dealID, tipoDePagamento, conta] =
            assasPayment.externalReference.split("||");
          const paused = deal[bitrixVariables.negocio.pausa];
          const entradaPaga = +deal[bitrixVariables.negocio.entrada_paga];
          const pagamentoRequisitado =
            +deal[bitrixVariables.negocio.pagamento_requisitado];

          if (+paused) {
            await bitrixAPI.updateStage(dealID, Stages.NOVO);
            break;
          }

          if (tipoDePagamento === "A vista" || tipoDePagamento === "Entrada")
            break;

          const parcelaPaga = deal[bitrixVariables.negocio.ultima_parcela_paga];
          const parcelasAPagar = assasPayment.description
            .split(" ")[3]
            .replace(".", "");
          const tipoDeParcelamento = deal[bitrixVariables.negocio.parcelamento];
          const seisVezes = tipoDeParcelamento.match(/^(715|717)$/);
          const contaUsada = conta.split("-")[1];

          if (parcelaPaga === parcelasAPagar) {
            if (seisVezes) {
              const etapa = deal[bitrixVariables.negocio.etapa_atual];
              const etapaDetails = etapaHandler(+etapa, tipoDeParcelamento);
              const etapaFinal = tipoDeParcelamento === "715" ? 4 : 5;
              let titulo = deal.TITLE;

              if (titulo.split(" | ")[1]) {
                titulo = titulo.split(" | ")[0];
              }

              if (!etapa) {
                await bitrixAPI.addDetails(deal.ID, {
                  [bitrixVariables.negocio.etapa_atual]: `2`,
                  [bitrixVariables.negocio.ultima_parcela_paga]: "0",
                  TITLE: `${titulo} | ${etapaDetails.titulo}`,
                });

                await bitrixAPI.updateStage(id, Stages.NOVO);
                break;
              }

              if (+etapa < etapaFinal) {
                await bitrixAPI.addDetails(deal.ID, {
                  [bitrixVariables.negocio.etapa_atual]: `${+etapa + 1}`,
                  [bitrixVariables.negocio.ultima_parcela_paga]: "0",
                  TITLE: `${titulo} | ${etapaDetails.titulo}`,
                });

                await bitrixAPI.updateStage(id, Stages.NOVO);
                break;
              }

              await bitrixAPI.updateStage(
                id,
                contaUsada === "Rozza"
                  ? Stages.FIM
                  : Stages.FIM_CONTA_SECUNDARIA
              );
            }

            await bitrixAPI.updateStage(
              dealID,
              contaUsada === "Rozza" ? Stages.FIM : Stages.FIM_CONTA_SECUNDARIA
            );
          }
        }
        break;
      case Stages.GERAR_NOTA_FISCAL: // Gerar nota fiscal
        {
          const assasPaymentID = deal[bitrixVariables.negocio.cobrancaID];
          const assasPayment = await assasAPI.getBill(assasPaymentID);
          const [dealID, tipoDePagamento, conta] =
            assasPayment.externalReference.split("||");

          await assasAPI.requestInvoice({
            customer: asaasCustomer.id,
            deductions: 0.2,
            effectiveDate: assasPayment.dateCreated,
            municipalServiceName: "Imigração italiana",
            observations:
              deal[bitrixVariables.negocio.observacoes] ||
              "desenvolvimento de software conforme solicitado",
            payment: assasPaymentID,
            municipalServiceCode: "101",
            value: assasPayment.value,
            externalReference: `${dealID}||${tipoDePagamento}||${conta}`,
            serviceDescription: assasPayment.description,
            taxes: {
              retainIss: false,
              iss: 2,
              cofins: 0,
              csll: 0,
              inss: 0,
              ir: 0,
              pis: 0,
            },
          });

          if (tipoDePagamento === "A vista") {
            await bitrixAPI.updateStage(
              dealID,
              Stages.NOTA_AGUARDANDO_APROVACAO
            );
            break;
          }

          if (tipoDePagamento === "Entrada") {
            if (deal[bitrixVariables.negocio.parcelamento] === "717") {
              await bitrixAPI.updateStage(dealID, Stages.NOVO);
              break;
            }

            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio.pagamento_requisitado]: "0",
            });

            await bitrixAPI.updateStage(dealID, Stages.NOVO);
            break;
          }

          const payment = await assasAPI.getBill(
            deal[bitrixVariables.negocio.cobrancaID]
          );
          const cobrancas_do_parcelamento =
            await assasAPI.getParcelamento_cobrancas(payment.installment);
          const ultimaParcelaPaga = payment.description.split(" ")[1];

          const proximaCobranca = cobrancas_do_parcelamento.find(
            (cobranca: any) => {
              return (
                +cobranca.description.split(" ")[1] === +ultimaParcelaPaga + 1
              );
            }
          );

          if (proximaCobranca) {
            await bitrixAPI.addDetails(dealID, {
              [bitrixVariables.negocio
                .ultima_parcela_paga]: `${ultimaParcelaPaga}`,
              SOURCE_DESCRIPTION: `boleto: ${proximaCobranca.bankSlipUrl}\npagamento: ${proximaCobranca.invoiceUrl}`,
              [bitrixVariables.negocio.cobrancaID]: proximaCobranca.id,
            });
          }

          await bitrixAPI.updateStage(dealID, Stages.AGUARDANDO_PAGAMENTO);
        }
        break;
      default:
        break;
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.log(e);
    return res.status(204).send(e);
  }
});

export default bitrixRouter;
