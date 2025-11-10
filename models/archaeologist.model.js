import mongoose from "mongoose";

const archaeologistSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "Archaeologist first name is required"],
    },
    lastName: {
      type: String,
      required: [true, "Archaeologist last name is required"],
    },
    specialization: {
      type: String,
      required: [true, "Specialization is required"],
    },
    experienceYears: {
      type: Number,
      required: [true, "Years of experience are required"],
    },
    bio: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

const Archaeologist = mongoose.model("Archaeologist", archaeologistSchema);

export default Archaeologist;
