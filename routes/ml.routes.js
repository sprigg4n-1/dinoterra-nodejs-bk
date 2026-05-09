import { Router } from "express";
import {
  classify,
  giveFeedback,
  adminClassify,
  getPredictions,
  getStats,
  retrainTrigger,
} from "../controllers/ml.controller.js";

const mlRouter = Router();

mlRouter.post("/classify", classify);
mlRouter.post("/classify/:id/feedback", giveFeedback);

mlRouter.post("/admin/classify", adminClassify);
mlRouter.get("/admin/predictions", getPredictions);
mlRouter.get("/admin/stats", getStats);
mlRouter.post("/admin/retrain", retrainTrigger);

export default mlRouter;
