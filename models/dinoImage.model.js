import mongoose from "mongoose";

const dinoImageSchema = new mongoose.Schema(
  {
    file: { type: String },
    dino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dino",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const DinoImage = mongoose.model("DinoImage", dinoImageSchema);

export default DinoImage;
