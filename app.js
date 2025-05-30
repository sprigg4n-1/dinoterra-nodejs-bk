import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { PORT } from "./config/env.js";

import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import dinoRouter from "./routes/dino.routes.js";

import connectToDatabase from "./database/mongodb.js";

import errorMiddleleware from "./middlewares/error.middleware.js";
import arcjetMiddlewares from "./middlewares/arcjet.middleware.js";

const app = express();

const privateCors = cors({
  origin: [
    "http://localhost:3000",
    "https://dinoterra-164h.vercel.app",
    "https://dinoterra-nodejs-bk.onrender.com",
  ],
  credentials: true,
});

const publicCors = cors();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));
app.use(cookieParser());
// app.use(arcjetMiddlewares);

app.use("/api/v1/auth", privateCors, authRouter);
app.use("/api/v1/users", publicCors, userRouter);
app.use("/api/v1/dinos", publicCors, dinoRouter);

app.use(errorMiddleleware);

app.get("/", (req, res) => {
  res.send("Welcome to the DinoTerra API!");
});

app.listen(PORT, async () => {
  console.log(`DinoTerra API is running on http://localhost:${PORT}`);

  await connectToDatabase();
});

export default app;
