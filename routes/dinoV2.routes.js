import { Router } from "express";
import {
  getDinosV2,
  getFiveRandomDinosV2,
  getSimilarDinosV2,
  getDinoV2,
  createDinoV2,
  updateDinoV2,
  deleteDinoV2,
  uploadCoverImageV2,
  deleteCoverImageV2,
  uploadArticleImageV2,
  deleteArticleImageV2,
  getFoundLocationsV2,
  addFoundLocationV2,
  deleteFoundLocationV2,
} from "../controllers/dinoV2.controller.js";

const dinoV2Router = Router();

dinoV2Router.get("/", getDinosV2);
dinoV2Router.get("/random", getFiveRandomDinosV2);

dinoV2Router.get("/found-locations", getFoundLocationsV2);
dinoV2Router.post("/found-location", addFoundLocationV2);
dinoV2Router.delete("/found-locations/:id", deleteFoundLocationV2);

dinoV2Router.post("/upload-image", uploadCoverImageV2);
dinoV2Router.delete("/images/:id", deleteCoverImageV2);

dinoV2Router.post("/upload-article-image", uploadArticleImageV2);
dinoV2Router.delete("/article-images/:id", deleteArticleImageV2);

dinoV2Router.get("/:id/similar", getSimilarDinosV2);
dinoV2Router.get("/:id", getDinoV2);
dinoV2Router.post("/", createDinoV2);
dinoV2Router.put("/:id", updateDinoV2);
dinoV2Router.delete("/:id", deleteDinoV2);

export default dinoV2Router;
