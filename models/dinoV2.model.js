import mongoose from "mongoose";

const dinoV2Schema = new mongoose.Schema(
  {
    name: {
      uk: { type: String, required: [true, "Ukrainian name is required"] },
      en: { type: String, required: [true, "English name is required"] },
    },
    latinName: {
      type: String,
      required: [true, "Latin name is required"],
      unique: true,
    },
    typeOfDino: {
      type: String,
      required: [true, "Type is required"],
    },
    period: {
      type: String,
      required: [true, "Period is required"],
    },
    periodDate: {
      type: String,
      required: [true, "Period date is required"],
    },
    diet: {
      type: String,
      required: [true, "Diet is required"],
    },
    length: {
      type: Number,
      required: [true, "Length is required"],
    },
    weight: {
      type: Number,
      required: [true, "Weight is required"],
    },
    // TipTap JSON per language
    article: {
      uk: { type: mongoose.Schema.Types.Mixed, default: null },
      en: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  { timestamps: true }
);

const DinoV2 = mongoose.model("DinoV2", dinoV2Schema);

export default DinoV2;
