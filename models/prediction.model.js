import mongoose from "mongoose";

const top3ItemSchema = new mongoose.Schema(
  {
    rank: { type: Number, required: true },
    species: { type: String, required: true },
    confidence: { type: Number, required: true },
  },
  { _id: false },
);

const feedbackSchema = new mongoose.Schema(
  {
    isCorrect: { type: Boolean, required: true },
    errorType: {
      type: String,
      enum: ["WRONG_SPECIES", "FALSE_NEGATIVE", "FALSE_POSITIVE", null],
      default: null,
    },
    correctRank: { type: Number, default: null }, // 1, 2, 3 якщо правильно
    correctClass: { type: String, default: null }, // якщо юзер знає вид
    givenBy: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
    givenAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const predictionSchema = new mongoose.Schema(
  {
    predictionId: { type: String, required: true, unique: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    isDinosaur: { type: Boolean, required: true },
    stage1Probability: { type: Number, required: true },
    top3: { type: [top3ItemSchema], required: true },
    feedback: { type: feedbackSchema, default: null },
  },
  { timestamps: true },
);

const Prediction = mongoose.model("Prediction", predictionSchema);

export default Prediction;
