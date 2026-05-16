import mongoose from "mongoose";

const epochStatsSchema = new mongoose.Schema(
  {
    accuracy: [Number],
    valAccuracy: [Number],
    loss: [Number],
    valLoss: [Number],
  },
  { _id: false },
);

const stageResultSchema = new mongoose.Schema(
  {
    valAccuracy: { type: Number, default: null },
    valLoss: { type: Number, default: null },
    epochs: { type: Number, default: null },
    history: { type: epochStatsSchema, default: null },
  },
  { _id: false },
);

const retrainHistorySchema = new mongoose.Schema(
  {
    startedAt: { type: Date, required: true },
    finishedAt: { type: Date, default: null },
    imagesUsed: { type: Number, default: 0 },
    newClasses: { type: [String], default: [] },
    stage1: { type: stageResultSchema, default: null },
    stage2: { type: stageResultSchema, default: null },
    status: {
      type: String,
      enum: ["RUNNING", "DONE", "FAILED"],
      default: "RUNNING",
    },
  },
  { timestamps: true },
);

const RetrainHistory = mongoose.model("RetrainHistory", retrainHistorySchema);

export default RetrainHistory;
