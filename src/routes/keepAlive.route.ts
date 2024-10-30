import { Request, Response, Router } from "express";
import pJson from "../../package.json";

const keepAliveRouter = Router();

keepAliveRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).send(pJson.version);
});

export default keepAliveRouter;
