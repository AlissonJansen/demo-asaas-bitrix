import express from "express";
import { appConfig } from "./config/app.config";

const app = express();
const port = process.env.PORT || 5500;

appConfig(app);

app.listen(port, () => {
  console.log("app rodando");
});