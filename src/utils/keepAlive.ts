import { dotenvConfig } from "../config/env.config";

export async function keepAlive() {
  const url = dotenvConfig.ASSAS.DEV_ASAAS_URL
    ? "https://kit-notable-fish.ngrok-free.app"
    : "https://demo-asaas-bitrix-8b6q.onrender.com";

  await fetch(url).catch((e) => console.log(e));
}
