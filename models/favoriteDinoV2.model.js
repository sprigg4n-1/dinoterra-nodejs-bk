import mongoose from "mongoose";

const favoriteDinoV2Schema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DinoV2",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

favoriteDinoV2Schema.index({ user: 1, dino: 1 }, { unique: true });

const FavoriteDinoV2 = mongoose.model("FavoriteDinoV2", favoriteDinoV2Schema);

export default FavoriteDinoV2;
