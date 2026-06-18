import { Router } from "express";

import authorize from "../middlewares/auth.middleware.js";

import {
  deletePhoto,
  getPhoto,
  getUser,
  getUsers,
  uploadPhoto,
  getFavoriteDinosV2,
  addFavoriteDinoV2,
  deleteFavoriteDinoV2,
  isFavoriteDinoV2,
} from "../controllers/user.controller.js";

const userRouter = Router();

userRouter.get("/", getUsers);
userRouter.get("/:id", getUser);
userRouter.post("/", (req, res) => res.send({ title: "CREATE new user" }));
userRouter.put("/:id", (req, res) => res.send({ title: "UPDATE user" }));
userRouter.delete("/:id", (req, res) => res.send({ title: "DELETE user" }));

userRouter.get("/images/:id", getPhoto);
userRouter.post("/upload-image", uploadPhoto);
userRouter.delete("/images/:id", deletePhoto);

userRouter.get("/:userId/favorites", getFavoriteDinosV2);
userRouter.post("/favorites", addFavoriteDinoV2);
userRouter.delete("/:userId/favorites/:dinoId", deleteFavoriteDinoV2);
userRouter.get("/:userId/favorites/check/:dinoId", isFavoriteDinoV2);

export default userRouter;
