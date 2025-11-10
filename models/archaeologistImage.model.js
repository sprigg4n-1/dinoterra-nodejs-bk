import mongoose from "mongoose";

const archaeologistImageSchema = new mongoose.Schema(
  {
    file: {
      type: String,
      required: [true, "Image file URL is required"],
    },
    description: {
      type: String,
      required: false,
    },
    archaeologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Archaeologist",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const ArchaeologistImage = mongoose.model(
  "ArchaeologistImage",
  archaeologistImageSchema
);

export default ArchaeologistImage;
