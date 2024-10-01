import { dotenvConfig } from "../config/env.config";

export function accountHandler(conta: { ID: string; VALUE: string }) {
  return conta.ID === "727"
    ? [ dotenvConfig.ASSAS.ROSAS.API_KEY, dotenvConfig.ASSAS.ROSAS.WALLET_ID, conta.VALUE ]
    : [ dotenvConfig.ASSAS.ROZZA.API_KEY, dotenvConfig.ASSAS.ROZZA.WALLET_ID, conta.VALUE ];
}
