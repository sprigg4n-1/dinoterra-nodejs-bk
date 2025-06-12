import { Router } from "express";

import authorize from "../middlewares/auth.middleware.js";

import {
  deletePhoto,
  getPhoto,
  getUser,
  getUsers,
  uploadPhoto,
  getFavoriteDinos,
  addFavoriteDino,
  deleteFavoriteDino,
  isFavoriteDino,
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

userRouter.get("/:userId/favorites", getFavoriteDinos);
userRouter.post("/favorites", addFavoriteDino);
userRouter.delete("/:userId/favorites/:dinoId", deleteFavoriteDino);
userRouter.get("/:userId/favorites/check/:dinoId", isFavoriteDino);

export default userRouter;
