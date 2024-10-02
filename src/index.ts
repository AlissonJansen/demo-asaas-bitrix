import express from "express";
import { appConfig } from "./config/app.config";
import { keepAlive } from "./utils/keepAlive";

// https://demo-asaas-bitrix-8b6q.onrender.com

const app = express();
const port = process.env.PORT || 5500;

appConfig(app);

setInterval(keepAlive, 50000);

app.listen(port, () => {
  console.log("app rodando");
});