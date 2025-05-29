import mongoose from "mongoose";

const foundLocationSchema = new mongoose.Schema(
  {
    place: { type: String, required: [true, "Location place is required"] },
    latitude: { type: Number, required: [true, "Latitude is required"] },
    longitude: {
      type: Number,
      required: [true, "Longitude place is required"],
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

const FoundLocation = mongoose.model("FoundLocation", foundLocationSchema);

export default FoundLocation;
