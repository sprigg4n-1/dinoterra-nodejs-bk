import { Router } from "express";
import {
  getArchaeologists,
  getArchaeologist,
  createArchaeologist,
  changeArchaeologist,
  deleteArchaeologist,
  uploadPhoto,
  deletePhoto,
} from "../controllers/archaeologist.controller.js";

const archaeologistRouter = Router();

archaeologistRouter.get("/", getArchaeologists);
archaeologistRouter.get("/:id", getArchaeologist);
archaeologistRouter.post("/", createArchaeologist);
archaeologistRouter.put("/:id", changeArchaeologist);
archaeologistRouter.delete("/:id", deleteArchaeologist);
archaeologistRouter.post("/upload-image", uploadPhoto);
archaeologistRouter.delete("/images/:id", deletePhoto);

export default archaeologistRouter;
