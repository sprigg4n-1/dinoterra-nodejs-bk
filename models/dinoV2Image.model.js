import mongoose from "mongoose";

// Cover / gallery images — shown in catalog cards and dino page header
const dinoV2ImageSchema = new mongoose.Schema(
  {
    file: { type: String, required: true },
    isMain: { type: Boolean, default: false },
    dino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DinoV2",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const DinoV2Image = mongoose.model("DinoV2Image", dinoV2ImageSchema);

export default DinoV2Image;
