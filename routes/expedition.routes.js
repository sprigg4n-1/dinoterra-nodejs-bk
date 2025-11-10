import { Router } from "express";
import {
  getExpeditions,
  getExpedition,
  createExpedition,
  changeExpedition,
  deleteExpedition,
  uploadPhoto,
  deletePhoto,
} from "../controllers/expedition.controller.js";

const expeditionRouter = Router();

expeditionRouter.get("/", getExpeditions);
expeditionRouter.get("/:id", getExpedition);
expeditionRouter.post("/", createExpedition);
expeditionRouter.put("/:id", changeExpedition);
expeditionRouter.delete("/:id", deleteExpedition);
expeditionRouter.post("/upload-image", uploadPhoto);
expeditionRouter.delete("/images/:id", deletePhoto);

export default expeditionRouter;
