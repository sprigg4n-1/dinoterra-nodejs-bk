import mongoose from "mongoose";

const favoriteDinoSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dino",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

favoriteDinoSchema.index({ user: 1, dino: 1 }, { unique: true });

const FavoriteDino = mongoose.model("FavoriteDino", favoriteDinoSchema);

export default FavoriteDino;
