import { dotenvConfig } from "../config/env.config";
import { BillingData } from "../interfaces/billing.interface";
import { InvoiceData } from "../interfaces/invoice.interface";
import { Customer } from "../validators/contact.validator";
import { BitrixAPI } from "./bitrix.api";
import { phone } from "phone";

export class AssasAPI {
  constructor(private readonly contaSecundaria: boolean) {}

  private readonly API_KEY = this.contaSecundaria
    ? dotenvConfig.ASSAS.SECONDARY.API_KEY
    : dotenvConfig.ASSAS.PRIMARY.API_KEY;
  private readonly WALLET = this.contaSecundaria
    ? dotenvConfig.ASSAS.SECONDARY.WALLET_ID
    : dotenvConfig.ASSAS.PRIMARY.WALLET_ID;

  private readonly url = "https://sandbox.asaas.com/api/v3";
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
    const customer = await this.findCustomerByEmail(customerData.email);

    if (customer) {
      await this.bitrixAPI.addAssasID(
        customer.externalReference,
        customer.id,
        this.contaSecundaria
      );
      return customer;
    }

    const numero = phone(customerData.mobilePhone);

    if (!numero.isValid) {
      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro criando cliente no Assas",
        `Numero de telefone inválido`,
        "attention",
        "3"
      ); // Adiciona log de erro

      await this.bitrixAPI
        .updateStage(+customerData.externalReference!, "C9:PREPAYMENT_INVOICE")
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
        "3"
      ); // Adiciona log de erro

      await this.bitrixAPI
        .updateStage(+customerData.externalReference!, "C9:PREPAYMENT_INVOICE")
        .catch((e) => {}); // move para coluna de erro

      throw new Error(
        `Não foi possível criar o cliente no Assas - ${data.externalReference}`
      );
    }

    await this.bitrixAPI.addAssasID(
      data.externalReference,
      data.id,
      this.contaSecundaria
    );

    return data;
  }

  async updateCustomer(customerID: string, customerData: Customer) {
    // checa se o cliente existe, se não existe, cria e retorna o id.

    if (!customerID) return await this.createCustomer(customerData);

    const numero = phone(customerData.mobilePhone);

    if (!numero.isValid) {
      await this.bitrixAPI.addLog(
        +customerData.externalReference!,
        "Erro alterando cliente no Asaas",
        `Numero de telefone inválido`,
        "attention",
        "3"
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
        "3"
      ); // Adiciona log de erro

      throw new Error();
    }

    await this.bitrixAPI.addLog(
      +customerData.externalReference!,
      "Usuário alterado com sucesso!",
      `Update realizado com sucesso no Assas`,
      "check",
      "3"
    );

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

  async createBill(billingData: BillingData) {
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
        +billingData.customer.externalReference,
        "Erro criando cobrança no Assas",
        `${errorsList}`,
        "attention",
        "2"
      ); // Adiciona log de erro

      await this.bitrixAPI.updateStage(
        +billingData.customer.externalReference,
        "C9:PREPAYMENT_INVOICE"
      ); // move para coluna de erro

      throw new Error(`Erro ao criar cobrança: ${response.statusText}`);
    }

    return data;
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
        "2"
      ); // Adiciona log de erro

      await this.bitrixAPI.updateStage(
        +invoiceData.externalReference!,
        "C9:UC_C1T4PT"
      ); // move para coluna de erro

      throw new Error(
        `Erro ao gerar requisição de nota fiscal: ${response.statusText}`
      );
    }

    return data;
  }
}
