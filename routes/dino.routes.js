import { Router } from "express";
import {
  changeDino,
  createDino,
  deleteDino,
  getDino,
  getDinos,
  getFiveRandomDinos,
  getSimilarDinos,
} from "../controllers/dino.controller.js";

const dinoRouter = Router();

dinoRouter.get("/", getDinos);
dinoRouter.get("/random", getFiveRandomDinos);
dinoRouter.get("/:id/similar", getSimilarDinos);

dinoRouter.get("/:id", getDino);
dinoRouter.post("/", createDino);
dinoRouter.put("/:id", changeDino);
dinoRouter.delete("/:id", deleteDino);

export default dinoRouter;
