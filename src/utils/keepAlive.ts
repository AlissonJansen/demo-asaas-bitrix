import { dotenvConfig } from "../config/env.config";

export async function keepAlive() {
  const url = dotenvConfig.ASSAS.DEV_ASAAS_URL
    ? "https://demo-asaas-bitrix-1.onrender.com"
    : "https://demo-asaas-bitrix-8b6q.onrender.com";

  await fetch(url).catch((e) => console.log(e));
}
