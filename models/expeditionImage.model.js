import mongoose from "mongoose";

const expeditionImageSchema = new mongoose.Schema(
  {
    file: {
      type: String,
      required: [true, "Expedition image file is required"],
    },
    description: {
      type: String,
      required: false,
    },
    expedition: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expedition",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const ExpeditionImage = mongoose.model(
  "ExpeditionImage",
  expeditionImageSchema
);

export default ExpeditionImage;
