import mongoose from "mongoose";

const expeditionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Expedition name is required"],
    },
    description: {
      type: String,
      required: [true, "Expedition description is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Expedition start date is required"],
    },
    endDate: {
      type: Date,
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoundLocation",
      required: [true, "Expedition location is required"],
    },
    archaeologists: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Archaeologist",
      },
    ],
    discoveredDinos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Dino",
      },
    ],
  },
  { timestamps: true }
);

const Expedition = mongoose.model("Expedition", expeditionSchema);

export default Expedition;
