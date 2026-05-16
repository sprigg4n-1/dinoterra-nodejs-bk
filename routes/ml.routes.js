import { Router } from "express";
import {
  classify,
  giveFeedback,
  adminClassify,
  getRetrainImages,
  deleteRetrainImages,
  getPredictions,
  getStats,
  retrainTrigger,
  retrainDone,
  getRetrainHistory,
  getRetrainHistoryById,
} from "../controllers/ml.controller.js";

const mlRouter = Router();

// User
mlRouter.post("/classify", classify);
mlRouter.post("/classify/:id/feedback", giveFeedback);

// Admin
mlRouter.post("/admin/classify", adminClassify);
mlRouter.get("/admin/predictions", getPredictions);
mlRouter.get("/admin/stats", getStats);
mlRouter.post("/admin/retrain", retrainTrigger);
mlRouter.post("/admin/retrain/done", retrainDone);
mlRouter.get("/admin/retrain/history", getRetrainHistory);
mlRouter.get("/admin/retrain/history/:id", getRetrainHistoryById);
mlRouter.get("/admin/retrain-images", getRetrainImages);
mlRouter.delete("/admin/retrain-images", deleteRetrainImages);

export default mlRouter;
