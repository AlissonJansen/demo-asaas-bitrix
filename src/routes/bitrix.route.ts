import { Request, Response, Router } from "express";
import { BitrixAPI } from "../utils/bitrix.api";
import { AssasAPI } from "../utils/assas.api";
import { dotenvConfig } from "../config/env.config";
import { bitrixVariables } from "../utils/bitrix.variables";

const bitrixRouter = Router();
const bitrixAPI = new BitrixAPI();

bitrixRouter.post(`/bitrix/contacts`, async (req: Request, res: Response) => {
  if (
    req.body.auth.application_token !== dotenvConfig.BITRIX.APP_TOKEN.CONTACTS
  )
    return res.status(401).send("Unauthorized");

  const contas = [dotenvConfig.ASSAS.PRIMARY, dotenvConfig.ASSAS.SECONDARY];

  const id = req.body.data.FIELDS.ID;
  const customer = await bitrixAPI.getCustomer(id).catch((e) => {});

  for (let i = 0; contas.length > i; i++) {
    const assasAPI = new AssasAPI(!!i);

    try {
      switch (req.body.event) {
        case "ONCRMCONTACTADD": // Adicionado
          await assasAPI.createCustomer({
            email: customer?.EMAIL?.[0].VALUE,
            mobilePhone: customer?.PHONE?.[0].VALUE,
            name: customer.NAME,
            addressNumber: customer[bitrixVariables.contato.addressNumber],
            address: customer[bitrixVariables.contato.endereco],
            province: customer[bitrixVariables.contato.province], // bairro
            postalCode: customer[bitrixVariables.contato.cep],
            cpfCnpj: customer[bitrixVariables.contato.cpf_cnpj],
            externalReference: id,
          });
          continue;
        case "ONCRMCONTACTUPDATE": // Alterado
          const customerID = !!i
            ? customer[bitrixVariables.contato.secondary_assasID]
            : customer[bitrixVariables.contato.primary_assasID];
          await assasAPI.updateCustomer(customerID, {
            email: customer?.EMAIL?.[0].VALUE,
            mobilePhone: customer?.PHONE?.[0].VALUE,
            name: customer.NAME,
            addressNumber: customer[bitrixVariables.contato.addressNumber],
            address: customer[bitrixVariables.contato.endereco],
            province: customer[bitrixVariables.contato.province], // bairro
            postalCode: customer[bitrixVariables.contato.cep],
            cpfCnpj: customer[bitrixVariables.contato.cpf_cnpj],
            externalReference: id,
          });
          continue;
        case "ONCRMCONTACTDELETE": // Deletado
          await assasAPI.deleteCustomer(id);
          continue;
      }

      return res.status(200).send("ok");
    } catch (e) {
      console.log(e);
      return res.status(400).send(e);
    }
  }
});

bitrixRouter.post(`/bitrix/deals`, async (req: Request, res: Response) => {
  if (req.body.auth.application_token !== dotenvConfig.BITRIX.APP_TOKEN.DEALS)
    return res.status(401).send("Unauthorized");

  const id = req.body.data.FIELDS.ID;
  const deal = await bitrixAPI.getDeal(id);
  const contaSecundaria = !!+deal[bitrixVariables.negocio.conta];
  const customer = await bitrixAPI.getCustomer(deal.CONTACT_ID);
  const assasAPI = new AssasAPI(contaSecundaria);

  try {
    switch (deal.STAGE_ID) {
      case "C9:NEW": // Entrada
        console.log(deal);
        break;
      case "C9:PREPARATION": // Solicitar pagamento
        const assasCustomer: Record<string, any> = {
          email: customer?.EMAIL?.[0].VALUE,
          mobilePhone: customer?.PHONE?.[0].VALUE.replace(/\+55/, ""),
          name: customer.NAME,
          addressNumber: customer[bitrixVariables.contato.addressNumber],
          address: customer[bitrixVariables.contato.endereco],
          province: customer[bitrixVariables.contato.province], // bairro
          postalCode: customer[bitrixVariables.contato.cep],
          cpfCnpj: customer[bitrixVariables.contato.cpf_cnpj],
          externalReference: customer.ID,
        };

        for (let field in assasCustomer) {
          if (!assasCustomer[field]) {
            await bitrixAPI.addLog(
              id,
              "Atenção! verifique se o contato não possui um dos seguintes campos",
              `Email - Telefone - Nome - Numero - Rua - Bairro - Codigo postal - cpfCnpj`,
              "attention",
              "2"
            );

            await bitrixAPI
              .updateStage(id, "C9:PREPAYMENT_INVOICE")
              .catch((e) => {}); // move para coluna de erro
            return;
          }
        }

        await assasAPI.createCustomer(assasCustomer);

        const result = await assasAPI.createBill({
          billingType: "UNDEFINED",
          dueDate: deal.CLOSEDATE.split("T")[0],
          value: +deal.OPPORTUNITY,
          customer: {
            id: customer[
              contaSecundaria
                ? bitrixVariables.contato.secondary_assasID
                : bitrixVariables.contato.primary_assasID
            ],
            externalReference: id,
          },
        });

        await bitrixAPI.updateStage(id, "C9:EXECUTING");
        await bitrixAPI.updateDeal(id, {
          customer_id: result.customer,
          deal_id: result.id,
          boleto: result.bankSlipUrl,
          pagamento: result.invoiceUrl,
        });
        await bitrixAPI.addLog(
          id,
          "Cobrança criada!",
          `Cobrança criada e enviada ao cliente!`,
          "check",
          "2"
        );
        break;
      case "C9:UC_LYDAX1": // Gerar nota fiscal
        const customerID =
          deal.SOURCE_DESCRIPTION.match(/customer_id:\s*(\w+)/)[1];
        const assasPaymentID =
          deal.SOURCE_DESCRIPTION.match(/deal_id:\s*(\w+)/)[1];
        const assasPayment = await assasAPI.getBill(assasPaymentID);

        await assasAPI.requestInvoice({
          customer: customerID,
          deductions: 0.2,
          effectiveDate: assasPayment.dateCreated,
          municipalServiceName: "Imigração italiana",
          observations:
            deal[bitrixVariables.negocio.observacoes] ||
            "desenvolvimento de software conforme solicitado",
          payment: assasPaymentID,
          municipalServiceCode: "101",
          value: assasPayment.value,
          externalReference: id,
          serviceDescription: deal[bitrixVariables.negocio.descricao],
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

        await bitrixAPI.updateStage(id, "C9:UC_S0GGXP");

        await bitrixAPI.addLog(
          id,
          "Requisição de nota fiscal criada!",
          `Nota fiscal aguardando aprovação...`,
          "check",
          "2"
        );

        break;
      default:
        break;
    }

    return res.status(200).send("ok");
  } catch (e) {
    console.log(e);
    return res.status(400).send(e);
  }
});

export default bitrixRouter;
