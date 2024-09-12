import { Application } from "express";
import cors from "cors";
import bitrixRouter from "../routes/bitrix.route";
import AssasRouter from "../routes/assas.route";
import express from "express";

export function appConfig(app: Application) {
  const routers = [bitrixRouter, AssasRouter];

  app.use(
    express.json(),
    express.urlencoded(),
    cors({ origin: "*" }),
    ...routers
  );
}
