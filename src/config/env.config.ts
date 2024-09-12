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
    PRIMARY: {
      API_KEY: process.env.ASSAS_PRIMARY_API_KEY,
      WALLET_ID: process.env.ASSAS_PRIMARY_WALLET_ID,
    },
    SECONDARY: {
      API_KEY: process.env.ASSAS_SECONDARY_API_KEY,
      WALLET_ID: process.env.ASSAS_SECONDARY_WALLET_ID,
    },
    WEBHOOK_TOKEN: process.env.ASSAS_WEBHOOK_TOKEN,
  },
};
