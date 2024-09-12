import express from "express";
import { appConfig } from "./config/app.config";

const app = express();

appConfig(app);

app.listen(5500, () => {
  console.log("app rodando");
});