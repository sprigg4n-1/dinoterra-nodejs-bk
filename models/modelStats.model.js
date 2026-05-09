import mongoose from "mongoose";

const modelStatsSchema = new mongoose.Schema(
  {
    totalPredictions: { type: Number, default: 0 },
    totalFeedback: { type: Number, default: 0 },
    correctFeedback: { type: Number, default: 0 },
    wrongFeedback: { type: Number, default: 0 },
    unknownFeedback: { type: Number, default: 0 },
    rankStats: {
      top1: { type: Number, default: 0 },
      top2: { type: Number, default: 0 },
      top3: { type: Number, default: 0 },
      correctNonDino: { type: Number, default: 0 }, // ← правильно не динозавр
    },
    errorStats: {
      wrongSpecies: { type: Number, default: 0 },
      falseNegative: { type: Number, default: 0 },
      falsePositive: { type: Number, default: 0 },
      newSpecies: { type: Number, default: 0 },
    },
    pendingRetrain: { type: Number, default: 0 },
    lastRetrain: { type: Date, default: null },
    lastRetrainResults: {
      stage1: {
        valAccuracy: { type: Number, default: null },
        valLoss: { type: Number, default: null },
      },
      stage2Dino: {
        valAccuracy: { type: Number, default: null },
        valLoss: { type: Number, default: null },
      },
    },
  },
  { timestamps: true },
);

const ModelStats = mongoose.model("ModelStats", modelStatsSchema);

export default ModelStats;
