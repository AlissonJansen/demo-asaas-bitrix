import { dotenvConfig } from "../config/env.config";
import { Stages } from "../interfaces/stages.interface";
import { bitrixVariables } from "./bitrix.variables";

export class BitrixAPI {
  private bitrix_access_token =
    "dd2ee366007139f9006d89e900000823a0ab07a0866f36907e25be2aae5c6a6880ba19";
  private bitrix_refresh_token =
    "cdad0a67007139f9006d89e900000823a0ab070eb122f2ac55b18326f4da3c3a62b6d9";

  private async reset_tokens() {
    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/oauth/token/` +
        `?client_id=${dotenvConfig.BITRIX.CLIENT_ID}` +
        "&grant_type=refresh_token" +
        `&client_secret=${dotenvConfig.BITRIX.CLIENT_SECRET}` +
        "&redirect_uri=http%3A%2F%2Flocalhost%2Ftest%2Findex.php" +
        `&refresh_token=${this.bitrix_refresh_token}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao gerar novo token de aplicação: ${response.statusText}`
      );

    const data = await response.json();

    return {
      refresh_token: data.refresh_token,
      access_token: data.access_token,
    };
  }

  private async grantValidToken() {
    for (let i = 0; i <= 3; i++) {
      const options: RequestInit = {
        method: "GET",
      };

      const response = await fetch(
        `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.deal.list/` +
          `?auth=${this.bitrix_access_token}`,
        options
      );

      if (response.ok) break;

      if (i === 3)
        throw new Error("Houve um erro garantindo a validação do token");

      if (response.status === 401) {
        const { access_token, refresh_token } = await this.reset_tokens();

        this.bitrix_access_token = access_token;
        this.bitrix_refresh_token = refresh_token;
      }
    }

    console.log({
      refresh_token: this.bitrix_refresh_token,
      access_token: this.bitrix_access_token,
    });

    return true;
  }

  async getDeal(dealID: number) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.deal.get/` +
        `?auth=${this.bitrix_access_token}` +
        `&id=${dealID}`,
      options
    );

    if (!response.ok)
      throw new Error(`Erro ao buscar Negócio: ${response.statusText}`);

    const data = await response.json();

    return data.result;
  }

  async getCustomer(customerID: string) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.contact.get/` +
        `?auth=${this.bitrix_access_token}` +
        `&id=${customerID}`,
      options
    );

    if (!response.ok)
      throw new Error(`Erro ao buscar Cliente: ${response.statusText}`);

    const data = await response.json();

    return data.result;
  }

  async updateStage(dealID: number, stage: Stages) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.deal.update/` +
        `?auth=${this.bitrix_access_token}` +
        `&id=${dealID}` +
        `&fields[STAGE_ID]=${stage}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao alterar status da cobrança no bitrix: ${response.statusText}`
      );

    const data = await response.json();

    return data.result;
  }

  async updateDeal(
    dealID: number,
    updates: { boleto?: string; customer_id?: string; deal_id?: string; pagamento?: string }
  ) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const source_description = `boleto: ${updates.boleto}\npagamento: ${updates.pagamento}\n\ncustomer_id: ${updates.customer_id}\ndeal_id: ${updates.deal_id}\n`;

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.deal.update/` +
        `?auth=${this.bitrix_access_token}` +
        `&id=${dealID}` +
        `&fields[SOURCE_DESCRIPTION]=${encodeURIComponent(source_description)}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao alterar status da cobrança no bitrix: ${response.statusText}`
      );

    const data = await response.json();

    return data.result;
  }

  async attachInvoice(dealID: number, invoice?: string) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const source_description = `invoice: ${invoice}`;

    // link: ${updates.link}\n

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.deal.update/` +
        `?auth=${this.bitrix_access_token}` +
        `&id=${dealID}` +
        `&fields[SOURCE_DESCRIPTION]=${encodeURIComponent(source_description)}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao anexar invoice no Negócio ${dealID} do bitrix: ${response.statusText}`
      );

    const data = await response.json();

    return data.result;
  }

  async addLog(
    dealID: number,
    title: string,
    text: string,
    icon: "attention" | "info" | "check",
    entityTypeID: "2" | "3"
  ) {
    // 2 = deal
    // 3 = contact
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.timeline.logmessage.add/` +
        `?auth=${this.bitrix_access_token}` +
        `&fields[entityTypeId]=${entityTypeID}` +
        `&fields[entityId]=${dealID}` +
        `&fields[title]=${encodeURIComponent(title)}` +
        `&fields[text]=${encodeURIComponent(text)}` +
        `&fields[iconCode]=${icon}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao adicionar Log no Negócio ${dealID} do bitrix: ${response.statusText}`
      );

    const data = await response.json();

    return data.result;
  }

  async addCommentInTimeline(dealID: number, comment: string) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.timeline.comment.add/` +
        `?auth=${this.bitrix_access_token}` +
        `&fields[ENTITY_ID]=${dealID}` +
        `&fields[COMMENT]=${encodeURIComponent(comment)}` +
        `&fields[ENTITY_TYPE]=deal`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao adicionar comentário no Negócio ${dealID} do bitrix: ${response.statusText}`
      );

    const data = await response.json();

    return data.result;
  }

  async addAssasID(bitrixID: number, assasCustomerID: string, contaSecundaria?: boolean) {
    await this.grantValidToken();

    const options: RequestInit = {
      method: "GET",
    };

    const contaID = contaSecundaria ? bitrixVariables.contato.secondary_assasID : bitrixVariables.contato.primary_assasID;

    const response = await fetch(
      `https://${dotenvConfig.BITRIX.ID}.bitrix24.com.br/rest/crm.contact.update/` +
        `?auth=${this.bitrix_access_token}` +
        `&fields[${contaID}]=${assasCustomerID}` +
        `&id=${bitrixID}`,
      options
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        `Erro ao adicionar id do assas no contato do bitrix: ${response.statusText}`
      );
    }

    await this.addLog(
      bitrixID,
      "Contato adicionado!",
      `Contato adicionado na conta do Assas com sucesso!`,
      "check",
      "3"
    );

    return data.result;
  }
}
