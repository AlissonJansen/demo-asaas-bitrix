import { AssasAPI } from "../apis/assas.api";
import { BitrixAPI } from "../apis/bitrix.api";
import { Stages } from "../interfaces/stages";
import { bitrixVariables } from "./bitrix.variables";
import { dueDateHandler } from "./dueDate.handler";
import { contas, parcelas } from "./enums";
import { etapaHandler } from "./etapa.handler";

export async function paymentHandler(
  deal: any,
  bitrixContact: any,
  assasAPI: AssasAPI
) {
  const parcelamento = parcelas.find(
    (parcela) => parcela.ID === deal[bitrixVariables.negocio.parcelamento]
  );
  const [valorParcela, moeda] =
    deal[bitrixVariables.negocio.valor_das_parcelas].split("|");
  const entradaPaga = !!+deal[bitrixVariables.negocio.entrada_paga];

  if (parcelamento?.ID.match(/^(719|721|723)$/)) {
    // em 10, 12 ou 18 vezes
    if (!entradaPaga) {
      const result = await assasAPI.cobranca({
        billingType: "BOLETO",
        dueDate: dueDateHandler(5),
        value: +deal.OPPORTUNITY,
        description: deal[bitrixVariables.negocio.descricao],
        customer: {
          id: bitrixContact[
            assasAPI.account === "Rozza"
              ? bitrixVariables.contato.rozza_assasID
              : bitrixVariables.contato.rosas_assasID
          ],
          externalReference: `${deal.ID}||Entrada||${
            assasAPI.account === "Rozza"
              ? `${contas[1].ID}-${contas[1].VALUE}`
              : `${contas[0].ID}-${contas[0].VALUE}`
          }`,
        },
      });

      return result;
    }

    const result = await assasAPI.pagamentoParcelado({
      billingType: "BOLETO",
      dueDate: dueDateHandler(5),
      installmentValue: valorParcela,
      description: deal[bitrixVariables.negocio.descricao],
      customer: {
        id: bitrixContact[
          assasAPI.account === "Rozza"
            ? bitrixVariables.contato.rozza_assasID
            : bitrixVariables.contato.rosas_assasID
        ],
        externalReference:
          deal.ID +
          "||Parcela||" +
          (assasAPI.account === "Rozza"
            ? `${contas[1].ID}-${contas[1].VALUE}`
            : `${contas[0].ID}-${contas[0].VALUE}`),
      },
      installmentCount: +parcelamento.VALUE,
    });

    return result;
  }

  if (parcelamento?.ID.match(/^(715|717)$/)) {
    // 6 vezes com ou sem pesquisa
    if (!entradaPaga) {
      const result = await assasAPI.cobranca({
        billingType: "BOLETO",
        dueDate: dueDateHandler(5),
        value: +deal.OPPORTUNITY,
        description: deal[bitrixVariables.negocio.descricao],
        customer: {
          id: bitrixContact[
            assasAPI.account === "Rozza"
              ? bitrixVariables.contato.rozza_assasID
              : bitrixVariables.contato.rosas_assasID
          ],
          externalReference: `${deal.ID}||Entrada||${
            assasAPI.account === "Rozza"
              ? `${contas[1].ID}-${contas[1].VALUE}`
              : `${contas[0].ID}-${contas[0].VALUE}`
          }`,
        },
      });

      return result;
    }

    if (parcelamento.ID === "715") {
      const etapa = etapaHandler(
        +deal[bitrixVariables.negocio.etapa_atual],
        "715"
      );

      const result = await assasAPI.pagamentoParcelado({
        billingType: "BOLETO",
        dueDate: dueDateHandler(etapa.vencimento),
        installmentValue: valorParcela,
        description: deal[bitrixVariables.negocio.descricao],
        customer: {
          id: bitrixContact[
            assasAPI.account === "Rozza"
              ? bitrixVariables.contato.rozza_assasID
              : bitrixVariables.contato.rosas_assasID
          ],
          externalReference:
            deal.ID +
            "||Parcela||" +
            (assasAPI.account === "Rozza"
              ? `${contas[1].ID}-${contas[1].VALUE}`
              : `${contas[0].ID}-${contas[0].VALUE}`),
        },
        installmentCount: etapa.quantidadeDeParcelas,
      });

      return result;
    }

    if (parcelamento.ID === "717") {
      // com pesquisa
      const etapa = etapaHandler(
        +deal[bitrixVariables.negocio.etapa_atual],
        "717"
      );

      const result = await assasAPI.pagamentoParcelado({
        billingType: "BOLETO",
        dueDate: dueDateHandler(etapa.vencimento),
        installmentValue: valorParcela,
        description: deal[bitrixVariables.negocio.descricao],
        customer: {
          id: bitrixContact[
            assasAPI.account === "Rozza"
              ? bitrixVariables.contato.rozza_assasID
              : bitrixVariables.contato.rosas_assasID
          ],
          externalReference:
            deal.ID +
            "||Parcela||" +
            (assasAPI.account === "Rozza"
              ? `${contas[1].ID}-${contas[1].VALUE}`
              : `${contas[0].ID}-${contas[0].VALUE}`),
        },
        installmentCount: etapa.quantidadeDeParcelas,
      });

      return result;
    }
  }

  if (parcelamento?.ID.match(/^(725)$/)) {
    // À vista
    const result = await assasAPI.cobranca({
      billingType: "BOLETO",
      dueDate: dueDateHandler(5),
      value: +deal.OPPORTUNITY,
      description: deal[bitrixVariables.negocio.descricao],
      customer: {
        id: bitrixContact[
          assasAPI.account === "Rozza"
            ? bitrixVariables.contato.rozza_assasID
            : bitrixVariables.contato.rosas_assasID
        ],
        externalReference:
          deal.ID +
          "||A vista||" +
          (assasAPI.account === "Rozza"
            ? `${contas[1].ID}-${contas[1].VALUE}`
            : `${contas[0].ID}-${contas[0].VALUE}`),
      },
    });

    return result;
  }
}
