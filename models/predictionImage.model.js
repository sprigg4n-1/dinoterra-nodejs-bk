import mongoose from "mongoose";

const predictionImageSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    mimeType: { type: String, required: true },
    prediction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prediction",
      required: true,
      index: true,
    },
    usedForRetrain: { type: Boolean, default: false },
    correctClass: { type: String, default: null },
    errorType: { type: String, default: null },
  },
  { timestamps: true },
);

const PredictionImage = mongoose.model(
  "PredictionImage",
  predictionImageSchema,
);

export default PredictionImage;
