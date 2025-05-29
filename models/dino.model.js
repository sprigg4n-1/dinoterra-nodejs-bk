import mongoose from "mongoose";

const dinoSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Dino name is required"] },
    latinName: { type: String, required: [true, "Dino latinName is required"] },
    description: {
      type: String,
      required: [true, "Dino description is required"],
    },
    typeOfDino: {
      type: String,
      required: [true, "Dino typeOfDino is required"],
      //   enum: []
    },
    length: { type: Number, required: [true, "Dino length is required"] },
    weight: { type: Number, required: [true, "Dino weight is required"] },
    period: {
      type: String,
      required: [true, "Dino period is required"],
      //   enum: [],
    },
    periodDate: {
      type: String,
      required: [true, "Dino peirodDate is required"],
    },
    periodDescription: {
      type: String,
      required: [true, "Dino periodDescription is required"],
    },
    diet: {
      type: String,
      required: [true, "Dino diet is required"],
      //   enum: [],
    },
    dietDescription: {
      type: String,
      required: [true, "Dino dietDescription is required"],
    },
  },
  { timestamps: true }
);

const Dino = mongoose.model("Dino", dinoSchema);

export default Dino;
