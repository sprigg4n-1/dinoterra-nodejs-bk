import mongoose from "mongoose";

const userImageSchema = new mongoose.Schema(
  {
    file: { type: String },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      uniqe: true,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

const UserImage = mongoose.model("UserImage", userImageSchema);

export default UserImage;
