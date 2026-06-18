import mongoose from "mongoose";

// Images uploaded for use inside TipTap article content.
// Workflow: upload → get back { _id, file } → TipTap inserts file (base64) as image src.
const dinoV2ArticleImageSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    caption: {
      uk: { type: String, default: "" },
      en: { type: String, default: "" },
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

const DinoV2ArticleImage = mongoose.model(
  "DinoV2ArticleImage",
  dinoV2ArticleImageSchema
);

export default DinoV2ArticleImage;
