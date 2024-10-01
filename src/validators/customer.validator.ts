import { BitrixAPI } from "../apis/bitrix.api";
import { Stages } from "../interfaces/stages";

export async function customerValidator(assasCustomer: any, dealID: number, customerID: number) {
    const bitrixAPI = new BitrixAPI();
  for (let field in assasCustomer) {
    if (!assasCustomer[field]) {
      await bitrixAPI.updateStage(dealID, Stages.ERRO_SOLICITANDO_PAGAMENTO).catch((e) => {}); // move para coluna de erro

      await bitrixAPI.addLog(
        dealID,
        "Atenção! verifique se o contato não possui um dos seguintes campos",
        `Email - Telefone - Nome - Numero - Rua - Bairro - Codigo postal - cpfCnpj`,
        "attention",
        "deal"
      );

      await bitrixAPI.addLog(
        customerID,
        "Atenção! Para criar uma cobraça com este cliente, devem ser informados:",
        `Email - Telefone - Nome - Numero - Rua - Bairro - Codigo postal - cpfCnpj`,
        "attention",
        "contact"
      );

      return false;
    }

    return true;
  }
}
