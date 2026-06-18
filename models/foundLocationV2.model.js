import mongoose from "mongoose";

const foundLocationV2Schema = new mongoose.Schema(
  {
    place: {
      uk: { type: String, required: [true, "Ukrainian place is required"] },
      en: { type: String, required: [true, "English place is required"] },
    },
    latitude: { type: Number, required: [true, "Latitude is required"] },
    longitude: { type: Number, required: [true, "Longitude is required"] },
    dino: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DinoV2",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const FoundLocationV2 = mongoose.model("FoundLocationV2", foundLocationV2Schema);

export default FoundLocationV2;
