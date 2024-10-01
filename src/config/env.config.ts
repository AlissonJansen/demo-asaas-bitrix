import { configDotenv } from "dotenv";

configDotenv();

export const dotenvConfig = {
  BITRIX: {
    CLIENT_ID: process.env.BITRIX_CLIENT_ID,
    CLIENT_SECRET: process.env.BITRIX_CLIENT_SECRET,
    ID: process.env.BITRIX_ID,
    APP_TOKEN: {
      CONTACTS: process.env.BITRIX_APP_TOKEN_CONTACTS,
      DEALS: process.env.BITRIX_APP_TOKEN_DEALS,
    },
  },
  ASSAS: {
    ROSAS: {
      API_KEY: process.env.ASSAS_ROSAS_API_KEY!,
      WALLET_ID: process.env.ASSAS_ROSAS_WALLET_ID!,
    },
    ROZZA: {
      API_KEY: process.env.ASSAS_ROZZA_API_KEY!,
      WALLET_ID: process.env.ASSAS_ROZZA_WALLET_ID!,
    },
    WEBHOOK_TOKEN: process.env.ASSAS_WEBHOOK_TOKEN,
  },
};
