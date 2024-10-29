import { AssasAPI } from "../apis/assas.api";
import { BitrixAPI } from "../apis/bitrix.api";
import { customerValidator } from "../validators/customer.validator";
import { bitrixVariables } from "./bitrix.variables";

export async function CreateMissingAsaasCustomer(
  bitrixContact: any,
  assasAPI: AssasAPI,
  deal: any
) {
  const bitrixAPI = new BitrixAPI();
  const newAsaasCustomer: Record<string, any> = {
    email: bitrixContact?.EMAIL?.[0].VALUE,
    mobilePhone: bitrixContact?.PHONE?.[0].VALUE,
    name: bitrixContact.NAME,
    addressNumber: bitrixContact[bitrixVariables.contato.addressNumber],
    address: bitrixContact[bitrixVariables.contato.endereco],
    province: bitrixContact[bitrixVariables.contato.province], // bairro
    postalCode: bitrixContact[bitrixVariables.contato.cep],
    cpfCnpj: bitrixContact[bitrixVariables.contato.cpf_cnpj],
    externalReference: bitrixContact.ID,
  };

  const valid = await customerValidator(
    newAsaasCustomer,
    deal.ID,
    bitrixContact.ID
  );

  if (!valid) return;

  const novoContato = await assasAPI.createCustomer(newAsaasCustomer);

  await bitrixAPI.addLog(
    deal.ID,
    "Contato criado!",
    `Contato adicionado na conta ${assasAPI.account} com sucesso!`,
    "check",
    "deal"
  );

  await bitrixAPI
    .addAssasID(novoContato.externalReference, novoContato.id, assasAPI.WALLET)
    .catch((e) => {});
}
