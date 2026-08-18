import { Router, type IRouter } from "express";
import healthRouter from "./health";
import caktoWebhookRouter from "./caktoWebhook";

const router: IRouter = Router();

router.use(healthRouter);
router.use(caktoWebhookRouter);

export default router;
