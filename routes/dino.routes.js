import { Router } from "express";
import {
  addFoundLocation,
  changeDino,
  createDino,
  deleteDino,
  deleteFoundLocation,
  deletePhoto,
  getDino,
  getDinos,
  getFiveRandomDinos,
  getFoundLocations,
  getSimilarDinos,
  uploadPhoto,
} from "../controllers/dino.controller.js";

const dinoRouter = Router();

dinoRouter.get("/", getDinos);
dinoRouter.get("/random", getFiveRandomDinos);
dinoRouter.get("/found-locations", getFoundLocations);
dinoRouter.post("/found-location", addFoundLocation);
dinoRouter.delete("/found-locations/:id", deleteFoundLocation);
dinoRouter.post("/upload-image", uploadPhoto);
dinoRouter.delete("/images/:id", deletePhoto);

dinoRouter.get("/:id/similar", getSimilarDinos);
dinoRouter.get("/:id", getDino);
dinoRouter.post("/", createDino);
dinoRouter.put("/:id", changeDino);
dinoRouter.delete("/:id", deleteDino);

export default dinoRouter;
