import { dotenvConfig } from "../config/env.config";
import { BillingData } from "../interfaces/billing.interface";
import { InvoiceData } from "../interfaces/invoice.interface";
import { Parcelamento } from "../interfaces/parcelamento.interface";
import { Stages } from "../interfaces/stages";
import { accountHandler } from "../utils/account.handler";
import { BitrixAPI } from "./bitrix.api";
import { phone } from "phone";

export class AssasAPI {
  constructor(conta: { ID: string; VALUE: string }) {
    [this.API_KEY, this.WALLET, this.account] = accountHandler(conta);
  }

  private readonly WALLET: string;
  private readonly API_KEY: string;
  readonly account: string;

  private readonly url = "https://api.asaas.com/v3";
  private readonly bitrixAPI = new BitrixAPI();

  async findCustomerByEmail(email: string): Promise<any> {
    const options: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
    };

    const response = await fetch(
      `${this.url}/customers?email=${email}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao buscar cliente por email: ${response.statusText}`
      );

    const data = await response.json();

    return data.data[0] || null;
  }

  async findCustomerByExternalReference(externalReference: string) {
    const options: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
    };

    const response = await fetch(
      `${this.url}/customers?externalReference=${externalReference}`,
      options
    );

    if (!response.ok)
      throw new Error(
        `Erro ao buscar cliente por email: ${response.statusText}`
      );

    const data = await response.json();

    return data.data[0] || null;
  }

  async createCustomer(customerData: any) {
    const numero = phone(customerData.mobilePhone);

    if (!numero.isValid) {
      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro criando cliente no Assas",
        `Numero de telefone inválido`,
        "attention",
        "contact"
      ); // Adiciona log de erro

      await this.bitrixAPI
        .updateStage(
          +customerData.externalReference!,
          Stages.ERRO_SOLICITANDO_PAGAMENTO
        )
        .catch((e) => {}); // move para coluna de erro

      throw new Error("Numero de telefone informado na criação é inválido");
    }

    const options: RequestInit = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
      body: JSON.stringify({
        ...customerData,
        mobilePhone: numero.phoneNumber.replace(numero.countryCode, ""),
      }),
    };

    const response = await fetch(`${this.url}/customers`, options);

    const data = await response.json();

    if (!response.ok) {
      // cria lista de erros
      const errorsList = data.errors
        .map(
          (erro: { code: string; description: string }) =>
            `- ${erro.description}\n`
        )
        .join();

      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro criando cliente no Assas",
        `${errorsList}`,
        "attention",
        "contact"
      ); // Adiciona log de erro

      await this.bitrixAPI
        .updateStage(+customerData.externalReference!, "C9:PREPAYMENT_INVOICE")
        .catch((e) => {}); // move para coluna de erro

      throw new Error(
        `Não foi possível criar o cliente no Assas - ${data.externalReference}`
      );
    }

    return data;
  }

  async updateCustomer(customerID: string, customerData: Record<string, any>) {
    const numero = phone(customerData.mobilePhone);

    if (!numero.isValid) {
      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro alterando cliente no Asaas",
        `Numero de telefone inválido`,
        "attention",
        "contact"
      ); // Adiciona log de erro

      return;
    }

    const options: RequestInit = {
      method: "PUT",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
      body: JSON.stringify({
        ...customerData,
        mobilePhone: customerData.mobilePhone.replace(numero.countryCode, ""),
      }),
    };

    const response = await fetch(
      `${this.url}/customers/${customerID}`,
      options
    );

    const data = await response.json();

    if (!response.ok) {
      // cria lista de erros
      const errorsList = data.errors
        .map(
          (erro: { code: string; description: string }) =>
            `- ${erro.description}\n`
        )
        .join();

      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro alterando cliente no Asaas",
        `${errorsList}`,
        "attention",
        "contact"
      ); // Adiciona log de erro

      throw new Error(errorsList);
    }

    return data;
  }

  async deleteCustomer(externalReference: string) {
    const customer = await this.findCustomerByExternalReference(
      externalReference
    );

    if (!customer) return "cliente ja deletado";

    const options: RequestInit = {
      method: "DELETE",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
    };

    const response = await fetch(
      `${this.url}/customers/${customer.id}`,
      options
    );

    if (!response.ok)
      throw new Error(`Erro ao deletar cliente: ${response.statusText}`);

    const data = await response.json();

    return data.id;
  }

  async getBill(id: string) {
    const options: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
    };

    const response = await fetch(`${this.url}/payments/${id}`, options);

    if (!response.ok)
      throw new Error(`Erro ao criar cobrança: ${response.statusText}`);

    const data = await response.json();

    return data;
  }

  async cobranca(billingData: BillingData) {
    const options: RequestInit = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
      body: JSON.stringify({
        ...billingData,
        customer: billingData.customer.id,
        externalReference: billingData.customer.externalReference,
      }),
    };

    this.bitrixAPI.addLog(
      11005,
      "teste",
      JSON.stringify(billingData),
      "attention",
      "deal"
    );

    this.bitrixAPI.addLog(
      11005,
      "teste 2",
      `${this.API_KEY}|${this.WALLET}`,
      "attention",
      "deal"
    );

    const response = await fetch(`${this.url}/payments`, options);
    const dealID = billingData.customer.externalReference.split("||")[0];
    const data = await response.json();

    if (!response.ok) {
      // cria lista de erros
      const errorsList = data.errors
        .map(
          (erro: { code: string; description: string }) =>
            `- ${erro.description}\n`
        )
        .join();

      await this.bitrixAPI.addLog(
        dealID,
        "Erro criando cobrança no Assas",
        `${errorsList}`,
        "attention",
        "deal"
      ); // Adiciona log de erro

      await this.bitrixAPI.updateStage(
        dealID,
        Stages.ERRO_SOLICITANDO_PAGAMENTO
      ); // move para coluna de erro

      throw new Error(`Erro ao criar cobrança ${response.statusText}`);
    }

    return data;
  }

  async pagamentoParcelado(parcelamento: Parcelamento) {
    const options: RequestInit = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
      body: JSON.stringify({
        ...parcelamento,
        customer: parcelamento.customer.id,
        externalReference: parcelamento.customer.externalReference,
      }),
    };

    const dealID = parcelamento.customer.externalReference.split("||")[0];

    const response = await fetch(`${this.url}/payments`, options);

    const data = await response.json();

    if (!response.ok) {
      // cria lista de erros
      const errorsList = data.errors
        .map(
          (erro: { code: string; description: string }) =>
            `- ${erro.description}\n`
        )
        .join();

      await this.bitrixAPI.addLog(
        dealID,
        "Erro criando parcelamento no Assas",
        `${errorsList}`,
        "attention",
        "deal"
      ); // Adiciona log de erro

      await this.bitrixAPI.updateStage(
        dealID,
        Stages.ERRO_SOLICITANDO_PAGAMENTO
      ); // move para coluna de erro

      throw new Error(`Erro ao criar parcelamento: ${response.statusText}`);
    }

    return data;
  }

  async getParcelamento_cobrancas(parcelamentoID: string) {
    const options: RequestInit = {
      method: "GET",
      headers: {
        accept: "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
    };

    const response = await fetch(
      `${this.url}/installments/${parcelamentoID}/payments?limit=20`,
      options
    );

    const data = await response.json();

    return data.data;
  }

  async requestInvoice(invoiceData: InvoiceData) {
    const options: RequestInit = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        access_token: this.API_KEY!,
        "User-Agent": this.WALLET!,
      },
      body: JSON.stringify(invoiceData),
    };

    const response = await fetch(`${this.url}/invoices`, options);

    const data = await response.json();

    if (
      data?.errors?.[0]?.description ===
      "Já existe uma nota fiscal agendada para essa cobrança."
    ) {
      return data;
    }

    if (!response.ok) {
      // cria lista de erros
      const errorsList = data.errors
        .map(
          (erro: { code: string; description: string }) =>
            `- ${erro.description}\n`
        )
        .join();

      await this.bitrixAPI.addLog(
        +invoiceData.externalReference!,
        "Erro gerando requisição de nota fiscal",
        `${errorsList}`,
        "attention",
        "deal"
      ); // Adiciona log de erro

      await this.bitrixAPI.updateStage(
        +invoiceData.externalReference!,
        Stages.ERRO_GERANDO_NOTA_FISCAL
      ); // move para coluna de erro

      throw new Error(
        `Erro ao gerar requisição de nota fiscal: ${response.statusText}`
      );
    }

    return data;
  }
}
