import { dueDateHandler } from "./dueDate.handler";

export function etapaHandler(
  etapa: number,
  pesquisa: string,
): {
  vencimento: number;
  quantidadeDeParcelas: number;
  titulo?: string;
} {
  if (pesquisa === "715") {
    switch (etapa) {
      default: {
        return {
          vencimento: 5,
          quantidadeDeParcelas: 3,
          titulo: "4ª Parcela"
        };
      }
      case 2: {
        return {
          vencimento: 5,
          quantidadeDeParcelas: 1,
          titulo: `5ª Parcela (${dueDateHandler(90)})`
        };
      }
      case 3: {
        return {
          vencimento: 5,
          quantidadeDeParcelas: 1,
          titulo: "6ª Parcela"
        };
      }
      case 4: {
        return {
          vencimento: 5,
          quantidadeDeParcelas: 1,
        };
      }
    }
  }

  switch (etapa) {
    default: {
      return {
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: "2ª Parcela" // 1ª antes
      };
    }
    case 2: {
      return {
        vencimento: 5,
        quantidadeDeParcelas: 2,
        titulo: "4ª Parcela"
      };
    }
    case 3: {
      return {
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: `5ª Parcela (${dueDateHandler(90)})`
      };
    }
    case 4: {
      return {
        vencimento: 5,
        quantidadeDeParcelas: 1,
        titulo: "6ª Parcela"
      };
    }
    case 5: {
      return {
        vencimento: 5,
        quantidadeDeParcelas: 1,
      };
    }
  }
}
