import { Router, type IRouter } from "express";
import healthRouter from "./health";
import caktoWebhookRouter from "./caktoWebhook";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(caktoWebhookRouter);
router.use(authRouter);

export default router;
