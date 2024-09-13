import { Request, Response, Router } from "express";

const keepAliveRouter = Router();

keepAliveRouter.get("/", (req: Request, res: Response) => {
  return res.status(200).send("ok");
});

export default keepAliveRouter;
