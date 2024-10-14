import { dueDateHandler } from "./dueDate.handler";

export function etapaHandler(
  etapa: number,
  pesquisa: string,
): {
  vencimento: number;
  quantidadeDeParcelas: number;
  parcelasAnteriores: number;
  titulo?: string;
} {
  if (pesquisa === "715") {
    switch (etapa) { // sem pesquisa
      default: {
        return {
          parcelasAnteriores: 0,
          vencimento: 5,
          quantidadeDeParcelas: 3,
          titulo: "4ª Parcela"
        };
      }
      case 2: {
        return {
          parcelasAnteriores: 3,
          vencimento: 5,
          quantidadeDeParcelas: 1,
          titulo: `5ª Parcela (${dueDateHandler(90, true)})`
        };
      }
      case 3: {
        return {
          parcelasAnteriores: 4,
          vencimento: 5,
          quantidadeDeParcelas: 1,
          titulo: "6ª Parcela"
        };
      }
      case 4: {
        return {
          parcelasAnteriores: 5,
          vencimento: 5,
          quantidadeDeParcelas: 1,
        };
      }
    }
  }

  switch (etapa) { // com pesquisa
    default: {
      return {
        parcelasAnteriores: 0,
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: "2ª e 3ª Parcela" // 1ª antes
      };
    }
    case 2: {
      return {
        parcelasAnteriores: 1,
        vencimento: 5,
        quantidadeDeParcelas: 2,
        titulo: "4ª Parcela"
      };
    }
    case 3: {
      return {
        parcelasAnteriores: 3,
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: `5ª Parcela (${dueDateHandler(90, true)})`
      };
    }
    case 4: {
      return {
        parcelasAnteriores: 4,
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: "6ª Parcela"
      };
    }
    case 5: {
      return {
        parcelasAnteriores: 5,
        vencimento: 5,
        quantidadeDeParcelas: 1,
      };
    }
  }
}
